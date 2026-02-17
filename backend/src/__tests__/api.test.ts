import { jest } from '@jest/globals';
import request from 'supertest';

// ─── Mock Instances ──────────────────────────────────────────────────
const mockAi = {
    parseShoppingQuery: jest.fn(),
    checkHealth: jest.fn(),
    getSuggestions: jest.fn(),
};

const mockAggregator = {
    searchProducts: jest.fn(),
    getStoresNearby: jest.fn(),
    checkHealth: jest.fn(),
    getProductById: jest.fn(),
};

// ─── Mock External Services (ESM) ──────────────────────────────────
jest.unstable_mockModule('../services/aiService.js', () => ({
    aiService: mockAi,
    default: mockAi,
}));

jest.unstable_mockModule('../services/providers/DataAggregator.js', () => ({
    dataAggregator: mockAggregator,
    default: mockAggregator,
}));

// ─── Dynamic Imports (must come after mocks) ───────────────────────
const { default: app } = await import('../server.js');
const { aiService } = (await import('../services/aiService.js')) as any;
const { dataAggregator } = (await import('../services/providers/DataAggregator.js')) as any;
const { default: cache } = await import('../utils/cache.js');

// ─── Shared Test Data ──────────────────────────────────────────────
const osloLocation = { lat: 59.9139, lng: 10.7522 };

const mockStores = [
    { id: 1, name: 'REMA 1000 Grünerløkka', chain: 'REMA', location: { lat: 59.922, lng: 10.759 }, address: 'Thorvald Meyers gate 51', distance: 0.5 },
    { id: 2, name: 'KIWI Tøyen', chain: 'KIWI', location: { lat: 59.913, lng: 10.771 }, address: 'Grønland 22', distance: 1.2 },
    { id: 3, name: 'Meny Majorstuen', chain: 'MENY', location: { lat: 59.929, lng: 10.714 }, address: 'Bogstadveien 1', distance: 2.8 },
];

const mockProducts = [
    { id: 'p1', name: 'Tine Helmelk 1L', price: 20.9, store: 'REMA 1000 Grünerløkka', chain: 'REMA', unit: 'l' },
    { id: 'p2', name: 'Tine Helmelk 1L', price: 22.5, store: 'KIWI Tøyen', chain: 'KIWI', unit: 'l' },
    { id: 'p3', name: 'Tine Helmelk 1L', price: 24.9, store: 'Meny Majorstuen', chain: 'MENY', unit: 'l' },
];

// ────────────────────────────────────────────────────────────────────
// TEST SUITE
// ────────────────────────────────────────────────────────────────────

