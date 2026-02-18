import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { strictLimiter } from '../middleware/rateLimiter.js';
import routeService from '../services/routeService.js';
import comparisonService from '../services/comparisonService.js';
import dataAggregator from '../services/providers/DataAggregator.js';
import { ApiError } from '../middleware/errorHandler.js';
import cache from '../utils/cache.js';
import { Store, Location } from '../types/index.js';
import { ensureInRegion } from '../utils/locationUtils.js';

const router = Router();

// Geographic configuration moved to LocationUtils

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

        // Cache identical requests for 10 minutes (Bypass in development for easier testing)
        const cacheKey = `route:optimize:${JSON.stringify(req.body)}`;
        const cachedResponse = process.env.NODE_ENV === 'production' ? cache.get(cacheKey) : null;
        if (cachedResponse) {
            console.log(`[Optimize] Cache HIT for key: ${cacheKey.substring(0, 50)}...`);
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

        // GEOGRAPHIC RESTRICTION: TRONDHEIM ONLY
        const { location: searchLocation, radius: searchRadius } = ensureInRegion(
            userLocation,
            (preferences?.maxDistance || 10000) / 1000
        );

        let stores: Store[] = [];
        try {
            stores = await dataAggregator.getStoresNearby(
                searchLocation,
                searchRadius
            );

            // FALLBACK: If 0 stores in 10km, try 25km (Trondheim region is spread out)
            if (stores.length === 0) {
                console.log(`[Optimize] 0 stores found at ${searchRadius}km. Widening search to 25km...`);
                stores = await dataAggregator.getStoresNearby(searchLocation, 25);
            }
        } catch (error) {
            console.error('[Optimize] Data fetching failed:', error);
        }

        console.log(`[Optimize] Stores found: ${stores.length}`);
        if (stores.length === 0) {
            console.warn(`[Optimize] CRITICAL: No stores found even at 25km for ${JSON.stringify(searchLocation)}`);
        }

        const optimization = await routeService.calculateOptimalRoute(
            items,
            searchLocation,
            stores,
            {
                maxStores: preferences?.maxStores || 3,
                maxDistance: preferences?.maxDistance || 10000,
                excludedChains: preferences?.excludedChains
            }
        );

        const response = {
            success: true,
            searchLocation: searchLocation, // Expose actual search location used (e.g. override if remote)
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
            stores = await dataAggregator.getStoresNearby(userLocation);
        } catch (error) {
            console.error('[Calculate-Savings] DataAggregator failed. Returning empty comparison.');
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
