import dataAggregator from './providers/DataAggregator.js';
import priceIndexService from './PriceIndexService.js';
import { calculateDistance } from '../utils/distance.js';
import { Product, Store, ShoppingItem, Location } from '../types/index.js';
import { ApiError } from '../middleware/errorHandler.js';
import { selectBestProductForStore, selectBestProductForStoreWithQuery, getProductMatchLevel, MatchLevel } from '../utils/matching.js';


interface ProductWithPrice extends Product {
    totalPrice: number;
    quantity: number;
    originalQueryName?: string; // Standardized field name for user input
}

interface SingleStoreOption {
    store: Store;
    items: ProductWithPrice[];
    totalCost: number;
    distance: number;
    availabilityScore: number; // 0 to 1 (e.g., 0.8 = 80% of items found)
    missingItems: string[];
    missedPreferences?: Array<{ itemName: string; expected: string; found: string }>;
}

interface MultiStoreOption {
    stores: Array<{
        store: Store;
        items: ProductWithPrice[];
        cost: number;
        distance: number;
    }>;
    totalCost: number;
    totalDistance: number;
    savings: number;
    savingsPercent: number;
    lockedItemsCount?: number;
}

export interface RouteOptimizationResult {
    singleStore: SingleStoreOption | null;
    multiStore: MultiStoreOption | null;
    recommendation: 'single' | 'multi';
    reasoning: string;
    singleStoreReasoning?: string;
    multiStoreReasoning?: string;
    singleStoreCandidates?: SingleStoreOption[];
    allNearbyStores?: Store[];
    missedPreferences?: Array<{ itemName: string; expected: string; found: string }>;
}

/**
 * Service to calculate optimal shopping routes using Availability-First Logic.
 */