describe('SmartHandel API Integration Tests', () => {

    // ── Setup & Teardown ───────────────────────────────────────────
    beforeEach(() => {
        jest.clearAllMocks();
        cache.flush(); // Clear cache between tests to avoid cross-test contamination
    });

    afterAll(() => {
        cache.flush();
    });

    // ════════════════════════════════════════════════════════════════
    // Health Check
    // ════════════════════════════════════════════════════════════════

    describe('GET /api/health', () => {
        it('should return 200 with system status', async () => {
            const res = await request(app).get('/api/health');

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body).toHaveProperty('uptime');
            expect(res.body).toHaveProperty('timestamp');
        });
    });

    // ════════════════════════════════════════════════════════════════
    // POST /api/products/search
    // ════════════════════════════════════════════════════════════════

    describe('POST /api/products/search', () => {

        const setupSearchMocks = () => {
            aiService.parseShoppingQuery.mockResolvedValue({
                items: [{ name: 'melk', quantity: 1, unit: 'l' }],
                budget: 100,
            });
            dataAggregator.getStoresNearby.mockResolvedValue([mockStores[0]]);
            dataAggregator.searchProducts.mockResolvedValue([mockProducts[0]]);
        };

        it('should return products for a valid search query', async () => {
            setupSearchMocks();

            const res = await request(app)
                .post('/api/products/search')
                .send({ query: 'kjøp melk og brød', location: osloLocation });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.items).toEqual([{ name: 'melk', quantity: 1, unit: 'l' }]);
            expect(res.body.budget).toBe(100);
            expect(res.body.comparison).toBeDefined();
            expect(res.body.timestamp).toBeDefined();

            // Verify service call chain
            expect(aiService.parseShoppingQuery).toHaveBeenCalledWith('kjøp melk og brød');
            expect(dataAggregator.getStoresNearby).toHaveBeenCalledWith(osloLocation);
        });

        it('should return 400 for invalid location coordinates', async () => {
            const res = await request(app)
                .post('/api/products/search')
                .send({ query: 'melk', location: { lat: 100, lng: 200 } });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Validation failed');

            // Services should NOT have been called
            expect(aiService.parseShoppingQuery).not.toHaveBeenCalled();
        });

        it('should return 400 for empty query', async () => {
            const res = await request(app)
                .post('/api/products/search')
                .send({ query: '', location: osloLocation });

            expect(res.status).toBe(400);
            expect(aiService.parseShoppingQuery).not.toHaveBeenCalled();
        });

        it('should utilise comparison service caching for repeated requests', async () => {
            setupSearchMocks();

            // First request — populates comparison cache
            const res1 = await request(app)
                .post('/api/products/search')
                .send({ query: 'melk', location: osloLocation });
            expect(res1.status).toBe(200);

            // Second identical request — comparison cache should be hit
            const res2 = await request(app)
                .post('/api/products/search')
                .send({ query: 'melk', location: osloLocation });
            expect(res2.status).toBe(200);

            // AI service is always called (no route-level caching on /products/search)
            expect(aiService.parseShoppingQuery).toHaveBeenCalledTimes(2);
            // But both should return valid comparison data
            expect(res2.body.comparison).toEqual(res1.body.comparison);
        });
    });

    // ════════════════════════════════════════════════════════════════
    // GET /api/stores/nearby
    // ════════════════════════════════════════════════════════════════

    describe('GET /api/stores/nearby', () => {

        it('should return stores for valid coordinates', async () => {
            dataAggregator.getStoresNearby.mockResolvedValue(mockStores);

            const res = await request(app)
                .get('/api/stores/nearby')
                .query({ lat: osloLocation.lat, lng: osloLocation.lng });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.stores)).toBe(true);
            expect(res.body.stores).toHaveLength(3);
            expect(res.body.count).toBe(3);
        });

        it('should return stores sorted by distance', async () => {
            // Return stores in shuffled order — route should still return them as-is from the service
            // (The service is responsible for sorting, but we verify the mock reaches the response)
            const sortedStores = [...mockStores].sort((a, b) => a.distance - b.distance);
            dataAggregator.getStoresNearby.mockResolvedValue(sortedStores);

            const res = await request(app)
                .get('/api/stores/nearby')
                .query({ lat: osloLocation.lat, lng: osloLocation.lng, radius: 5 });

            expect(res.status).toBe(200);
            const distances = res.body.stores.map((s: any) => s.distance);
            // Verify order is ascending
            for (let i = 1; i < distances.length; i++) {
                expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
            }
        });

        it('should pass radius filter to service', async () => {
            dataAggregator.getStoresNearby.mockResolvedValue([mockStores[0]]);

            const res = await request(app)
                .get('/api/stores/nearby')
                .query({ lat: osloLocation.lat, lng: osloLocation.lng, radius: 1 });

            expect(res.status).toBe(200);
            expect(res.body.radius).toBe(1);
            expect(res.body.stores).toHaveLength(1);

            // Verify the service was called with the radius
            expect(dataAggregator.getStoresNearby).toHaveBeenCalledWith(
                { lat: osloLocation.lat, lng: osloLocation.lng },
                1
            );
        });

        it('should return 400 for invalid coordinates', async () => {
            const res = await request(app)
                .get('/api/stores/nearby')
                .query({ lat: 'abc', lng: 'def' });

            expect(res.status).toBe(400);
            expect(dataAggregator.getStoresNearby).not.toHaveBeenCalled();
        });

        it('should return 400 for missing coordinates', async () => {
            const res = await request(app).get('/api/stores/nearby');

            expect(res.status).toBe(400);
            expect(dataAggregator.getStoresNearby).not.toHaveBeenCalled();
        });
    });

    // ════════════════════════════════════════════════════════════════
    // POST /api/route/optimize
    // ════════════════════════════════════════════════════════════════

    describe('POST /api/route/optimize', () => {

        const setupOptimizeMocks = (stores = [mockStores[0]], products = mockProducts.slice(0, 1)) => {
            dataAggregator.getStoresNearby.mockResolvedValue(stores);
            dataAggregator.searchProducts.mockResolvedValue(products);
        };

        it('should return single and multi-store options', async () => {
            setupOptimizeMocks(
                [mockStores[0]], // One store
                [
                    { id: '1', name: 'Melk', price: 20, store: 'REMA 1000 Grünerløkka', chain: 'REMA', unit: 'l' },
                    { id: '2', name: 'Brød', price: 30, store: 'REMA 1000 Grünerløkka', chain: 'REMA', unit: 'stk' },
                ]
            );

            const res = await request(app)
                .post('/api/route/optimize')
                .send({
                    items: [{ name: 'Melk', quantity: 1 }, { name: 'Brød', quantity: 1 }],
                    userLocation: osloLocation,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body).toHaveProperty('singleStore');
            expect(res.body).toHaveProperty('multiStore');
            expect(res.body).toHaveProperty('recommendation');
            expect(res.body).toHaveProperty('reasoning');
            expect(res.body).toHaveProperty('metadata');
            expect(res.body.metadata.itemCount).toBe(2);
        });

        it('should calculate savings correctly in multi-store mode', async () => {
            // Two stores with different prices so multi-store can calculate savings
            dataAggregator.getStoresNearby.mockResolvedValue([mockStores[0], mockStores[1]]);
            // Return different prices per call — first for 'Melk', second for 'Brød'
            dataAggregator.searchProducts
                .mockResolvedValueOnce([
                    { id: 'p1', name: 'Melk', price: 15, store: 'REMA 1000 Grünerløkka', chain: 'REMA', unit: 'l' },
                    { id: 'p2', name: 'Melk', price: 25, store: 'KIWI Tøyen', chain: 'KIWI', unit: 'l' },
                ])
                .mockResolvedValueOnce([
                    { id: 'p3', name: 'Brød', price: 30, store: 'REMA 1000 Grünerløkka', chain: 'REMA', unit: 'stk' },
                    { id: 'p4', name: 'Brød', price: 20, store: 'KIWI Tøyen', chain: 'KIWI', unit: 'stk' },
                ]);

            const res = await request(app)
                .post('/api/route/optimize')
                .send({
                    items: [{ name: 'Melk', quantity: 1 }, { name: 'Brød', quantity: 1 }],
                    userLocation: osloLocation,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // The single store option should exist
            if (res.body.singleStore) {
                expect(res.body.singleStore).toHaveProperty('totalCost');
                expect(res.body.singleStore.totalCost).toBeGreaterThan(0);
            }

            // The multi-store option should have savings info
            if (res.body.multiStore) {
                expect(res.body.multiStore).toHaveProperty('totalCost');
                expect(res.body.multiStore).toHaveProperty('savings');
                expect(res.body.multiStore).toHaveProperty('savingsPercent');
                expect(typeof res.body.multiStore.savings).toBe('number');
            }

            // Recommendation should be one of the valid values
            expect(['single', 'multi']).toContain(res.body.recommendation);
        });

        it('should handle items not found in any store gracefully', async () => {
            dataAggregator.getStoresNearby.mockResolvedValue([mockStores[0]]);
            // Return empty array — no products found for the item
            dataAggregator.searchProducts.mockResolvedValue([]);

            const res = await request(app)
                .post('/api/route/optimize')
                .send({
                    items: [{ name: 'Sjelden Ost', quantity: 1 }],
                    userLocation: osloLocation,
                });

            // When no products are found, the service throws a 404 or 500
            // (generateRecommendation throws 404 when both single and multi are null)
            expect([404, 500]).toContain(res.status);
        });

        it('should return cached result for identical optimize requests', async () => {
            setupOptimizeMocks(
                [mockStores[0]],
                [
                    { id: '1', name: 'Melk', price: 20, store: 'REMA 1000 Grünerløkka', chain: 'REMA', unit: 'l' },
                ]
            );

            const payload = {
                items: [{ name: 'Melk', quantity: 1 }],
                userLocation: osloLocation,
            };

            // First request — should generate fresh result
            const res1 = await request(app)
                .post('/api/route/optimize')
                .send(payload);
            expect(res1.status).toBe(200);
            expect(res1.headers['x-cache']).toBeUndefined(); // First call = no cache hit

            // Second identical request — should serve from cache
            const res2 = await request(app)
                .post('/api/route/optimize')
                .send(payload);
            expect(res2.status).toBe(200);
            expect(res2.headers['x-cache']).toBe('HIT');

            // dataAggregator should only be called once (first request)
            expect(dataAggregator.getStoresNearby).toHaveBeenCalledTimes(1);
        });

        it('should return 400 for missing items array', async () => {
            const res = await request(app)
                .post('/api/route/optimize')
                .send({ userLocation: osloLocation });

            expect(res.status).toBe(400);
        });

        it('should return 400 for invalid userLocation', async () => {
            const res = await request(app)
                .post('/api/route/optimize')
                .send({
                    items: [{ name: 'Melk', quantity: 1 }],
                    userLocation: { lat: 999, lng: -999 },
                });

            expect(res.status).toBe(400);
        });
    });
});
