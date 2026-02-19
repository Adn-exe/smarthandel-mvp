import { jest } from '@jest/globals';

// --- Mock Aggregator ---
const mockAggregator = {
    searchProductsWithChainVariety: jest.fn(),
    searchProducts: jest.fn(),
    getStoresNearby: jest.fn(),
};

// --- Mock Cache ---
const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
};

// --- Mocking External Dependencies ---
jest.unstable_mockModule('../services/providers/DataAggregator.js', () => ({
    dataAggregator: mockAggregator,
    default: mockAggregator
}));

jest.unstable_mockModule('../utils/cache.js', () => ({
    cache: mockCache,
    default: mockCache
}));

import type { Product, Store, ShoppingItem } from '../types/index.js';

// --- Dynamic Imports ---
const { comparisonService } = await import('../services/comparisonService.js');


describe('ComparisonService Variety Search', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCache.get.mockReturnValue(null);
    });

    it('should use searchProductsWithChainVariety and correctly match products to stores', async () => {
        const items: ShoppingItem[] = [{ name: 'Milk', quantity: 1 }];
        const stores: Store[] = [
            { id: 1, name: 'REMA 1000', chain: 'REMA', address: '', location: { lat: 0, lng: 0 }, distance: 0 },
            { id: 2, name: 'KIWI', chain: 'KIWI', address: '', location: { lat: 0, lng: 0 }, distance: 0 }
        ];

        const mockProducts: Product[] = [
            { id: 'p1', name: 'Rema Milk', price: 15, store: 'REMA', chain: 'REMA', image_url: '', unit: 'l' },
            { id: 'p2', name: 'Kiwi Milk', price: 18, store: 'KIWI', chain: 'KIWI', image_url: '', unit: 'l' }
        ];

        const queryMapping = new Map<string, string[]>();
        queryMapping.set('Milk', ['p1', 'p2']);

        (mockAggregator.searchProductsWithChainVariety as any).mockResolvedValue({
            products: mockProducts,
            queryMapping
        });

        const result = await comparisonService.compareProductPrices(items, stores);

        expect(mockAggregator.searchProductsWithChainVariety).toHaveBeenCalledWith(
            ['Milk'],
            ['REMA', 'KIWI'],
            expect.any(Object)
        );

        // Verify REMA store got the REMA product
        expect(result.byStore['REMA 1000'].items[0].price).toBe(15);
        expect(result.byStore['REMA 1000'].total).toBe(15);

        // Verify KIWI store got the KIWI product
        expect(result.byStore['KIWI'].items[0].price).toBe(18);
        expect(result.byStore['KIWI'].total).toBe(18);

        // Verify byItem results
        expect(result.byItem['Milk'].prices).toHaveLength(2);
        expect(result.byItem['Milk'].cheapest?.storeName).toBe('REMA 1000');
    });

    it('should handle stores where no product is found', async () => {
        const items: ShoppingItem[] = [{ name: 'Milk', quantity: 1 }];
        const stores: Store[] = [
            { id: 1, name: 'REMA 1000', chain: 'REMA', address: '', location: { lat: 0, lng: 0 }, distance: 0 },
            { id: 3, name: 'Unrelated Store', chain: 'UNKNOWN', address: '', location: { lat: 0, lng: 0 }, distance: 0 }
        ];

        const mockProducts: Product[] = [
            { id: 'p1', name: 'Rema Milk', price: 15, store: 'REMA', chain: 'REMA', image_url: '', unit: 'l' }
        ];

        const queryMapping = new Map<string, string[]>();
        queryMapping.set('Milk', ['p1']);

        (mockAggregator.searchProductsWithChainVariety as any).mockResolvedValue({
            products: mockProducts,
            queryMapping
        });

        const result = await comparisonService.compareProductPrices(items, stores);

        expect(result.byStore['REMA 1000'].items[0].found).toBe(true);
        expect(result.byStore['Unrelated Store'].items[0].found).toBe(false);
    });
});