class RouteService {
    /**
     * Calculates the optimal route for a shopping list.
     */
    public async calculateOptimalRoute(
        items: ShoppingItem[],
        userLocation: Location,
        stores: Store[],
        options: {
            maxStores: number;
            maxDistance: number;
            excludedChains?: string[];
            sortBy?: 'cheapest' | 'closest' | 'stops';
        } = { maxStores: 3, maxDistance: 10000, sortBy: 'cheapest' }
    ): Promise<RouteOptimizationResult> {
        try {
            // 0. Filter stores
            const validStores = this.filterStores(stores, options.excludedChains);
            if (validStores.length === 0) {
                return this.createEmptyResult('No stores available after filtering.');
            }

            // 1. Fetch & Canonicalize Products
            const uniqueChains = Array.from(new Set(validStores.map(s => s.chain)));
            const searchPromises = items.map(item =>
                dataAggregator.searchProductsWithChainVariety(
                    [item.name],
                    uniqueChains,
                    {
                        location: userLocation,
                        radius: (options.maxDistance || 10000) / 1000,
                        lockedStore: item.lockedStore,
                        lockedProduct: item.lockedBrand
                    }
                )
            );

            const searchResults = await Promise.all(searchPromises);

            // Merge all results
            const allProducts: Product[] = [];
            const queryMapping = new Map<string, string[]>();

            for (const result of searchResults) {
                if (!result) {
                    console.warn('[RouteService] One of the search results was undefined. Skipping.');
                    continue;
                }
                allProducts.push(...(result.products || []));
                if (result.queryMapping) {
                    for (const [q, ids] of result.queryMapping.entries()) {
                        queryMapping.set(q, ids);
                    }
                }
            }

            console.log(`[RouteService] Found ${allProducts.length} total products. Query mapping keys: ${Array.from(queryMapping.keys()).join(', ')}`);
            for (const [q, ids] of queryMapping.entries()) {
                console.log(`  - Query "${q}": ${ids.length} products`);
            }

            // 1b. Explicitly Fetch Missing Locked Products
            // If a user locked a specific product ID that wasn't found in the general search (e.g. out of top 100),
            // we must fetch it to ensure the preference is respected.
            const lockedIds = items
                .filter(i => i.lockedProductId && !queryMapping.get(i.name)?.includes(i.lockedProductId))
                .map(i => i.lockedProductId!)
                .filter(id => !allProducts.some(p => String(p.id) === id));

            if (lockedIds.length > 0) {
                console.log(`[RouteService] Fetching ${lockedIds.length} missing locked products explicitly...`);
                try {
                    const extraProducts = await Promise.all(lockedIds.map(id => dataAggregator.getProductById(id)));

                    // Merge into main list
                    for (const p of extraProducts) {
                        if (p) {
                            allProducts.push(p);
                            // Update mapping for the relevant item
                            const matchingItem = items.find(i => i.lockedProductId === String(p.id));
                            if (matchingItem) {
                                const currentIds = queryMapping.get(matchingItem.name) || [];
                                currentIds.push(String(p.id));
                                queryMapping.set(matchingItem.name, currentIds);
                            }
                        }
                    }
                    console.log(`[RouteService] Successfully added ${extraProducts.length} locked items.`);
                } catch (err) {
                    console.error('[RouteService] Failed to fetch some locked products:', err);
                }
            }

            // 2. Score Stores (Availability > Cost)
            // No longer using GeminiCanonicalMapper - using direct search-to-query mapping
            const rankedStores = this.scoreAndRankStores(
                validStores,
                allProducts,
                queryMapping,
                items,
                userLocation
            );

            console.log(`[RouteService] Ranked stores: ${rankedStores.length}`);
            if (rankedStores.length > 0) {
                console.log(`  - Top store: ${rankedStores[0].store.name} (${rankedStores[0].availabilityScore * 100}% coverage)`);
            }

            const bestSingleStore = rankedStores.length > 0 ? rankedStores[0] : null;

            // 3. Smart Route Optimization (Combinatorial)
            // Use top 5 stores to find optimal combination (max 3 stores)
            const topCandidates = rankedStores.slice(0, 5);
            const smartRouteOption = this.calculateSmartRoute(
                items,
                topCandidates,
                bestSingleStore
            );

            // 4. Alternative Candidates (Spec: >70% items found & cost < 1.25x best)
            // Filter alternatives from the ranked list (excluding the best store itself)
            // Phase 2: Store Variety (Chain Diversity)
            const seenChains = new Set<string>();
            if (bestSingleStore) {
                let initialChain = bestSingleStore.store.chain.toLowerCase().trim();
                if (initialChain.includes('coop')) initialChain = 'coop';
                seenChains.add(initialChain);
            }

            const alternatives = rankedStores.slice(1).filter(store => {
                const satisfiesAvailability = store.availabilityScore >= 0.30;
                const satisfiesCost = bestSingleStore ? store.totalCost <= bestSingleStore.totalCost * 2.0 : true;

                // Chain Diversity: We want to show the best store from DIFFERENT chains if possible
                let chainKey = store.store.chain.toLowerCase().trim();
                if (chainKey.includes('coop')) chainKey = 'coop';

                const isNewChain = !seenChains.has(chainKey);

                if (satisfiesAvailability && satisfiesCost && isNewChain) {
                    seenChains.add(chainKey);
                    return true;
                }
                return false;
            });

            // 5. Generate Recommendation
            const result = this.generateRecommendation(bestSingleStore, smartRouteOption);

            // Attach metadata - Increased limit from 4 to 6 for better variety
            result.singleStoreCandidates = [bestSingleStore, ...alternatives].filter((s): s is SingleStoreOption => !!s).slice(0, 6);
            result.allNearbyStores = validStores;
            result.missedPreferences = bestSingleStore?.missedPreferences;

            return result;

        } catch (error: any) {
            console.error('[RouteService] Error calculating optimal route:', error);
            throw new ApiError(500, `Failed to calculate optimal shopping route: ${error.message || 'Unknown error'}`);
        }
    }

