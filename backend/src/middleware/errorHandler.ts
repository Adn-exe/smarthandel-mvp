import { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';

/**
 * Custom error class for API-related errors.
 */
export class ApiError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(statusCode: number, message: string, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Wrapper for async route handlers to catch errors and pass them to the global error handler.
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

/**
 * Global error handling middleware.
 */
export const errorHandler = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let { statusCode, message } = err as ApiError;

    // If the error is not an instance of ApiError, default to 500
    if (!(err instanceof ApiError)) {
        statusCode = 500;
        message = config.nodeEnv === 'production'
            ? 'Internal Server Error'
            : err.message || 'Internal Server Error';
    }

    // Log error for development
    if (config.nodeEnv === 'development') {
        console.error(`[Error] ${req.method} ${req.path}:`, err);
    }

    const response = {
        success: false,
        statusCode,
        message,
        ...(config.nodeEnv === 'development' && { stack: err.stack }),
    };

    res.status(statusCode).json(response);
};

export default errorHandler;
