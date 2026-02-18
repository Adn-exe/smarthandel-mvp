import dataAggregator from './providers/DataAggregator.js';
import { calculateDistance } from '../utils/distance.js';
import { Product, Store, ShoppingItem, Location } from '../types/index.js';
import { ApiError } from '../middleware/errorHandler.js';

interface ProductWithPrice extends Product {
    totalPrice: number;
    quantity: number;
}

interface SingleStoreOption {
    store: Store;
    items: ProductWithPrice[];
    totalCost: number;
    distance: number;
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
 * Service to calculate optimal shopping routes and estimate travel costs.
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
            // 0. Filter stores based on excluded chains
            const validStores = options.excludedChains && options.excludedChains.length > 0
                ? stores.filter(s => {
                    const storeChain = s.chain.toLowerCase().trim();
                    return !options.excludedChains?.some(excluded =>
                        excluded.toLowerCase().trim() === storeChain
                    );
                })
                : stores;

            if (validStores.length === 0) {
                return {
                    singleStore: null,
                    multiStore: null,
                    recommendation: 'single',
                    reasoning: 'No stores available after filtering.',
                    singleStoreCandidates: []
                };
            }

            // 1. Gather all possible products for all items across all stores
            // (Simplified: using searchProducts for each item)
            // Optimization: We could filter products by chain here too, but checking store match later is safer
            const itemToProductsMap: Record<string, Product[]> = {};
            for (const item of items) {
                let products: Product[] = [];
                try {
                    products = await dataAggregator.searchProducts(item.name, {
                        suggestedCategory: item.suggestedCategory,
                        location: userLocation,
                        radius: (options.maxDistance || 10000) / 1000 // Convert meters to km
                    });
                } catch (error) {
                    console.warn(`[RouteService] Failed to search for "${item.name}", skipping. Error:`, (error as any)?.message || error);
                }
                // Keep ALL products (no chain-filtering) — products from the Kassal API
                // have chain-level store names (Joker, SPAR, Meny etc.) that don't match
                // physical store chains (Rema 1000, Kiwi, Bunnpris etc.).
                // Each physical store will be assigned the cheapest available product.
                itemToProductsMap[item.name] = products;
            }

            // 2. Calculate Single-Store Options (Get Top 8)
            const singleStoreCandidates = this.calculateBestSingleStores(items, userLocation, validStores, itemToProductsMap, options);
            const bestSingleStore = singleStoreCandidates.length > 0 ? singleStoreCandidates[0] : null;

            // 3. Calculate Multi-Store Option (Greedy Algorithm)
            const multiStoreOption = this.calculateBestMultiStore(
                items,
                userLocation,
                validStores,
                itemToProductsMap,
                options
            );

            // 4. Recommendation Logic
            const result = this.generateRecommendation(bestSingleStore, multiStoreOption);

            // Attach candidates and all stores for map context
            result.singleStoreCandidates = singleStoreCandidates;
            result.allNearbyStores = validStores;

