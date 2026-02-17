import { Router, Request, Response } from 'express';
import { query, param, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import dataAggregator from '../services/providers/DataAggregator.js';
import { ApiError } from '../middleware/errorHandler.js';
import { ensureInRegion } from '../utils/locationUtils.js';

const router = Router();

/**
 * @route   GET /api/stores/nearby
 * @desc    Get grocery stores near geographical coordinates
 * @access  Public
 */
router.get(
    '/nearby',
    generalLimiter,
    [
        query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
        query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
        query('radius').optional().isFloat({ min: 0.1, max: 50 }).withMessage('Radius must be between 0.1 and 50'),
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiError(400, 'Invalid coordinate parameters');
        }

        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);
        const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5;

        const { location: searchLocation, radius: searchRadius } = ensureInRegion(
            { lat, lng },
            radius
        );

        const stores = await dataAggregator.getStoresNearby(searchLocation, searchRadius);

        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        res.json({
            success: true,
            count: stores.length,
            radius,
            stores,
        });
    })
);

/**
 * @route   GET /api/stores/chains
 * @desc    Get list of supported grocery chains
 * @access  Public
 */
router.get(
    '/chains',
    generalLimiter,
    asyncHandler(async (req: Request, res: Response) => {
        // These are typical chains in Norway supported by Kassal
        const chains = [
            'Rema 1000',
            'Kiwi',
            'Extra',
            'Meny',
            'Spar',
            'Coop Prix',
            'Coop Mega',
            'Joker',
            'Bunnpris'
        ];

        res.json({
            success: true,
            chains,
        });
    })
);

/**
 * @route   GET /api/stores/:storeId
 * @desc    Get specific store details
 * @access  Public
 */
router.get(
    '/:storeId',
    generalLimiter,
    [param('storeId').notEmpty()],
    asyncHandler(async (req: Request, res: Response) => {
        const { storeId } = req.params;

        // In a full implementation, we'd have getStoreById in kassalService
        // For now, we search within a large radius if coordinates are unknown, 
        // or return 404/fallback.

        // Fallback logic or mock detailed response
        res.json({
            success: true,
            message: 'Store details endpoint is active. Integration with detailed store API is pending.',
            storeId
        });
    })
);

export default router;
