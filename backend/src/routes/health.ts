import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import dataAggregator from '../services/providers/DataAggregator.js';
import aiService from '../services/aiService.js';
import cache from '../utils/cache.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = Router();

// Load package.json for version reporting
let packageVersion = '1.0.0';
try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    packageVersion = packageJson.version;
} catch (error) {
    console.warn('[HealthRouter] Could not read package.json version');
}

/**
 * @route   GET /api/health
 * @desc    Basic system health and performance stats
 * @access  Public
 */
router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: packageVersion
        });
    })
);

/**
 * @route   GET /api/health/ready
 * @desc    Readiness check for external service connectivity
 * @access  Public
 */
router.get(
    '/ready',
    asyncHandler(async (req: Request, res: Response) => {
        const health = await dataAggregator.checkHealth();
        const kassalOk = health['Kassal API'];
        const offlineOk = health['Weekly Offers (Trondheim)'];
        const aiOk = await aiService.checkHealth();

        // Test cache
        let cacheOk = false;
        try {
            cache.set('health_check', true, 10);
            cacheOk = cache.get('health_check') === true;
        } catch (e) {
            console.error('[HealthRouter] Cache check failed:', e);
        }

        const ready = kassalOk && aiOk && cacheOk;

        res.status(ready ? 200 : 503).json({
            ready,
            services: {
                kassal: kassalOk ? 'ok' : 'error',
                offline: offlineOk ? 'ok' : 'error',
                anthropic: aiOk ? 'ok' : 'error',
                cache: cacheOk ? 'ok' : 'error'
            }
        });
    })
);

export default router;
