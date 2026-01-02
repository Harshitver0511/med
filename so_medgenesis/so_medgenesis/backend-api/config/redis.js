const redis = require('redis');
const logger = require('../utils/logger');

let client;

async function connectRedis() {
    try {
        const config = {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            db: process.env.REDIS_DB || 0,
            retry_strategy: (options) => {
                if (options.error && options.error.code === 'ECONNREFUSED') {
                    logger.error('Redis server connection refused');
                    return new Error('Redis server connection refused');
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    return new Error('Retry time exhausted');
                }
                if (options.attempt > 10) {
                    return undefined;
                }
                // reconnect after
                return Math.min(options.attempt * 100, 3000);
            }
        };

        client = redis.createClient(config);

        client.on('error', (err) => {
            logger.error('Redis error:', err);
        });

        client.on('connect', () => {
            logger.info('Redis connected successfully');
        });

        await client.connect();
        
    } catch (error) {
        logger.error('Redis connection failed:', error);
        // Don't throw error in development if Redis is not available
        if (process.env.NODE_ENV === 'production') {
            throw error;
        }
    }
}

async function get(key) {
    try {
        if (!client) return null;
        return await client.get(key);
    } catch (error) {
        logger.error('Redis get error:', error);
        return null;
    }
}

async function set(key, value, expireInSeconds = 3600) {
    try {
        if (!client) return;
        await client.setEx(key, expireInSeconds, value);
    } catch (error) {
        logger.error('Redis set error:', error);
    }
}

async function del(key) {
    try {
        if (!client) return;
        await client.del(key);
    } catch (error) {
        logger.error('Redis del error:', error);
    }
}

async function exists(key) {
    try {
        if (!client) return false;
        return await client.exists(key);
    } catch (error) {
        logger.error('Redis exists error:', error);
        return false;
    }
}

async function incr(key) {
    try {
        if (!client) return 0;
        return await client.incr(key);
    } catch (error) {
        logger.error('Redis incr error:', error);
        return 0;
    }
}

async function expire(key, seconds) {
    try {
        if (!client) return;
        await client.expire(key, seconds);
    } catch (error) {
        logger.error('Redis expire error:', error);
    }
}

async function closeRedis() {
    if (client) {
        await client.disconnect();
        logger.info('Redis connection closed');
    }
}

module.exports = {
    connectRedis,
    get,
    set,
    del,
    exists,
    incr,
    expire,
    closeRedis
};