    private filterStores(stores: Store[], excludedChains?: string[]): Store[] {
        if (!excludedChains || excludedChains.length === 0) return stores;
        return stores.filter(s => {
            const storeChain = s.chain.toLowerCase().trim();
            return !excludedChains.some(excluded => excluded.toLowerCase().trim() === storeChain);
        });
    }

    private scoreAndRankStores(
        stores: Store[],
        allProducts: Product[],
        queryMapping: Map<string, string[]>,
        items: ShoppingItem[],
        userLocation: Location
    ): SingleStoreOption[] {
        const results: SingleStoreOption[] = [];

        // 0. Pre-calculate "Best Content" map for enrichment
        // For each query (item name), find the product with the best image/ingredients across ALL stores
        const bestContentMap = new Map<string, Product>();
        for (const item of items) {
            const searchLabel = item.name;
            const productIdsForThisQuery = queryMapping.get(searchLabel) || [];

            // Find all products matching this query
            const candidates = allProducts.filter(p => productIdsForThisQuery.includes(String(p.id)));

            // Sort by content quality: Image + Ingredient > Image > Ingredient > Nothing
            const bestContent = candidates.sort((a, b) => {
                const scoreA = (a.image_url ? 2 : 0) + (a.ingredients ? 1 : 0);
                const scoreB = (b.image_url ? 2 : 0) + (b.ingredients ? 1 : 0);
                return scoreB - scoreA;
            })[0];

            if (bestContent) {
                bestContentMap.set(searchLabel, bestContent);
            }
        }

        for (const store of stores) {
            // Use shared matching utility to find the best candidate per store/query
            const foundItems: ProductWithPrice[] = [];
            let storeTotalCost = 0;
            let storeSortingPenalty = 0;
            const foundCanonicalIds = new Set<string>();

            const missedPrefsForStore: Array<{ itemName: string; expected: string; found: string }> = [];

            // Map products back to their search terms (queries)
            for (const item of items) {
                const searchLabel = item.name;
                const productIdsForThisQuery = queryMapping.get(searchLabel) || [];

                // SPECIFIC PRODUCT LOCKING LOGIC
                let matchResult: { product: Product, level: MatchLevel } | null = null;
                let isMissedPreference = false;

                if (item.lockedProductId) {
                    // Check if this store has this specific product (by Exact Name or ID)
                    const candidates = allProducts.filter(p => productIdsForThisQuery.includes(String(p.id)));
                    const exactMatch = candidates.find(p =>
                        getProductMatchLevel(p, store) !== MatchLevel.NONE &&
                        (p.name === item.lockedProductId || String(p.id) === item.lockedProductId)
                    );

                    if (exactMatch) {
                        matchResult = { product: exactMatch, level: getProductMatchLevel(exactMatch, store) };
                    } else {
                        // Store misses the specific item -> Fallback
                        // Use new method with query context for better relevance
                        matchResult = selectBestProductForStoreWithQuery(allProducts, store, productIdsForThisQuery, searchLabel);
                        isMissedPreference = true;
                    }
                } else {
                    // Use new method with query context for better relevance
                    matchResult = selectBestProductForStoreWithQuery(allProducts, store, productIdsForThisQuery, searchLabel);
                }

                if (matchResult) {
                    const { product: best, level: matchLevel } = matchResult;
                    const quantity = item.quantity;
                    const totalPrice = best.price * quantity;

                    // ENRICHMENT: Only enrich the image if the current product lacks one
                    const enrichedProduct = { ...best };
                    const bestContent = bestContentMap.get(searchLabel);

                    if (bestContent) {
                        if (!enrichedProduct.image_url && bestContent.image_url) {
                            enrichedProduct.image_url = bestContent.image_url;
                        }
                    }

                    // Check if we missed a preference (double check logic)
                    if (isMissedPreference && item.lockedProductId) {
                        missedPrefsForStore.push({
                            itemName: item.name,
                            expected: item.lockedProductId,
                            found: best.name
                        });
                        // PENALTY: Make this store less likely to be "Best Store" without artificially inflating cost
                        storeSortingPenalty += 1000;
                    }

                    // BRANCH MATCH BONUS (Bias Mitigation):
                    // If the match is only at CHAIN or PARENT level (not BRANCH), apply a small penalty.
                    // This favors stores with EXPLICIT pricing data over stores generic chain data.
                    if (matchLevel < MatchLevel.BRANCH) {
                        storeSortingPenalty += 0.5; // Small heuristic penalty
                    }

                    foundItems.push({
                        ...enrichedProduct,
                        totalPrice,
                        quantity,
                        originalQueryName: searchLabel
                    });
                    storeTotalCost += totalPrice;
                    foundCanonicalIds.add(searchLabel);
                }
            }

            if (foundItems.length > 0) {
                const availabilityScore = foundCanonicalIds.size / items.length;

                // Calculate Locked Item Coverage
                // How many of the user's SPECIFIC locked requests were actually found in this store?
                const lockedItemsFoundCount = items.reduce((count, item) => {
                    if (!item.lockedProductId) return count;
                    const found = foundItems.find(p => p.originalQueryName === item.name);
                    if (!found) return count;

                    // Check if found product matches lock
                    // LOCKED PRODUCT PRIORITY RE-EVALUATED
                    // The frontend now correctly passes the numeric API ID as lockedProductId.
                    // Meanwhile the locked brand name comes as lockedBrand on the item object.

                    const isIdMatch = String(found.id) === item.lockedProductId;
                    const isNameMatch = item.lockedBrand ? found.name === item.lockedBrand : false;

                    // STORE MATCH BONUS: If user locked "Milk" from "Rema 1000", and this store IS "Rema 1000",
                    // and we found "Milk" (even if ID is slightly different due to mapping), count it!
                    const isStoreMatch = item.lockedStore && store.name.toLowerCase().includes(item.lockedStore.toLowerCase());

                    return (isNameMatch || isIdMatch || isStoreMatch) ? count + 1 : count;
                }, 0);

                const distance = calculateDistance(
                    userLocation.lat, userLocation.lng,
                    store.location.lat, store.location.lng
                );

                results.push({
                    store,
                    items: foundItems,
                    totalCost: storeTotalCost,
                    distance,
                    availabilityScore,
                    missingItems: items.filter(i => !foundCanonicalIds.has(i.name)).map(i => i.name),
                    missedPreferences: missedPrefsForStore,
                    // We can attach custom metrics here if needed for debugging or advanced sorting contexts
                    // (But we'll use local variables in the sort function below)
                    _lockedItemsCount: lockedItemsFoundCount,
                    _sortingPenalty: storeSortingPenalty
                } as any);
            }
        }

        // Output Ranking Logic (Updated for Strict Prioritization):
        // 1. Locked Items Found (Did we get what you specifically asked for?) -> High to Low
        // 2. Availability Score (Did we get everything else?) -> High to Low
        // 3. Total Cost (Is it cheap?) -> Low to High
        // 4. Distance -> Low to High (Tie-breaker only)
        return results.sort((a: any, b: any) => {
            // Priority 1: Specific Locked Items Coverage
            const lockedDiff = (b._lockedItemsCount || 0) - (a._lockedItemsCount || 0);
            if (lockedDiff !== 0) return lockedDiff;

            // Priority 2: General Availability
            if (b.availabilityScore !== a.availabilityScore) {
                return b.availabilityScore - a.availabilityScore;
            }

            // Priority 3: Cost with Penalties Applied
            const costA = a.totalCost + (a._sortingPenalty || 0);
            const costB = b.totalCost + (b._sortingPenalty || 0);
            if (Math.abs(costA - costB) > 0.1) { // Reduced tolerance to 0.1 NOK
                return costA - costB;
            }

            // Priority 4: Distance
            return a.distance - b.distance;
        });
    }


