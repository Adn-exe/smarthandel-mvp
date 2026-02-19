import dataAggregator from './providers/DataAggregator.js';
import cache from '../utils/cache.js';
import { Product, Store, ShoppingItem, Location } from '../types/index.js';
import { ApiError } from '../middleware/errorHandler.js';
import { selectBestProductForStore } from '../utils/matching.js';


interface StoreComparison {
    total: number;
    items: Array<{
        name: string;
        found: boolean;
        price?: number;
        productId?: string | number;
        quantity: number;
        englishName?: string;
    }>;
}

interface ItemComparison {
    itemName: string;
    cheapest: {
        storeName: string;
        price: number;
    } | null;
    prices: Array<{
        storeName: string;
        price: number;
    }>;
}

export interface ComparisonResult {
    byStore: Record<string, StoreComparison>;
    byItem: Record<string, ItemComparison>;
    cheapestStore: string | null;
    mostExpensiveStore: string | null;
    maxSavings: number;
}

export interface Deal {
    itemName: string;
    storeName: string;
    price: number;
    averagePrice: number;
    savingsPercentage: number;
    isExceptional: boolean;
}

/**
 * Service to handle cross-store price comparisons and deal identification.
 */
class ComparisonService {
    /**
     * Compares total costs of a shopping list across multiple stores.
     */
    public async compareProductPrices(
        items: ShoppingItem[],
        stores: Store[],
        userLocation?: Location
    ): Promise<ComparisonResult> {
        const cacheKey = `compare:${JSON.stringify(items)}:${JSON.stringify(stores.map(s => s.name).sort())}:${userLocation ? `${userLocation.lat},${userLocation.lng}` : 'no-loc'}`;
        const cached = cache.get<ComparisonResult>(cacheKey);
        if (cached) return cached;

        const byStore: Record<string, StoreComparison> = {};
        const byItem: Record<string, ItemComparison> = {};

        // Use the first store's location as a fallback for search context if userLocation is missing
        const searchLocation = userLocation || (stores.length > 0 ? stores[0].location : undefined);

        // Initialize byStore
        stores.forEach(store => {
            byStore[store.name] = { total: 0, items: [] };
        });

        // Populate comparisons
        for (const rawItem of items) {
            // Capitalize for professional display
            const shoppingItem = {
                ...rawItem,
                name: rawItem.name.charAt(0).toUpperCase() + rawItem.name.slice(1), // Capitalize for display and search
                originalName: rawItem.name, // Preserve original user input
                englishName: rawItem.englishName ? rawItem.englishName.charAt(0).toUpperCase() + rawItem.englishName.slice(1) : undefined, // Capitalize English translation
            };

            const itemComp: ItemComparison = {
                itemName: shoppingItem.name,
                cheapest: null,
                prices: [],
            };

            // Perform a robust search with chain variety to ensure we get results from all relevant stores
            const uniqueChains = Array.from(new Set(stores.map(s => s.chain)));
            const { products, queryMapping } = await dataAggregator.searchProductsWithChainVariety(
                [shoppingItem.name],
                uniqueChains,
                {
                    suggestedCategory: shoppingItem.suggestedCategory,
                    location: searchLocation,
                    radius: 10 // Default 10km radius for variety search
                }
            );


            const productIdsForThisQuery = queryMapping.get(shoppingItem.name) || [];

            for (const store of stores) {
                // Use centralized matching logic to find the best candidate for this specific store
                const matchingProduct = selectBestProductForStore(products, store, productIdsForThisQuery);

                if (matchingProduct) {
                    const price = matchingProduct.price * shoppingItem.quantity;

                    byStore[store.name].total += price;
                    byStore[store.name].items.push({
                        name: shoppingItem.name,
                        found: true,
                        price: matchingProduct.price,
                        productId: matchingProduct.id,
                        quantity: shoppingItem.quantity,
                        englishName: shoppingItem.englishName,
                    });

                    itemComp.prices.push({ storeName: store.name, price: matchingProduct.price });

                    if (!itemComp.cheapest || matchingProduct.price < itemComp.cheapest.price) {
                        itemComp.cheapest = { storeName: store.name, price: matchingProduct.price };
                    }
                } else {
                    byStore[store.name].items.push({
                        name: shoppingItem.name,
                        found: false,
                        quantity: shoppingItem.quantity,
                    });
                }
            }
            byItem[shoppingItem.name] = itemComp;
        }

        // Calculate metadata
        const storeTotals = Object.entries(byStore)
            .filter(([_, data]) => data.total > 0)
            .sort((a, b) => {
                // Priority 1: Coverage (More found items is better)
                const countA = a[1].items.filter(i => i.found).length;
                const countB = b[1].items.filter(i => i.found).length;
                if (countB !== countA) return countB - countA;

                // Priority 2: Cost (Lower is better)
                return a[1].total - b[1].total;
            });


        const cheapestStore = storeTotals.length > 0 ? storeTotals[0][0] : null;
        const mostExpensiveStore = storeTotals.length > 0 ? storeTotals[storeTotals.length - 1][0] : null;
        const maxSavings = storeTotals.length > 1
            ? storeTotals[storeTotals.length - 1][1].total - storeTotals[0][1].total
            : 0;

        const result: ComparisonResult = {
            byStore,
            byItem,
            cheapestStore,
            mostExpensiveStore,
            maxSavings,
        };

        cache.set(cacheKey, result, 600); // 10 min TTL
        return result;
    }

    /**
     * Finds the best individual deals for a list of items.
     */
    public async findBestDeals(items: ShoppingItem[]): Promise<Deal[]> {
        const deals: Deal[] = [];

        for (const item of items) {
            const products = await dataAggregator.searchProducts(item.name, {
                suggestedCategory: item.suggestedCategory
            });
            if (products.length < 2) continue;

            const prices = products.map((p: Product) => p.price).filter((p: number) => p > 0);
            const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;

            products.forEach((p: Product) => {
                if (p.price > 0 && p.price < avgPrice) {
                    const savingsPercentage = ((avgPrice - p.price) / avgPrice) * 100;
                    deals.push({
                        itemName: item.name,
                        storeName: p.store,
                        price: p.price,
                        averagePrice: avgPrice,
                        savingsPercentage,
                        isExceptional: savingsPercentage > 20,
                    });
                }
            });
        }

        return deals.sort((a, b) => b.savingsPercentage - a.savingsPercentage);
    }
}

export const comparisonService = new ComparisonService();
export default comparisonService;
