import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import config from './config/index.js';
import productsRouter from './routes/products.js';
import storesRouter from './routes/stores.js';
import routeRouter from './routes/route.js';
import aiRouter from './routes/ai.js';
import healthRouter from './routes/health.js';
import { errorHandler, ApiError } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.port || 3001;

// 1. Basic Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Logging (Morgan)
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
    console.log('[Server] Morgan development logging enabled');
} else {
    app.use(morgan('combined'));
}

// 3. CORS Configuration
app.use(cors({
    origin: config.allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
}));

// 4. Mount Routes
app.use('/api/products', productsRouter);
app.use('/api/stores', storesRouter);
app.use('/api/route', routeRouter);
app.use('/api/ai', aiRouter);
app.use('/api/health', healthRouter);

// Legacy/Health Alias
app.get('/health', (req, res) => {
    res.redirect('/api/health');
});

// 5. 404 Handler for unknown routes
app.use((req: Request, res: Response, next: NextFunction) => {
    next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// 6. Global Error Handler (Must be last)
app.use(errorHandler);

// 7. Start Server
let server: any;
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log('==========================================');
        console.log(`🚀 SmartHandel Backend is running!`);
        console.log(`📡 Port: ${PORT}`);
        console.log(`🌍 Environment: ${config.nodeEnv}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
        console.log('==========================================');
    });
}

// 8. Graceful Shutdown
const shutdown = () => {
    console.log('\n[Server] SIGINT/SIGTERM received. Starting graceful shutdown...');
    server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
    });

    // If server hasn't closed in 10s, force shutdown
    setTimeout(() => {
        console.error('[Server] Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught Exception:', error);
    shutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown();
});

export { app };
export default app;
