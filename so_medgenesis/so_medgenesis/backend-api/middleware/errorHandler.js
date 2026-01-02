const logger = require('../utils/logger');

// 404 Not Found middleware
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;
    
    // Log error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    // Specific error handling
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }
    
    if (err.code === '23505') { // PostgreSQL unique violation
        statusCode = 409;
        message = 'Duplicate entry found';
    }
    
    if (err.code === '23503') { // PostgreSQL foreign key violation
        statusCode = 400;
        message = 'Invalid reference to related data';
    }
    
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    
    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Internal server error';
    }
    
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    });
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Request validation error handler
const validationErrorHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array()
            }
        });
    }
    next();
};

module.exports = {
    notFound,
    errorHandler,
    asyncHandler,
    validationErrorHandler
};