    private calculateSmartRoute(
        items: ShoppingItem[],
        candidates: SingleStoreOption[],
        bestSingleStore: SingleStoreOption | null
    ): MultiStoreOption | null {
        if (!candidates.length || candidates.length < 2) return null;

        const maxLockedPossible = items.filter(i => !!i.lockedProductId).length;
        const baselineLocked = bestSingleStore ? (bestSingleStore as any)._lockedItemsCount || 0 : 0;
        const baselineTotal = bestSingleStore ? bestSingleStore.items.length : 0;
        const baselineCost = bestSingleStore ? bestSingleStore.totalCost : Infinity;

        const combinations = this.generateCombinations(candidates, 3);
        let bestCombo: MultiStoreOption | null = null;
        let maxLockedCount = baselineLocked;
        let maxTotalFound = baselineTotal;
        let minComboCost = baselineCost;

        for (const combo of combinations) {
            const { totalCost, missingCount, lockedFoundCount, storeAllocations } = this.evaluateCombination(combo, items);
            const totalFound = items.length - missingCount;

            // COMBINATION RANKING LOGIC:
            // 1. More Locked Products = BETTER
            // 2. More Overall Products = BETTER
            // 3. Lower Cost = BETTER

            const isStrictlyBetterFound = (lockedFoundCount > maxLockedCount) || (lockedFoundCount === maxLockedCount && totalFound > maxTotalFound);
            const isSameFoundButCheaper = (lockedFoundCount === maxLockedCount && totalFound === maxTotalFound && totalCost < minComboCost - 2); // 2 NOK buffer

            if (isStrictlyBetterFound || isSameFoundButCheaper) {
                // Update baselines for this search
                maxLockedCount = lockedFoundCount;
                maxTotalFound = totalFound;
                minComboCost = totalCost;

                const stores = combo.map(c => {
                    const allocation = storeAllocations.get(String(c.store.id));
                    return {
                        store: c.store,
                        items: allocation?.items || [],
                        cost: allocation?.cost || 0,
                        distance: c.distance
                    };
                }).filter(s => s.items.length > 0);

                stores.sort((a, b) => a.distance - b.distance);

                bestCombo = {
                    stores,
                    totalCost,
                    totalDistance: stores.reduce((sum, s) => sum + s.distance, 0),
                    savings: 0,
                    savingsPercent: 0,
                    lockedItemsCount: maxLockedCount
                };
            }
        }

        // Final Verify: Is this combo actually better than the single store?
        if (!bestCombo || bestCombo.stores.length <= 1) return null;

        // If it's more expensive AND has same/fewer items, reject
        if (bestCombo.totalCost >= baselineCost && maxTotalFound <= baselineTotal && maxLockedCount <= baselineLocked) {
            return null;
        }

        return bestCombo;
    }

