import dataAggregator from './providers/DataAggregator.js';
import cache from '../utils/cache.js';
import { Product, Store, ShoppingItem } from '../types/index.js';
import { ApiError } from '../middleware/errorHandler.js';

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
        stores: Store[]
    ): Promise<ComparisonResult> {
        const cacheKey = `compare:${JSON.stringify(items)}:${JSON.stringify(stores.map(s => s.name))}`;
        const cached = cache.get<ComparisonResult>(cacheKey);
        if (cached) return cached;

        const byStore: Record<string, StoreComparison> = {};
        const byItem: Record<string, ItemComparison> = {};

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

            // Search for the product in the Kassal API
            // In a real scenario, we might want to filter search by vendor/store if possible
            const products = await dataAggregator.searchProducts(shoppingItem.name, {
                suggestedCategory: shoppingItem.suggestedCategory
            });

            for (const store of stores) {
                // Find the specific product offered by this store/chain
                // Kassal API maps stores to products via p.store.name or p.vendor
                const matchingProduct = products.find((p: Product) => {
                    const productStore = p.store.toLowerCase().replace(/_/g, ' ');
                    const chain = store.chain.toLowerCase().replace(/_/g, ' ');
                    const name = store.name.toLowerCase().replace(/_/g, ' ');
                    return productStore.includes(chain) || productStore.includes(name) || chain.includes(productStore);
                });

                if (matchingProduct) {
                    const price = matchingProduct.price * shoppingItem.quantity;

                    byStore[store.name].total += price;
                    byStore[store.name].items.push({
                        name: shoppingItem.name,
                        found: true,
                        price: matchingProduct.price,
                        productId: matchingProduct.id,
                        quantity: shoppingItem.quantity,
                        englishName: shoppingItem.englishName, // Propagate translation
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
            .sort((a, b) => a[1].total - b[1].total);

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
