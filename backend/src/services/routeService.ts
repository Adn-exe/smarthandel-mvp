import kassalService from './kassalService.js';
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
    travelCost: number;
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
    travelCost: number;
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
                    products = await kassalService.searchProducts(item.name, {
                        suggestedCategory: item.suggestedCategory,
                        location: userLocation,
                        radius: (options.maxDistance || 10000) / 1000 // Convert meters to km
                    });
                } catch (error) {
                    console.warn(`[RouteService] Failed to search for "${item.name}", skipping. Error:`, (error as any)?.message || error);
                }
                // Filter products to only include those from valid chains/stores
                itemToProductsMap[item.name] = products.filter(p => {
                    const productStoreName = p.store.toLowerCase();
                    return validStores.some(s => {
                        const chain = s.chain.toLowerCase();
                        const name = s.name.toLowerCase();
                        return productStoreName.includes(chain) || productStoreName.includes(name) || chain.includes(productStoreName);
                    });
                });
            }

            // 2. Calculate Single-Store Options (Get Top 5)
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

    /**
     * Estimates fuel and time cost for a given distance.
     */
    public estimateTravelCost(distanceMeters: number): number {
        const distanceKm = distanceMeters / 1000;
        const FuelCostPerKm = 12; // NOK
        const AvgSpeedKmh = 40; // km/h
        const TimeValuePerMin = 5; // NOK (approx. 300 NOK/hr)

        const fuelCost = distanceKm * FuelCostPerKm;
        const travelTimeMin = (distanceKm / AvgSpeedKmh) * 60;
        const timeCost = travelTimeMin * TimeValuePerMin;

        return fuelCost + timeCost;
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

                const matchingProduct = products.find(p => {
                    const productStore = p.store.toLowerCase().replace(/_/g, ' ').trim();
                    const chain = store.chain.toLowerCase().replace(/_/g, ' ').trim();
                    const name = store.name.toLowerCase().replace(/_/g, ' ').trim();

                    // Direct chain or name inclusion
                    if (productStore.includes(chain) || productStore.includes(name) || chain.includes(productStore)) return true;

                    // Handle "Coop" specific cases (Coop Prix, Coop Mega etc)
                    if (chain.startsWith('coop') && productStore.startsWith('coop')) return true;

                    return false;
                });

                if (matchingProduct) {
                    const totalPrice = matchingProduct.price * shoppingItem.quantity;
                    storeItems.push({
                        ...matchingProduct,
                        totalPrice,
                        quantity: shoppingItem.quantity,
                        englishName: shoppingItem.englishName
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
                    travelCost: this.estimateTravelCost(distance),
                    distance
                });
            }
        }

        // Sort by coverage (number of items) descending, then by open status (open first), then by total cost ascending
        return results.sort((a, b) => {
            if (b.items.length !== a.items.length) {
                return b.items.length - a.items.length;
            }
            // Prioritize open stores if coverage is the same
            if (a.store.open_now !== b.store.open_now) {
                return b.store.open_now ? 1 : -1;
            }
            return (a.totalCost + a.travelCost) - (b.totalCost + b.travelCost);
        }).slice(0, 5); // Return top 5 candidates
    }

    private calculateBestMultiStore(
        items: ShoppingItem[],
        userLocation: Location,
        availableStores: Store[],
        itemToProductsMap: Record<string, Product[]>,
        options: { maxStores: number; maxDistance: number; sortBy?: 'cheapest' | 'closest' | 'stops' }
    ): MultiStoreOption | null {
        // 1. For each item, find the absolute cheapest store within maxDistance
        const itemAssignments = new Map<string, { product: Product, store: Store, price: number }>();

        for (const shoppingItem of items) {
            const products = itemToProductsMap[shoppingItem.name] || [];
            let cheapestOption: { product: Product, store: Store, price: number } | null = null;

            for (const store of availableStores) {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    store.location.lat,
                    store.location.lng
                );

                if (distance > options.maxDistance) continue;

                const matchingProduct = products.find(p => {
                    const productStore = p.store.toLowerCase().replace(/_/g, ' ');
                    const chain = store.chain.toLowerCase().replace(/_/g, ' ');
                    const name = store.name.toLowerCase().replace(/_/g, ' ');
                    return productStore.includes(chain) || productStore.includes(name) || chain.includes(productStore);
                });

                if (matchingProduct) {
                    if (!cheapestOption || matchingProduct.price < cheapestOption.price) {
                        cheapestOption = { product: matchingProduct, store, price: matchingProduct.price };
                    }
                }
            }

            if (cheapestOption) {
                itemAssignments.set(shoppingItem.name, cheapestOption);
            }
        }

        if (itemAssignments.size === 0) return null;

        // 2. Group items by store
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

        // 3. Sort stores by distance from user
        const sortedStores = Array.from(storeGroups.values()).sort((a, b) => a.distance - b.distance);
        const totalDistance = sortedStores.reduce((acc, s) => acc + s.distance, 0);

        return {
            stores: sortedStores,
            totalCost: totalProductCost,
            travelCost: this.estimateTravelCost(totalDistance),
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

        const singleTotalWithTravel = single.totalCost + single.travelCost;
        const multiTotalWithTravel = multi.totalCost + multi.travelCost;
        const absoluteSavings = singleTotalWithTravel - multiTotalWithTravel;

        multi.savings = Math.max(0, absoluteSavings);
        multi.savingsPercent = Math.max(0, (absoluteSavings / singleTotalWithTravel) * 100);

        // 1. Coverage check: If multi finds many more items, it's usually better
        // Be more lenient - if single has >= 80% of what multi has, it's still a strong contender
        if (multiCount > singleCount && (singleCount < multiCount * 0.8 || multiCount - singleCount >= 2)) {
            const multiReasoning = `Get ${multiCount} items across ${multi.stores.length} stops for ${multiTotalWithTravel.toFixed(0)} NOK. ${single.store.name} only has ${singleCount} items.`;
            return {
                singleStore: single,
                multiStore: multi,
                recommendation: 'multi',
                reasoning: multiReasoning,
                singleStoreReasoning: `Convenient one-stop shop for ${singleCount} items at ${singleTotalWithTravel.toFixed(0)} NOK.`,
                multiStoreReasoning: multiReasoning
            };
        }

        // 2. Compare cost + travel according to specific thresholds
        // Net Benefit = (Single Total + Single Travel) - (Multi Total + Multi Travel)
        // If Net Benefit > 20 NOK -> recommend multi
        // If Net Benefit < 0 (actual loss) -> recommend single
        // If Net Benefit between 0 and 20 -> recommend single for convenience
        if (absoluteSavings > 20) {
            const multiReasoning = `Save ${absoluteSavings.toFixed(0)} NOK net by splitting your trip (including travel costs and time)! Total combined cost: ${multiTotalWithTravel.toFixed(0)} NOK.`;
            return {
                singleStore: single,
                multiStore: multi,
                recommendation: 'multi',
                reasoning: multiReasoning,
                singleStoreReasoning: `Convenient one-stop shop at ${single.store.name} for ${singleTotalWithTravel.toFixed(0)} NOK.`,
                multiStoreReasoning: multiReasoning
            };
        } else {
            const diffMsg = absoluteSavings > 0
                ? `While splitting saves a tiny ${absoluteSavings.toFixed(0)} NOK net, the convenience of one store outweighs small savings under 20 NOK.`
                : `Splitting your trip would actually cost an extra ${Math.abs(absoluteSavings).toFixed(0)} NOK after considering travel and time.`;

            const singleReasoning = `Best choice for convenience: Buy everything at ${single.store.name} for ${singleTotalWithTravel.toFixed(0)} NOK. ${diffMsg}`;

            return {
                singleStore: single,
                multiStore: multi,
                recommendation: 'single',
                reasoning: singleReasoning,
                singleStoreReasoning: singleReasoning,
                multiStoreReasoning: absoluteSavings > 0
                    ? `Save a small ${absoluteSavings.toFixed(0)} NOK net by visiting ${multi.stores.length} stores.`
                    : `Multi-store route is more expensive after travel costs.`
            };
        }
    }
}

export const routeService = new RouteService();
export default routeService;
