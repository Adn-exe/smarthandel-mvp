import { BaseProvider, ProviderSearchOptions } from './BaseProvider.js';
import { KassalProvider } from './KassalProvider.js';
import { Product, Store, Location } from '../../types/index.js';
import priceIndexService from '../PriceIndexService.js';

/**
 * Aggregates multiple data providers and handles fallback logic.
 */
class DataAggregator {
    private providers: BaseProvider[] = [];
    private primaryProvider: BaseProvider;

    constructor() {
        this.primaryProvider = new KassalProvider();
        this.providers = [this.primaryProvider];
    }

    /**
     * Search for products across providers
     */
    public async searchProducts(query: string, options?: ProviderSearchOptions): Promise<Product[]> {
        try {
            return await this.primaryProvider.searchProducts(query, options);
        } catch (error) {
            console.error(`[DataAggregator] Primary provider ("${this.primaryProvider.name}") failed for "${query}":`, error);
            return [];
        }
    }

    /**
     * Search for MULTIPLE products in parallel.
     * This is crucial for the robust optimization engine to fetch all potential matches at once.
     */
    public async searchAllProducts(queries: string[], options?: ProviderSearchOptions): Promise<Product[]> {
        // Run all searches in parallel
        const results = await Promise.all(
            queries.map(q => this.searchProducts(q, options))
        );
        // Flatten the array of arrays into a single list of all products found
        return results.flat();
    }

    /**
     * Performs a broad search followed by targeted chain searches to ensure variety.
     * Returns both the flat list of products and a map of which productId belongs to which search query.
     */
    public async searchProductsWithChainVariety(
        queries: string[],
        chains: string[],
        options?: ProviderSearchOptions & { bypassIndex?: boolean }
    ): Promise<{ products: Product[], queryMapping: Map<string, string[]> }> {
        // 1. Check local Deterministic Price Index for canonical items
        const resultsByQuery: { query: string, products: Product[] }[] = [];
        const queriesToFetch: string[] = [];

        for (const q of queries) {
            const normalizedQ = q.toLowerCase().trim().replace(/\s+/g, '_');
            if (!options?.bypassIndex && priceIndexService.isCanonical(normalizedQ)) {
                const indexedPrices = priceIndexService.getPricesForCanonicalItem(normalizedQ);
                if (indexedPrices.length > 0) {
                    console.log(`[DataAggregator] Index HIT for canonical item: "${q}" (${indexedPrices.length} entries)`);
                    resultsByQuery.push({
                        query: q,
                        products: indexedPrices.map(entry => ({
                            id: `idx-${entry.canonical_product_id}-${entry.store_id}`,
                            name: entry.product_name,
                            price: entry.price,
                            store: String(entry.store_id),
                            chain: entry.chain,
                            image_url: '',
                            unit: 'stk',
                            relevanceScore: -10000 // High relevance for indexed items
                        }))
                    });
                }
            }
            // Always Fetch To Ensure Variety & Freshness (unless specifically bypassed)
            queriesToFetch.push(q);
        }


        // 2. Initial global search (only for those not indexed)
        const remoteResultsByQuery = await Promise.all(
            queriesToFetch.map(async (q) => ({
                query: q,
                products: await this.searchProducts(q, options)
            }))
        );

        // Merge indexed and remote
        resultsByQuery.push(...remoteResultsByQuery);

        // 2. Targeted searches for variety (only if global/index search results are sparse for some chains)
        const uniqueChains = Array.from(new Set(chains.map(c => {
            const parts = c.split(' ');
            return (parts.length > 1 ? `${parts[0]} ${parts[1]}` : parts[0]).toUpperCase();
        })));
        // Increase limit of chains to check for variety
        const topChains = uniqueChains.slice(0, 8);

        const targetedResultsByQuery = await Promise.all(
            queriesToFetch.map(async (q) => {
                // Find which chains we already have results for
                const existingProducts = resultsByQuery.find(r => r.query === q)?.products || [];

                // Count products per chain to detect low coverage
                const chainCoverage = new Map<string, number>();
                existingProducts.forEach(p => {
                    const parts = (p.chain || '').split(' ');
                    const cKey = (parts.length > 1 ? `${parts[0]} ${parts[1]}` : parts[0]).toUpperCase();
                    chainCoverage.set(cKey, (chainCoverage.get(cKey) || 0) + 1);
                });

                // A chain is "missing" if it has 0 or 1 product (low variety)
                const missingChains = topChains.filter(tc => (chainCoverage.get(tc) || 0) < 2);

                if (missingChains.length === 0) return { query: q, products: [] };

                console.log(`[DataAggregator] Targeted variety search for "${q}" - Coverage sparse for: ${missingChains.join(', ')}`);

                // Don't do too many targeted searches to avoid 429, but slightly more than before
                const chainQueries = missingChains.slice(0, 5).map(c => `${c} ${q}`);
                const products = await Promise.all(
                    chainQueries.map(cq => this.searchProducts(cq, options))
                );
                return {
                    query: q,
                    products: products.flat()
                };
            })
        );


        // 3. Build the mapping and flat list
        const queryMapping = new Map<string, string[]>(); // canonicalQuery -> productIds[]
        const allProductsMap = new Map<string, Product>();

        // Merge global and targeted
        [...resultsByQuery, ...targetedResultsByQuery].forEach(res => {
            const productIds: string[] = queryMapping.get(res.query) || [];
            res.products.forEach(p => {
                const pId = String(p.id);
                if (!allProductsMap.has(pId)) {
                    allProductsMap.set(pId, p);
                }
                if (!productIds.includes(pId)) {
                    productIds.push(pId);
                }
            });
            queryMapping.set(res.query, productIds);
        });

        return {
            products: Array.from(allProductsMap.values()),
            queryMapping
        };
    }

    /**
     * Get product details by ID (Primary only)
     */
    public async getProductById(id: string): Promise<Product> {
        return this.primaryProvider.getProductById(id);
    }

    /**
     * Get nearby stores (Currently only Kassal API supports real-time location)
     */
    public async getStoresNearby(location: Location, radiusKm?: number): Promise<Store[]> {
        try {
            return await this.primaryProvider.getStoresNearby(location, radiusKm);
        } catch (error) {
            console.error('[DataAggregator] Failed to fetch nearby stores from primary:', error);
            return [];
        }
    }

    /**
     * Check health of providers
     */
    public async checkHealth(): Promise<Record<string, boolean>> {
        const status: Record<string, boolean> = {};
        for (const p of this.providers) {
            status[p.name] = await p.isAvailable();
        }
        return status;
    }
}

export const dataAggregator = new DataAggregator();
export default dataAggregator;
