import { Product, Store, Location } from '../../types/index.js';

export interface ProviderSearchOptions {
    suggestedCategory?: string;
    location?: Location;
    radius?: number;
    [key: string]: any;
}

/**
 * Base Interface for all Data Providers (Kassal API, Offline Dataset, etc.)
 */
export interface BaseProvider {
    name: string;

    /**
     * Search for products matching a query
     */
    searchProducts(query: string, options?: ProviderSearchOptions): Promise<Product[]>;

    /**
     * Get physical stores nearby a location
     */
    getStoresNearby(location: Location, radiusKm?: number): Promise<Store[]>;

    /**
     * Get detailed information for a specific product
     */
    getProductById(id: string): Promise<Product>;

    /**
     * Check if the provider is healthy/available
     */
    isAvailable(): Promise<boolean>;
}
