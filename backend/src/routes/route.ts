import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { strictLimiter } from '../middleware/rateLimiter.js';
import routeService from '../services/routeService.js';
import comparisonService from '../services/comparisonService.js';
import kassalService from '../services/kassalService.js';
import { ApiError } from '../middleware/errorHandler.js';
import cache from '../utils/cache.js';

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

        const stores = await kassalService.getStoresNearby(
            userLocation,
            (preferences?.maxDistance || 10000) / 1000 // Convert m to km
        );

        if (stores.length === 0) {
            console.warn(`[Optimize] No stores found near ${userLocation.lat},${userLocation.lng}. Falling back to Oslo (Demo Mode).`);
            // Fallback to Oslo for demo/testing purposes
            const demoLocation = { lat: 59.9139, lng: 10.7522 };
            const demoStores = await kassalService.getStoresNearby(
                demoLocation,
                (preferences?.maxDistance || 10000) / 1000
            );

            if (demoStores.length === 0) {
                throw new ApiError(404, 'No stores found within the specified distance (even in demo location)');
            }
            stores.push(...demoStores);
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

        const stores = await kassalService.getStoresNearby(userLocation);
        const comparison = await comparisonService.compareProductPrices(shoppingItems, stores);

        res.json({
            success: true,
            data: comparison
        });
    })
);

export default router;
