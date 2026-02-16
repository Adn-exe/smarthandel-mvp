import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { strictLimiter } from '../middleware/rateLimiter.js';
import aiService from '../services/aiService.js';
import { ApiError } from '../middleware/errorHandler.js';
import cache from '../utils/cache.js';

const router = Router();

/**
 * @route   POST /api/ai/parse
 * @desc    Parse natural language query into structured shopping data
 * @access  Public
 */
router.post(
    '/parse',
    [body('query').isString().notEmpty().withMessage('Query is required')],
    asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiError(400, 'Query is missing or invalid');
        }

        const { query } = req.body;

        // Cache result for 1 hour
        const cacheKey = `ai:route:parse:${query.trim().toLowerCase()}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);

        // Apply rate limiter only for actual AI generation (cache miss)
        await new Promise((resolve, reject) => {
            strictLimiter(req, res, (err: any) => {
                if (err) return reject(err);
                resolve(true);
            });
        });

        const parsed = await aiService.parseShoppingQuery(query);

        const response = {
            success: true,
            items: parsed.items,
            budget: parsed.budget,
            language: query.match(/[a-zA-Z]/) ? 'en/no' : 'no', // Simple heuristic
            rawQuery: query,
            timestamp: new Date()
        };

        cache.set(cacheKey, response, 3600);
        res.json(response);
    })
);

/**
 * @route   POST /api/ai/suggest
 * @desc    Get shopping suggestions based on current items
 * @access  Public
 */
router.post(
    '/suggest',
    strictLimiter,
    [
        body('items').isArray().notEmpty().withMessage('Items array is required'),
        body('context').optional().isString()
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const { items, context } = req.body;

        const suggestions = await aiService.getSuggestions(items, context);

        res.json({
            success: true,
            suggestions,
            timestamp: new Date()
        });
    })
);

export default router;
