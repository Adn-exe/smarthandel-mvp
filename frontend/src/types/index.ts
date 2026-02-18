export interface Location {
    lat: number;
    lng: number;
}

export interface Product {
    id: string | number;
    name: string;
    englishName?: string;
    price: number;
    store: string;
    image_url: string;
    unit: string;
    originalQueryName?: string;
    priceHistory?: Array<{ price: number; date: string }>;
}

export interface Store {
    id: string | number;
    name: string;
    chain: string;
    address: string;
    location: Location;
    distance: number;
    open_now?: boolean;
}

export interface ShoppingItem {
    name: string;
    originalName?: string;
    englishName?: string;
    quantity: number;
    unit?: string;
}

// --- Comparison Service Types ---

export interface StoreComparison {
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

export interface ItemComparison {
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

// --- Route Service Types ---

export interface ProductWithPrice extends Product {
    totalPrice: number;
    quantity: number;
}

export interface OptimizeRouteRequest {
    items: ShoppingItem[];
    userLocation: Location;
    maxStores: number;
    maxDistance: number;
    excludedChains?: string[];
    sortBy?: 'cheapest' | 'closest' | 'stops';
}

export interface SingleStoreOption {
    store: Store;
    items: ProductWithPrice[];
    totalCost: number;
    distance: number;
    availabilityScore?: number;
    missingItems?: string[];
}

export interface MultiStoreOption {
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

export interface RouteResponse {
    singleStore: SingleStoreOption | null;
    multiStore: MultiStoreOption | null;
    recommendation: 'single' | 'multi';
    reasoning: string;
    singleStoreReasoning?: string;
    multiStoreReasoning?: string;
    singleStoreCandidates?: SingleStoreOption[];
    allNearbyStores?: Store[];
    searchLocation?: Location;
}

// --- API Responses ---

export interface SearchResponse {
    items: ShoppingItem[];
    budget?: number;
    comparison: ComparisonResult;
    timestamp: string;
}

export interface ApiErrorResponse {
    success: boolean;
    message: string;
    statusCode?: number;
    isOperational?: boolean;
}
