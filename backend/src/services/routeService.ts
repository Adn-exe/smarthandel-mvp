import dataAggregator from './providers/DataAggregator.js';
import priceIndexService from './PriceIndexService.js';
import { calculateDistance } from '../utils/distance.js';
import { Product, Store, ShoppingItem, Location } from '../types/index.js';
import { ApiError } from '../middleware/errorHandler.js';

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
            const productQueries = items.map(i => i.name);
            const uniqueChains = Array.from(new Set(validStores.map(s => s.chain)));
            const { products: allProducts, queryMapping } = await dataAggregator.searchProductsWithChainVariety(
                productQueries,
                uniqueChains,
                {
                    location: userLocation,
                    radius: (options.maxDistance || 10000) / 1000
                }
            );

            console.log(`[RouteService] Found ${allProducts.length} total products. Query mapping keys: ${Array.from(queryMapping.keys()).join(', ')}`);
            for (const [q, ids] of queryMapping.entries()) {
                console.log(`  - Query "${q}": ${ids.length} products`);
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
            if (bestSingleStore) seenChains.add(bestSingleStore.store.chain.toLowerCase());

            const alternatives = rankedStores.slice(1).filter(store => {
                const satisfiesAvailability = store.availabilityScore >= 0.30;
                const satisfiesCost = bestSingleStore ? store.totalCost <= bestSingleStore.totalCost * 2.0 : true;

                // Chain Diversity: We want to show the best store from DIFFERENT chains if possible
                const chainKey = store.store.chain.toLowerCase().trim();
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
        const requiredCanonicalIds = new Set(items.map(i => i.name)); // Assuming i.name IS the canonical ID from frontend

        for (const store of stores) {
            // Find products for this store that match valid canonical IDs
            const storeName = store.name.toLowerCase().replace(/_/g, ' ');
            const chainName = store.chain.toLowerCase().replace(/_/g, ' ');

            const storeProducts = allProducts.filter(p => {
                const pStore = p.store.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
                const pChain = (p.chain || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

                // Phase 3: Price Accuracy & Matching
                // Prefer matches that mention the exact store name or address
                const isChainMatch = pStore.includes(chainName) || chainName.includes(pStore) ||
                    pChain.includes(chainName) || chainName.includes(pChain);
                const isBranchMatch = pStore.includes(storeName) || storeName.includes(pStore);

                // Extra Loosening: Common parent groups or abbreviations
                const isParentMatch = (pStore.includes('norgesgruppen') && ['meny', 'spar', 'kiwi', 'joker'].some(c => chainName.includes(c))) ||
                    (pStore.includes('coop') && chainName.includes('coop')) ||
                    (pChain.includes('norgesgruppen') && ['meny', 'spar', 'kiwi', 'joker'].some(c => chainName.includes(c)));

                if (isBranchMatch) return true; // Branch specific data is best
                if (isChainMatch) return true; // Chain level is fallback
                if (isParentMatch) return true; // Parent group is a loose fallback

                return false;
            });

            // Select cheapest product per canonical ID
            const foundItems: ProductWithPrice[] = [];
            let storeTotalCost = 0;
            const foundCanonicalIds = new Set<string>();

            // Map products back to their search terms (queries)
            for (const item of items) {
                const searchLabel = item.name;
                // Get all product IDs that were returned for this specific search query
                const productIdsForThisQuery = queryMapping.get(searchLabel) || [];

                // Find candidates in this store that correspond to this search query
                const candidates = storeProducts.filter(p => productIdsForThisQuery.includes(String(p.id)));

                if (candidates.length > 0) {
                    // Pick best candidate: Prioritize Relevance Score, then Price
                    const best = candidates.reduce((best, curr) => {
                        const scoreA = best.relevanceScore ?? 0;
                        const scoreB = curr.relevanceScore ?? 0;
                        const scoreDiff = scoreB - scoreA;

                        // If current item is significantly more relevant (lower score), pick it
                        // Threshold of 2000 corresponds to a minor penalty tier in KassalProvider
                        if (scoreDiff < -2000) return curr;

                        // If best item is significantly more relevant, keep it
                        if (scoreDiff > 2000) return best;

                        // If relevance is similar, pick the cheaper one
                        return curr.price < best.price ? curr : best;
                    });

                    const quantity = item.quantity;
                    const totalPrice = best.price * quantity;

                    foundItems.push({
                        ...best,
                        totalPrice,
                        quantity,
                        originalQueryName: searchLabel // Use exact query to ensure frontend matrix matching works
                    });
                    storeTotalCost += totalPrice;
                    foundCanonicalIds.add(searchLabel);
                }
            }

            if (foundItems.length > 0) {
                const availabilityScore = foundCanonicalIds.size / items.length;
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
                    missingItems: items.filter(i => !foundCanonicalIds.has(i.name)).map(i => i.name)
                });
            }
        }

        // Output Ranking Logic:
        // 1. Availability Score (High to Low)
        // 2. Total Cost (Low to High)
        // Distance is explicitly IGNORED for ranking as requested.
        return results.sort((a, b) => {
            if (b.availabilityScore !== a.availabilityScore) {
                return b.availabilityScore - a.availabilityScore;
            }
            return a.totalCost - b.totalCost;
        });
    }

    private calculateSmartRoute(
        items: ShoppingItem[],
        candidates: SingleStoreOption[],
        bestSingleStore: SingleStoreOption | null
    ): MultiStoreOption | null {
        // User requested: Smart route should only trigger if number of candidate stores is 2 or more
        // (i.e. we need at least 2 stores to consider combinatorics)
        if (!candidates.length || candidates.length < 2) return null;

        // Combinatorial: Check combinations of 2 and 3 stores
        const combinations = this.generateCombinations(candidates, 3);

        let bestCombo: MultiStoreOption | null = null;
        let minComboCost = Infinity;

        // If best single store exists, that's our baseline to beat
        const baselineCost = bestSingleStore?.items.length === items.length ? bestSingleStore.totalCost : Infinity;

        for (const combo of combinations) {
            // 1. Calculate Combined Availability & Cost
            const { totalCost, missingCount, storeAllocations } = this.evaluateCombination(combo, items);

            // 2. Strict Constraints:
            // - Must have 100% availability (missingCount === 0)
            // - Must be STRICTLY cheaper than best single store (if perfect single store exists)
            if (missingCount === 0) {
                // Spec: Prioritize lower total cost AND fewer stores used (stops)
                const isCheaper = totalCost < baselineCost;
                const isBetterThanBest = totalCost < minComboCost;
                const isEqualCostButFewerStops = Math.abs(totalCost - minComboCost) < 0.01 && combo.length < (bestCombo?.stores.length || 4);

                if (isCheaper && (isBetterThanBest || isEqualCostButFewerStops)) {
                    minComboCost = totalCost;

                    // Transform to updated MultiStoreOption format
                    const stores = combo.map(c => {
                        const allocation = storeAllocations.get(String(c.store.id));
                        return {
                            store: c.store,
                            items: allocation?.items || [],
                            cost: allocation?.cost || 0,
                            distance: c.distance
                        };
                    }).filter(s => s.items.length > 0); // Remove stores that contributed 0 items in optimal mix

                    // Re-sort stores by distance for route logic
                    // (Visuals only, does not affect selection)
                    stores.sort((a, b) => a.distance - b.distance);

                    bestCombo = {
                        stores,
                        totalCost,
                        totalDistance: stores.reduce((sum, s) => sum + s.distance, 0),
                        savings: 0, // Calculated later
                        savingsPercent: 0
                    };
                }
            }
        }

        if (bestCombo && bestCombo.stores.length <= 1) {
            return null;
        }

        return bestCombo;
    }

    private evaluateCombination(combo: SingleStoreOption[], items: ShoppingItem[]) {
        // For every item, pick the cheapest available across the combination stores
        const storeAllocations = new Map<string, { items: ProductWithPrice[], cost: number }>();
        let totalCost = 0;
        let foundCount = 0;

        combo.forEach(c => storeAllocations.set(String(c.store.id), { items: [], cost: 0 }));

        for (const item of items) {
            let bestPrice = Infinity;
            let bestStoreId: string | null = null;
            let bestProduct: ProductWithPrice | null = null;

            for (const storeOption of combo) {
                const product = storeOption.items.find(p =>
                    (p.originalQueryName || p.name).toLowerCase().trim() === item.name.toLowerCase().trim()
                );
                if (product) {
                    // Normalize price for comparison
                    if (product.totalPrice < bestPrice) {
                        bestPrice = product.totalPrice;
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
            }
        }

        return {
            totalCost,
            missingCount: items.length - foundCount,
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
                reasoning: `Save ${savings.toFixed(0)} NOK by splitting your trip into ${stops} stops.`, // Availability is 100% guaranteed by loop
                singleStoreReasoning: single ? `Convenient one-stop shop provided by ${single.store.name}.` : 'No single store has all items.',
                multiStoreReasoning: `Smart Route optimizes for lowest price across top stores.`
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

