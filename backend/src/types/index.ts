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
    chain: string;
    image_url: string;
    unit: string;
    address?: string;
    relevanceScore?: number;
    originalQueryName?: string;
    priceHistory?: Array<{ price: number; date: string }>;
    ingredients?: string;
    allergens?: Array<{ display_name: string; contains: boolean }>;
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
    suggestedCategory?: string;
    quantity: number;
    unit?: string;
    lockedBrand?: string;
    lockedProductId?: string;
    lockedProductDetails?: any;
    lockedStore?: string;
}

export interface RouteOption {
    store: Store;
    items: Product[];
    cost: number;
    distance: number;
}

export interface SearchRequest {
    query: string;
    location: Location;
}

export interface OptimizeRouteRequest {
    items: ShoppingItem[];
    userLocation: Location;
    maxStores: number;
    maxDistance: number;
    excludedChains?: string[];
    sortBy?: 'cheapest' | 'closest' | 'stops';
}

export interface ProductWithPrice extends Product {
    totalPrice: number;
    quantity: number;
}

/**
 * KassalProduct type mapping based on Kassal.app API v1
 */
export interface KassalProduct {
    id: number;
    name: string;
    brand?: string;
    vendor?: string;
    ean?: string;
    url?: string;
    image?: string;
    current_price?: number | { price: number; date: string; store: string };
    category?: {
        id: number;
        name: string;
        parent?: {
            id: number;
            name: string;
        };
    };
    price?: number;
    price_history?: Array<{
        price: number;
        date: string;
    }>;
    store?: {
        name: string;
        group: string;
        code?: string;
        address?: string;
    };
    nutrition?: Array<{
        name: string;
        amount: number;
        unit: string;
    }>;
    allergens?: Array<{
        name: string;
        display_name: string;
        contains: boolean;
    }>;
}

export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
