import rateLimit from 'express-rate-limit';

/**
 * General rate limiter for all standard API endpoints.
 * Allows 500 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    skip: () => process.env.NODE_ENV === 'development', // Only skip in explicit dev
    message: {
        success: false,
        message: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter for expensive operations (e.g., AI requests, external API calls).
 * Allows 100 requests per 15 minutes per IP.
 */
export const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    skip: () => process.env.NODE_ENV === 'development', // Only skip in explicit dev
    message: {
        success: false,
        message: 'High traffic detected for expensive operations. Please slow down and try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export default {
    generalLimiter,
    strictLimiter,
};