    private evaluateCombination(combo: SingleStoreOption[], items: ShoppingItem[]) {
        // For every item, pick the best candidate across the combination stores
        // Optimization: Respect the locks!
        const storeAllocations = new Map<string, { items: ProductWithPrice[], cost: number }>();
        let totalCost = 0;
        let foundCount = 0;
        let lockedFoundCount = 0;

        combo.forEach(c => storeAllocations.set(String(c.store.id), { items: [], cost: 0 }));

        for (const item of items) {
            let bestStoreId: string | null = null;
            let bestProduct: ProductWithPrice | null = null;
            let isItemLockedMatch = false;

            // 1. Check for Locked Product Match first across all stores in combo
            if (item.lockedProductId) {
                for (const storeOption of combo) {
                    const product = storeOption.items.find(p =>
                        p.name === item.lockedProductId || String(p.id) === item.lockedProductId
                    );

                    if (product) {
                        // Bonus: If this product is in the 'lockedStore', it's the absolute winner
                        const isIdealStore = item.lockedStore && storeOption.store.name.toLowerCase().includes(item.lockedStore.toLowerCase());

                        if (!bestProduct || isIdealStore || !isItemLockedMatch) {
                            bestProduct = product;
                            bestStoreId = String(storeOption.store.id);
                            isItemLockedMatch = true;
                            if (isIdealStore) break; // Found the perfect match
                        }
                    }
                }
            }

            // 2. If no locked match found (or no lock), Fallback to Cheapest available in combo
            if (!bestProduct) {
                let minPrice = Infinity;
                for (const storeOption of combo) {
                    const product = storeOption.items.find(p =>
                        (p.originalQueryName || p.name).toLowerCase().trim() === item.name.toLowerCase().trim()
                    );
                    if (product && product.totalPrice < minPrice) {
                        minPrice = product.totalPrice;
                        bestStoreId = String(storeOption.store.id);
                        bestProduct = product;
                    }
                }
            }

            if (bestStoreId && bestProduct) {
                const alloc = storeAllocations.get(bestStoreId)!;
                alloc.items.push(bestProduct);
                alloc.cost += bestProduct.totalPrice;
                totalCost += bestProduct.totalPrice;
                foundCount++;
                if (isItemLockedMatch) lockedFoundCount++;
            }
        }

        return {
            totalCost,
            missingCount: items.length - foundCount,
            lockedFoundCount,
            storeAllocations
        };
    }

