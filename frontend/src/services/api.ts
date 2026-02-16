import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type {
    Location,
    ShoppingItem,
    SearchResponse,
    Store,
    RouteResponse,
    ComparisonResult
} from '../types';

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor (Logging)
apiClient.interceptors.request.use(
    (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Response Interceptor (Logging & Formatting)
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('[API Response Error]', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

/**
 * API Service Functions
 */
export const api = {
    /**
     * Search for products using natural language query
     */
    searchProducts: async (query: string, location: Location): Promise<SearchResponse> => {
        try {
            const response = await apiClient.post<{ success: boolean } & SearchResponse>('/api/products/search', {
                query,
                location,
            });
            return {
                items: response.data.items,
                budget: response.data.budget,
                comparison: response.data.comparison,
                timestamp: response.data.timestamp,
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'errors.failedSearch');
        }
    },

    /**
     * Get stores nearby specific coordinates
     */
    getStoresNearby: async (lat: number, lng: number, radius: number = 5): Promise<Store[]> => {
        try {
            const response = await apiClient.get<any>('/api/stores/nearby', {
                params: { lat, lng, radius },
            });
            return response.data.stores || [];
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'errors.failedStores');
        }
    },

    /**
     * Calculate optimal shopping route
     */
    optimizeRoute: async (
        items: ShoppingItem[],
        userLocation: Location,
        preferences?: {
            maxStores?: number;
            maxDistance?: number;
            excludedChains?: string[];
            sortBy?: 'cheapest' | 'closest' | 'stops';
        }
    ): Promise<RouteResponse> => {
        try {
            const response = await apiClient.post<{ success: boolean } & RouteResponse>('/api/route/optimize', {
                items,
                userLocation,
                preferences,
            });
            return {
                singleStore: response.data.singleStore,
                multiStore: response.data.multiStore,
                recommendation: response.data.recommendation,
                reasoning: response.data.reasoning,
                singleStoreCandidates: response.data.singleStoreCandidates,
                singleStoreReasoning: response.data.singleStoreReasoning,
                multiStoreReasoning: response.data.multiStoreReasoning,
                allNearbyStores: response.data.allNearbyStores,
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'errors.failedOptimize');
        }
    },

    /**
     * Parse natural language query into structured item list
     */
    parseQuery: async (query: string): Promise<{ items: ShoppingItem[]; budget?: number }> => {
        try {
            const response = await apiClient.post<any>('/api/ai/parse', { query });
            return {
                items: response.data.items,
                budget: response.data.budget
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'errors.failedParse');
        }
    },

    /**
     * Calculate potential savings across stores
     */
    calculateSavings: async (items: ShoppingItem[], userLocation: Location): Promise<ComparisonResult> => {
        try {
            const response = await apiClient.post<any>('/api/route/calculate-savings', {
                items,
                userLocation
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'errors.failedSavings');
        }
    },

    /**
     * Check backend health
     */
    checkHealth: async (): Promise<boolean> => {
        try {
            await apiClient.get('/api/health');
            return true;
        } catch (error) {
            return false;
        }
    }
};

export default api;
