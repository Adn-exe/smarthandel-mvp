import { BaseProvider, ProviderSearchOptions } from './BaseProvider.js';
import { KassalProvider } from './KassalProvider.js';
import { OfflineProvider } from './OfflineProvider.js';
import { Product, Store, Location } from '../../types/index.js';

/**
 * Aggregates multiple data providers and handles fallback logic.
 */
class DataAggregator {
    private providers: BaseProvider[] = [];
    private primaryProvider: BaseProvider;
    private fallbackProvider: BaseProvider;

    constructor() {
        this.primaryProvider = new KassalProvider();
        this.fallbackProvider = new OfflineProvider();

        // Order matters for general queries
        this.providers = [this.primaryProvider, this.fallbackProvider];
    }

    /**
     * Search for products across providers with fallback
     */
    public async searchProducts(query: string, options?: ProviderSearchOptions): Promise<Product[]> {
        try {
            // 1. Try Primary (Kassal API)
            const primaryResults = await this.primaryProvider.searchProducts(query, options);

            // 2. If primary returns results, use them
            if (primaryResults.length > 0) {
                return primaryResults;
            }

            // 3. Fallback to offline dataset if primary returns nothing or fails
            console.log(`[DataAggregator] No results from primary for "${query}", trying fallback...`);
            return await this.fallbackProvider.searchProducts(query, options);

        } catch (error) {
            console.error(`[DataAggregator] Primary provider ("${this.primaryProvider.name}") failed for "${query}":`, error);
            // On failure, attempt fallback
            console.log(`[DataAggregator] Attempting fallback to "${this.fallbackProvider.name}" for "${query}"...`);
            return await this.fallbackProvider.searchProducts(query, options);
        }
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
