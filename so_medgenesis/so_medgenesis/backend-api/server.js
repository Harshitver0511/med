const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { authenticateApiKey } = require('./middleware/auth');
const verificationRoutes = require('./routes/verification');
const batchRoutes = require('./routes/batch');
const statsRoutes = require('./routes/stats');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Logging
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) }
    }));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT || 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API routes
app.use('/api/verify', authenticateApiKey, verificationRoutes);
app.use('/api/batches', authenticateApiKey, batchRoutes);
app.use('/api/stats', authenticateApiKey, statsRoutes);

// Sync endpoint for offline data
app.use('/api/sync', authenticateApiKey, verificationRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
async function startServer() {
    try {
        // Connect to database
        await connectDatabase();
        logger.info('Database connected successfully');
        
        // Connect to Redis
        await connectRedis();
        logger.info('Redis connected successfully');
        
        // Start server
        app.listen(PORT, () => {
            logger.info(`MEDGENESIS Backend API running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
        
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    app.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

startServer();

module.exports = app;