    private generateCombinations(candidates: SingleStoreOption[], maxSize: number): SingleStoreOption[][] {
        const result: SingleStoreOption[][] = [];

        const f = (start: number, current: SingleStoreOption[]) => {
            if (current.length >= 2) result.push([...current]);
            if (current.length === maxSize) return;

            for (let i = start; i < candidates.length; i++) {
                f(i + 1, [...current, candidates[i]]);
            }
        };

        f(0, []);
        return result;
    }

    private generateRecommendation(
        single: SingleStoreOption | null,
        multi: MultiStoreOption | null
    ): RouteOptimizationResult {
        if (!single && !multi) {
            return this.createEmptyResult('No stores found matching your items.');
        }

        if (multi && single) {
            const absoluteSavings = single.totalCost - multi.totalCost;
            multi.savings = Math.max(0, absoluteSavings);
            multi.savingsPercent = single.totalCost > 0 ? (absoluteSavings / single.totalCost) * 100 : 0;
        }

        // If Multi exists, it BY DEFINITION matches requirements better or is cheaper (due to logic in calculateSmartRoute)
        if (multi && multi.stores.length > 1) {
            // Verify savings are "Genuine" (> 10 NOK or some threshold? User said "Strictly lower")
            // We stick to strictly lower.
            const savings = multi.savings;
            const stops = multi.stores.length;

            return {
                singleStore: single,
                multiStore: multi,
                recommendation: 'multi',
                reasoning: multi.savings > 0
                    ? `Found a route with better prices and ${multi.lockedItemsCount || 0} of your preferred products.`
                    : `Smart Route provides better coverage for your specific product preferences.`,
                singleStoreReasoning: single ? `Convenient one-stop shop at ${single.store.name}.` : 'No single store has all items.',
                multiStoreReasoning: `Smart Route prioritizes your locked choices and lowest regional prices.`
            };
        }

        return {
            singleStore: single,
            multiStore: null,
            recommendation: 'single',
            reasoning: single ? `Best value found at ${single.store.name}.` : 'Best available option.',
            singleStoreReasoning: 'Best single store option.',
            multiStoreReasoning: 'No smart route offered genuine savings.'
        };
    }

    private createEmptyResult(msg: string): RouteOptimizationResult {
        return {
            singleStore: null,
            multiStore: null,
            recommendation: 'single',
            reasoning: msg,
            singleStoreCandidates: []
        };
    }
}

export const routeService = new RouteService();
export default routeService;