            return result;

        } catch (error) {
            console.error('[RouteService] Error calculating optimal route:', error);
            throw new ApiError(500, 'Failed to calculate optimal shopping route');
        }
    }


    private calculateBestSingleStores(
        items: ShoppingItem[],
        userLocation: Location,
        stores: Store[],
        itemToProductsMap: Record<string, Product[]>,
        options: { sortBy?: 'cheapest' | 'closest' | 'stops' }
    ): SingleStoreOption[] {
        const results: SingleStoreOption[] = [];

        for (const store of stores) {
            const storeItems: ProductWithPrice[] = [];
            let storeTotalCost = 0;

            for (const shoppingItem of items) {
                const products = itemToProductsMap[shoppingItem.name];
                if (!products || products.length === 0) continue;

                // Pick the cheapest product available (no chain-matching needed)
                const cheapest = products.reduce((best, p) => p.price < best.price ? p : best);

                if (cheapest) {
                    const totalPrice = cheapest.price * shoppingItem.quantity;
                    storeItems.push({
                        ...cheapest,
                        totalPrice,
                        quantity: shoppingItem.quantity,
                        englishName: shoppingItem.englishName,
                        originalQueryName: shoppingItem.name
                    });
                    storeTotalCost += totalPrice;
                }
            }

            if (storeItems.length > 0) {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    store.location.lat,
                    store.location.lng
                );

                results.push({
                    store,
                    items: storeItems,
                    totalCost: storeTotalCost,
                    distance
                });
            }
        }

        // Sort by coverage (number of items) descending, then by open status (open first), then by total cost ascending
        const sorted = results.sort((a, b) => {
            if (b.items.length !== a.items.length) {
                return b.items.length - a.items.length;
            }
            // Prioritize open stores if coverage is the same
            if (a.store.open_now !== b.store.open_now) {
                return b.store.open_now ? 1 : -1;
            }
            return a.totalCost - b.totalCost;
        });

        // Deduplicate stores by ID (defensive)
        const seenStoreIds = new Set<string>();
        const uniqueCandidates: SingleStoreOption[] = [];

        for (const candidate of sorted) {
            const id = String(candidate.store.id);
            if (!seenStoreIds.has(id)) {
                seenStoreIds.add(id);
                uniqueCandidates.push(candidate);
            }
        }

        return uniqueCandidates.slice(0, 8); // Return top 8 unique candidates for better variety
    }

    private calculateBestMultiStore(
        items: ShoppingItem[],
        userLocation: Location,
        availableStores: Store[],
        itemToProductsMap: Record<string, Product[]>,
        options: { maxStores: number; maxDistance: number; sortBy?: 'cheapest' | 'closest' | 'stops' }
    ): MultiStoreOption | null {
        // 1. For each item, find ALL viable store options within maxDistance
        //    Store the top 2 cheapest options per item for diversification
        const itemOptions = new Map<string, { product: Product, store: Store, price: number, distance: number }[]>();

        for (const shoppingItem of items) {
            const products = itemToProductsMap[shoppingItem.name] || [];

            // Track best option per store (nearest store of each chain)
            const bestPerStore = new Map<string, { product: Product, store: Store, price: number, distance: number }>();

            for (const store of availableStores) {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    store.location.lat,
                    store.location.lng
                );

                if (distance > options.maxDistance) continue;

                // Pick the cheapest product available (no chain-matching needed)
                const cheapest = products.length > 0
                    ? products.reduce((best, p) => p.price < best.price ? p : best)
                    : null;

                if (cheapest) {
                    const chainKey = store.chain.toLowerCase().trim();
                    const existing = bestPerStore.get(chainKey);
                    // Keep only the nearest store per chain
                    if (!existing || distance < existing.distance) {
                        bestPerStore.set(chainKey, { product: cheapest, store, price: cheapest.price, distance });
                    }
                }
            }

            // Collect best per chain, sorted by price
            const sorted = Array.from(bestPerStore.values()).sort((a, b) => a.price - b.price);
            if (sorted.length > 0) {
                itemOptions.set(shoppingItem.name, sorted);
            }
        }

        if (itemOptions.size === 0) return null;

        // 2. Greedy assignment: assign each item to cheapest store
        const itemAssignments = new Map<string, { product: Product, store: Store, price: number }>();
        itemOptions.forEach((opts, itemName) => {
            itemAssignments.set(itemName, opts[0]);
        });

        // 3. Diversification: if all items mapped to one store, split some to 2nd-cheapest
        const assignedStoreIds = new Set(Array.from(itemAssignments.values()).map(a => a.store.id.toString()));
        if (assignedStoreIds.size === 1 && items.length >= 2) {
            // Try to move some items to alternate stores for a genuine multi-store route
            for (const [itemName, opts] of itemOptions.entries()) {
                if (opts.length > 1) {
                    // Assign this item to the 2nd cheapest chain
                    itemAssignments.set(itemName, opts[1]);
                    break; // Only move one item to create 2-store route
                }
            }
        }

        // 4. Group items by store
        const storeGroups = new Map<string, { store: Store, items: ProductWithPrice[], cost: number, distance: number }>();
        let totalProductCost = 0;

        itemAssignments.forEach((assignment, itemName) => {
            const shoppingItem = items.find(i => i.name === itemName)!;
            const storeId = assignment.store.id.toString();

            const group = storeGroups.get(storeId) || {
                store: assignment.store,
                items: [],
                cost: 0,
                distance: calculateDistance(userLocation.lat, userLocation.lng, assignment.store.location.lat, assignment.store.location.lng)
            };

            const totalPrice = assignment.price * shoppingItem.quantity;
            group.items.push({
                ...assignment.product,
                totalPrice,
                quantity: shoppingItem.quantity,
                englishName: shoppingItem.englishName
            });
            group.cost += totalPrice;
            totalProductCost += totalPrice;
            storeGroups.set(storeId, group);
        });

        // 5. Sort stores by distance from user
        const sortedStores = Array.from(storeGroups.values()).sort((a, b) => a.distance - b.distance);
        const totalDistance = sortedStores.reduce((acc, s) => acc + s.distance, 0);

        return {
            stores: sortedStores,
            totalCost: totalProductCost,
            totalDistance,
            savings: 0,
            savingsPercent: 0
        };
    }

    private generateRecommendation(
        single: SingleStoreOption | null,
        multi: MultiStoreOption | null
    ): RouteOptimizationResult {
        if (!single && !multi) {
            // Need to return something valid or handle fully in caller
            return {
                singleStore: null,
                multiStore: null,
                recommendation: 'single', // Default fallback
                reasoning: 'No suitable stores found with your preferences.'
            };
        }

        if (!multi || !single) {
            const rec = single ? 'single' : 'multi';
            const count = single ? single.items.length : multi!.stores.reduce((acc, s) => acc + s.items.length, 0);
            const msg = `Found ${count} items. This was the best achievable option with current stock constraints.`;
            return {
                singleStore: single,
                multiStore: multi,
                recommendation: rec as 'single' | 'multi',
                reasoning: msg,
                singleStoreReasoning: msg,
                multiStoreReasoning: msg
            };
        }

        const singleCount = single.items.length;
        const multiCount = multi.stores.reduce((acc, s) => acc + s.items.length, 0);

        const absoluteSavings = single.totalCost - multi.totalCost;

        multi.savings = Math.max(0, absoluteSavings);
        multi.savingsPercent = single.totalCost > 0
            ? Math.max(0, (absoluteSavings / single.totalCost) * 100)
            : 0;

        // 1. Coverage check: If multi finds many more items, it's usually better
        if (multiCount > singleCount && (singleCount < multiCount * 0.8 || multiCount - singleCount >= 2)) {
            const multiReasoning = `Get ${multiCount} items across ${multi.stores.length} stops for ${multi.totalCost.toFixed(0)} NOK. ${single.store.name} only has ${singleCount} items.`;
            return {
                singleStore: single,
                multiStore: multi,
                recommendation: 'multi',
                reasoning: multiReasoning,
                singleStoreReasoning: `Convenient one-stop shop for ${singleCount} items at ${single.totalCost.toFixed(0)} NOK.`,
                multiStoreReasoning: multiReasoning
            };
        }

        // 2. Compare cost
        if (absoluteSavings > 0) {
            const multiReasoning = `Save ${absoluteSavings.toFixed(0)} NOK on groceries by splitting your trip! Total combined cost: ${multi.totalCost.toFixed(0)} NOK.`;
            return {
                singleStore: single,
                multiStore: multi,
                recommendation: 'multi',
                reasoning: multiReasoning,
                singleStoreReasoning: `Convenient one-stop shop at ${single.store.name} for ${single.totalCost.toFixed(0)} NOK.`,
                multiStoreReasoning: multiReasoning
            };
        } else {
            const singleReasoning = `Best choice for value: Buy everything at ${single.store.name} for ${single.totalCost.toFixed(0)} NOK.`;

            return {
                singleStore: single,
                multiStore: multi,
                recommendation: 'single',
                reasoning: singleReasoning,
                singleStoreReasoning: singleReasoning,
                multiStoreReasoning: `Multi-store route would cost an extra ${Math.abs(absoluteSavings).toFixed(0)} NOK.`
            };
        }
    }
}

export const routeService = new RouteService();
export default routeService;
