import { QueryClient, useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';

import api from '../services/api';
import type {
    Location,
    ShoppingItem,
    SearchResponse,
    Store,
    RouteResponse
} from '../types';

// 1. Configure QueryClient
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60, // 1 minute
            gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
            refetchOnWindowFocus: false,
        },
    },
});

import { useDebounce } from '../hooks/useDebounce';

// 2. Custom Hooks

/**
 * Hook to search products with debouncing
 */
export function useSearchProducts(
    query: string,
    location: Location,
    options?: Omit<UseQueryOptions<SearchResponse, Error>, 'queryKey' | 'queryFn'>
) {
    const debouncedQuery = useDebounce(query, 500);

    return useQuery({
        queryKey: ['products', 'search', debouncedQuery, location],
        queryFn: () => api.searchProducts(debouncedQuery, location),
        enabled: !!debouncedQuery && !!location,
        ...options,
    });
}

/**
 * Hook to fetch nearby stores
 */
export function useStoresNearby(
    location: Location,
    radius: number = 5,
    options?: Omit<UseQueryOptions<Store[], Error>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: ['stores', 'nearby', location, radius],
        queryFn: () => api.getStoresNearby(location.lat, location.lng, radius),
        enabled: !!location,
        ...options,
    });
}

/**
 * Hook to optimize shopping route
 */
export function useOptimizeRoute(
    options?: UseMutationOptions<RouteResponse, Error, {
        items: ShoppingItem[];
        userLocation: Location;
        preferences?: {
            maxStores?: number;
            maxDistance?: number;
            excludedChains?: string[];
            sortBy?: 'cheapest' | 'closest' | 'stops';
        }
    }>
) {
    return useMutation({
        mutationFn: ({ items, userLocation, preferences }) =>
            api.optimizeRoute(items, userLocation, preferences),
        ...options,
    });
}

/**
 * Hook to parse natural language query
 */
export function useParseQuery(
    query: string | null,
    options?: Omit<UseQueryOptions<{ items: ShoppingItem[]; budget?: number }, Error>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: ['parse', query],
        queryFn: () => api.parseQuery(query!),
        enabled: !!query,
        ...options,
    });
}

/**
 * Hook to calculate savings
 */
export function useCalculateSavings(
    options?: UseMutationOptions<any, Error, { items: ShoppingItem[]; userLocation: Location }>
) {
    return useMutation({
        mutationFn: ({ items, userLocation }) => api.calculateSavings(items, userLocation),
        ...options,
    });
}

/**
 * Hook to check backend health
 */
export function useHealthCheck() {
    return useQuery({
        queryKey: ['health'],
        queryFn: api.checkHealth,
        refetchInterval: 30000, // Check every 30 seconds
    });
}
