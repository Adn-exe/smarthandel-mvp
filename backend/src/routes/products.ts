import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import aiService from '../services/aiService.js';
import dataAggregator from '../services/providers/DataAggregator.js';
import comparisonService from '../services/comparisonService.js';
import { ApiError } from '../middleware/errorHandler.js';
import { ensureInRegion } from '../utils/locationUtils.js';

const router = Router();

/**
 * @route   POST /api/products/search
 * @desc    Search for products using natural language
 * @access  Public
 */
router.post(
    '/search',
    generalLimiter,
    [
        body('query').isString().notEmpty().withMessage('Query is required'),
        body('location.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
        body('location.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiError(400, 'Validation failed', true);
        }

        const { query, location } = req.body;

        // 1. Parse natural language query with AI
        const parsedQuery = await aiService.parseShoppingQuery(query);

        // 2. Search for stores nearby (Apply Trondheim Snap)
        const { location: searchLocation } = ensureInRegion(location, 10);
        const stores = await dataAggregator.getStoresNearby(searchLocation);

        if (stores.length === 0) {
            console.warn(`[ProductsSearch] No stores found near location. Returning empty comparison.`);
            return res.json({
                success: true,
                items: parsedQuery.items,
                budget: parsedQuery.budget,
                comparison: { byStore: {}, byItem: {}, cheapestStore: null, mostExpensiveStore: null, maxSavings: 0 },
                timestamp: new Date(),
            });
        }

        // 3. Compare prices for all extracted items across found stores
        const comparison = await comparisonService.compareProductPrices(parsedQuery.items, stores);

        res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 mins
        res.json({
            success: true,
            items: parsedQuery.items,
            budget: parsedQuery.budget,
            comparison,
            timestamp: new Date(),
        });
    })
);

/**
 * @route   GET /api/products/:productId
 * @desc    Get detailed information for a specific product
 * @access  Public
 */
router.get(
    '/:productId',
    generalLimiter,
    [param('productId').notEmpty()],
    asyncHandler(async (req: Request, res: Response) => {
        const { productId } = req.params;
        const product = await dataAggregator.getProductById(productId as string);

        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.json({
            success: true,
            data: product,
        });
    })
);

/**
 * @route   POST /api/products/compare
 * @desc    Compare specific items across stores
 * @access  Public
 */
router.post(
    '/compare',
    generalLimiter,
    [
        body('items').isArray().notEmpty().withMessage('Items array is required'),
        body('location.lat').isFloat().withMessage('Latitude must be a number'),
        body('location.lng').isFloat().withMessage('Longitude must be a number'),
        body('radius').optional().isFloat({ min: 0 }).withMessage('Radius must be a non-negative number'),
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiError(400, 'Validation failed', true);
        }

        const { items, location, radius } = req.body;

        // Map string items to ShoppingItem objects
        const shoppingItems = items.map((name: string) => ({ name, quantity: 1 }));

        const { location: searchLocation, radius: searchRadius } = ensureInRegion(
            { lat: location.lat, lng: location.lng },
            radius
        );

        const stores = await dataAggregator.getStoresNearby(searchLocation, searchRadius);
        const comparison = await comparisonService.compareProductPrices(shoppingItems, stores);

        res.json({
            success: true,
            comparison,
        });
    })
);

export default router;
