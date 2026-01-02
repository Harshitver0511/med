const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'medgenesis-backend' },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Write HTTP logs to separate file
        new winston.transports.File({
            filename: path.join(logDir, 'http.log'),
            level: 'http',
            maxsize: 5242880, // 5MB
            maxFiles: 3
        })
    ]
});

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
            })
        )
    }));
}

// Create a stream object for Morgan HTTP logging
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

// Custom logging methods
logger.logRequest = (req, res, responseTime) => {
    const logData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        responseTime: responseTime,
        statusCode: res.statusCode,
        contentLength: res.get('Content-Length')
    };
    
    logger.http('HTTP Request', logData);
};

logger.logError = (error, req, res) => {
    const logData = {
        message: error.message,
        stack: error.stack,
        url: req ? req.originalUrl : 'N/A',
        method: req ? req.method : 'N/A',
        ip: req ? req.ip : 'N/A',
        statusCode: res ? res.statusCode : 'N/A'
    };
    
    logger.error('Application Error', logData);
};

logger.logDatabaseQuery = (query, params, duration, error) => {
    const logData = {
        query: query.substring(0, 100), // First 100 chars
        params: params ? JSON.stringify(params) : 'N/A',
        duration: duration,
        error: error ? error.message : null
    };
    
    if (error) {
        logger.error('Database Query Error', logData);
    } else {
        logger.debug('Database Query', logData);
    }
};

logger.logVerification = (authCode, result, confidence, location, apiKeyId) => {
    const logData = {
        authenticationCode: authCode,
        result: result,
        confidence: confidence,
        location: location ? `${location.latitude},${location.longitude}` : 'N/A',
        apiKeyId: apiKeyId,
        timestamp: new Date().toISOString()
    };
    
    logger.info('Verification', logData);
};

module.exports = logger;