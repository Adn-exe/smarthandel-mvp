import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import hpp from 'hpp';
import fs from 'fs/promises';
import path from 'path';
import config from './config/index.js';
import productsRouter from './routes/products.js';
import storesRouter from './routes/stores.js';
import routeRouter from './routes/route.js';
import aiRouter from './routes/ai.js';
import reportRouter from './routes/report.js';
import healthRouter from './routes/health.js';
import { errorHandler, ApiError } from './middleware/errorHandler.js';
import priceIndexService from './services/PriceIndexService.js';

// Ensure critical data directories and seed files exist before starting
async function initDataDirectory() {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    const reportsFile = path.join(dataDir, 'item_mismatch_reports.json');
    // Create the reports file if it doesn't exist (wx = exclusive create, no overwrite)
    await fs.writeFile(reportsFile, '[]', { flag: 'wx' }).catch(() => {
        // File already exists, nothing to do
    });
    console.log('[Server] Data directory initialized.');
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.port || 3001;

// 1. Basic Middleware
app.use(helmet()); // Security Headers
app.use(hpp()); // HTTP Parameter Pollution Protection
app.use(express.json({ limit: '50kb' }));           // M4: Prevent large payload DoS
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

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
app.use('/api/reports', reportRouter);
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
let server: ReturnType<typeof app.listen> | undefined;
if (process.env.NODE_ENV !== 'test') {
    // C2: Initialize data directories before starting
    initDataDirectory().then(() => {
        server = app.listen(PORT, '0.0.0.0', () => {
            console.log('==========================================');
            console.log(`🚀 SmartHandel Backend is running!`);
            console.log(`📡 Port: ${PORT}`);
            console.log(`🌍 Environment: ${config.nodeEnv}`);
            console.log(`🔗 Local lookup: http://localhost:${PORT}/api/health`);
            console.log(`🔗 Network access: http://0.0.0.0:${PORT}/api/health`);
            console.log('==========================================');

            // Setup automated price indexing
            priceIndexService.scheduleSync().catch(err => {
                console.error('[Server] Price indexing setup failed:', err);
            });
        });
    }).catch(err => {
        console.error('[Server] Failed to initialize data directory. Aborting.', err);
        process.exit(1);
    });
}

// 8. Graceful Shutdown
const shutdown = () => {
    console.log('\n[Server] SIGINT/SIGTERM received. Starting graceful shutdown...');
    if (!server) {
        console.log('[Server] No HTTP server running, exiting immediately.');
        process.exit(0);
        return;
    }
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
