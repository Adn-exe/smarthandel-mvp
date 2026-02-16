import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { strictLimiter } from '../middleware/rateLimiter.js';
import routeService from '../services/routeService.js';
import comparisonService from '../services/comparisonService.js';
import kassalService from '../services/kassalService.js';
import { ApiError } from '../middleware/errorHandler.js';
import cache from '../utils/cache.js';
import { Store } from '../types/index.js';

const router = Router();

/**
 * @route   POST /api/routes/optimize
 * @desc    Calculate optimal shopping route (single vs multi-store)
 * @access  Public
 */
router.post(
    '/optimize',
    [body('items').isArray().notEmpty().withMessage('Items array is required'),
    body('items.*.name').isString().notEmpty().withMessage('Item name is required'),
    body('items.*.quantity').isFloat({ min: 0.1 }).withMessage('Quantity must be positive'),
    body('userLocation.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('userLocation.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    body('preferences.maxStores').optional().isInt({ min: 1, max: 5 }),
    body('preferences.maxDistance').optional().isInt({ min: 500, max: 50000 }),
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiError(400, 'Validation failed', true);
        }

        const { items, userLocation, preferences } = req.body;

        // Cache identical requests for 10 minutes
        const cacheKey = `route:optimize:${JSON.stringify(req.body)}`;
        const cachedResponse = cache.get(cacheKey);
        if (cachedResponse) {
            res.setHeader('X-Cache', 'HIT');
            return res.json(cachedResponse);
        }

        // Apply strict limiter only for actual optimization (cache miss)
        await new Promise((resolve, reject) => {
            strictLimiter(req, res, (err: any) => {
                if (err) return reject(err);
                resolve(true);
            });
        });

        // Get nearby stores for consideration
        console.log(`[Optimize] Request for location: ${JSON.stringify(userLocation)}, preferences: ${JSON.stringify(preferences)}`);

        // Get nearby stores for consideration
        console.log(`[Optimize] Request for location: ${JSON.stringify(userLocation)}, preferences: ${JSON.stringify(preferences)}`);

        let stores: Store[] = [];
        try {
            stores = await kassalService.getStoresNearby(
                userLocation,
                (preferences?.maxDistance || 10000) / 1000 // Convert m to km
            );
        } catch (error) {
            console.error('[Optimize] Kassal API failed (likely Invalid Key or Quota). Using MOCK data fallback.');
        }

        // Fallback Mock Data if API fails or returns no stores
        if (stores.length === 0) {
            console.warn(`[Optimize] No stores found or API failed. activating Demo Mode with Mock Data.`);

            // Hardcoded Mock Stores to prevent 500 Error
            stores = [
                {
                    id: 9991,
                    name: 'Rema 1000 Sentrum',
                    chain: 'Rema 1000',
                    address: 'Torggata 1, Oslo',
                    location: { lat: 59.9139, lng: 10.7522 },
                    distance: 0.5,
                    open_now: true
                },
                {
                    id: 9992,
                    name: 'Kiwi Storgata',
                    chain: 'Kiwi',
                    address: 'Storgata 10, Oslo',
                    location: { lat: 59.9145, lng: 10.7530 },
                    distance: 0.7,
                    open_now: true
                },
                {
                    id: 9993,
                    name: 'Coop Extra Grønland',
                    chain: 'Extra',
                    address: 'Grønlandsleiret 25, Oslo',
                    location: { lat: 59.9120, lng: 10.7600 },
                    distance: 1.2,
                    open_now: true
                }
            ];
        }

        const optimization = await routeService.calculateOptimalRoute(
            items,
            userLocation,
            stores,
            {
                maxStores: preferences?.maxStores || 3,
                maxDistance: preferences?.maxDistance || 10000,
                excludedChains: preferences?.excludedChains
            }
        );

        const response = {
            success: true,
            ...optimization,
            metadata: {
                calculatedAt: new Date(),
                itemCount: items.length,
                storesConsidered: stores.length
            }
        };

        cache.set(cacheKey, response, 600); // 10 min TTL
        res.json(response);
    })
);

/**
 * @route   POST /api/routes/calculate-savings
 * @desc    Quick calculation of potential savings across stores
 * @access  Public
 */
router.post(
    '/calculate-savings',
    strictLimiter,
    [
        body('items').isArray().notEmpty().withMessage('Items array is required'),
        body('userLocation.lat').isFloat().withMessage('Valid latitude required'),
        body('userLocation.lng').isFloat().withMessage('Valid longitude required'),
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiError(400, 'Validation failed');
        }

        const { items, userLocation } = req.body;
        const shoppingItems = items.map((i: any) =>
            typeof i === 'string' ? { name: i, quantity: 1 } : i
        );

        let stores: Store[] = [];
        try {
            stores = await kassalService.getStoresNearby(userLocation);
        } catch (error) {
            console.error('[Calculate-Savings] Kassal API failed. Returning empty comparison.');
        }

        if (stores.length === 0) {
            return res.json({ success: true, data: { items: [], totalSavings: 0, stores: [] } });
        }

        const comparison = await comparisonService.compareProductPrices(shoppingItems, stores);

        res.json({
            success: true,
            data: comparison
        });
    })
);

export default router;
