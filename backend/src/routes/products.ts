import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import aiService from '../services/aiService.js';
import dataAggregator from '../services/providers/DataAggregator.js';
import comparisonService from '../services/comparisonService.js';
import { ApiError } from '../middleware/errorHandler.js';
import { ensureInRegion } from '../utils/locationUtils.js';
import { Store } from '../types/index.js';

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
        const comparison = await comparisonService.compareProductPrices(parsedQuery.items, stores, searchLocation);

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
        const comparison = await comparisonService.compareProductPrices(shoppingItems, stores, searchLocation);


        res.json({
            success: true,
            comparison,
        });
    })
);

/**
 * @route   GET /api/products/brands/:canonicalId
 * @desc    Get brand variations for a canonical product
 * @access  Public
 */
router.get(
    '/brands/:canonicalId',
    generalLimiter,
    [
        param('canonicalId').notEmpty(),
        query('lat').optional().isFloat(),
        query('lng').optional().isFloat(),
        query('radius').optional().isFloat()
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const canonicalId = req.params.canonicalId as string;
        const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
        const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;
        const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10;

        const dataAggregator = (await import('../services/providers/DataAggregator.js')).default;
        const { matchProductToStore, calculateRelevanceScore } = await import('../utils/matching.js');

        // 1. Get regional stores context
        let stores: Store[] = [];

        if (lat !== null && lng !== null) {
            stores = await dataAggregator.getStoresNearby({ lat, lng }, radius);
        }

        // 2. Perform Hybrid Search (Index + Live) - Matches Results page logic
        const nearbyChains = new Set(stores.map(s => s.chain.toLowerCase()).filter(Boolean));
        const chains = Array.from(nearbyChains);

        const { products } = await dataAggregator.searchProductsWithChainVariety(
            [canonicalId],
            chains,
            {
                location: lat !== null && lng !== null ? { lat, lng } : undefined,
                radius: radius
            }
        );

        // 3. Group by product name and aggregate prices across regional stores
        const productMap = new Map();

        products.forEach(p => {
            // Filter: Only include if available in a nearby store instance or its chain
            // Use matchProductToStore for consistency with results/optimization logic
            const isNearby = stores.length === 0 || stores.some(s => matchProductToStore(p, s));

            if (!isNearby) return;

            const name = p.name;
            if (!productMap.has(name)) {
                productMap.set(name, {
                    id: p.id,
                    name: name,
                    imageUrl: p.image_url, // Capture first found image
                    ingredients: p.ingredients,
                    allergens: p.allergens,
                    minPrice: p.price,
                    maxPrice: p.price,
                    storeCount: 0,
                    chains: new Set(),
                    relevanceScore: calculateRelevanceScore(name, canonicalId) // Calculate score once
                });
            }

            const regionalProduct = productMap.get(name);
            regionalProduct.minPrice = Math.min(regionalProduct.minPrice, p.price);
            regionalProduct.maxPrice = Math.max(regionalProduct.maxPrice, p.price);
            regionalProduct.storeCount++;
            if (p.chain) regionalProduct.chains.add(p.chain);

            // DATA ENRICHMENT: If the current product has better data than what we have stored, update it!
            // Priority: Has Image > Has Ingredients > Existing
            if (!regionalProduct.imageUrl && p.image_url) {
                regionalProduct.imageUrl = p.image_url;
            }
            if (!regionalProduct.ingredients && p.ingredients) {
                regionalProduct.ingredients = p.ingredients;
                regionalProduct.allergens = p.allergens;
            }
        });

        const brandList = Array.from(productMap.values())
            .map(b => ({
                ...b,
                chains: Array.from(b.chains)
            }))
            // Sort by:
            // 1. Has Ingredients (High Priority)
            // 2. Relevance Score (Desc)
            // 3. Store Count (Desc)
            .sort((a, b) => {
                const hasIngredientsA = a.ingredients && a.ingredients.length > 0;
                const hasIngredientsB = b.ingredients && b.ingredients.length > 0;

                if (hasIngredientsB && !hasIngredientsA) return 1;
                if (!hasIngredientsB && hasIngredientsA) return -1;

                if (Math.abs(b.relevanceScore - a.relevanceScore) > 10) {
                    return b.relevanceScore - a.relevanceScore;
                }
                return b.storeCount - a.storeCount;
            })
            .slice(0, 5); // Limit to top 5

        res.json({
            success: true,
            brands: brandList,
            count: brandList.length
        });
    })
);

export default router;
