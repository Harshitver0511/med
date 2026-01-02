const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { get, set } = require('../config/redis');
const logger = require('../utils/logger');

async function authenticateApiKey(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
            return res.status(401).json({
                error: 'API key required',
                message: 'Please provide an API key in the X-API-Key header'
            });
        }
        
        // Check rate limit first
        const rateLimitKey = `rate_limit:${apiKey}`;
        const currentCount = await get(rateLimitKey) || 0;
        const rateLimit = parseInt(process.env.RATE_LIMIT) || 100;
        
        if (parseInt(currentCount) >= rateLimit) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: `You have exceeded the rate limit of ${rateLimit} requests per 15 minutes`
            });
        }
        
        // Check Redis cache first
        const cacheKey = `api_key:${apiKey}`;
        let cachedKey = await get(cacheKey);
        
        if (cachedKey) {
            const keyData = JSON.parse(cachedKey);
            if (keyData.is_active) {
                // Increment rate limit counter
                await set(rateLimitKey, parseInt(currentCount) + 1, 900); // 15 minutes
                
                // Attach key info to request
                req.apiKeyData = keyData;
                return next();
            }
        }
        
        // Query database if not in cache
        const keyHash = hashApiKey(apiKey);
        const result = await query(`
            SELECT ak.*, m.manufacturer_id 
            FROM api_keys ak 
            JOIN manufacturers m ON ak.manufacturer_id = m.id 
            WHERE ak.key_hash = $1 AND ak.is_active = true
        `, [keyHash]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid API key',
                message: 'The provided API key is not valid or has been deactivated'
            });
        }
        
        const keyData = result.rows[0];
        
        // Cache the key data
        await set(cacheKey, JSON.stringify(keyData), 3600); // 1 hour
        
        // Increment rate limit counter
        await set(rateLimitKey, parseInt(currentCount) + 1, 900);
        
        // Attach key info to request
        req.apiKeyData = keyData;
        
        next();
        
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(500).json({
            error: 'Authentication failed',
            message: 'An error occurred during authentication'
        });
    }
}

function hashApiKey(apiKey) {
    const secret = process.env.API_KEY_HASH_SECRET || 'default-secret';
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(apiKey + secret).digest('hex');
}

function generateApiKey() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
}

async function createApiKey(manufacturerId, name, expiresAt = null, rateLimit = 100) {
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);
    
    const result = await query(`
        INSERT INTO api_keys (key_hash, manufacturer_id, name, expires_at, rate_limit_per_minute)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
    `, [keyHash, manufacturerId, name, expiresAt, rateLimit]);
    
    return {
        apiKey,
        id: result.rows[0].id,
        createdAt: result.rows[0].created_at
    };
}

async function validateApiKey(apiKey) {
    try {
        const keyHash = hashApiKey(apiKey);
        const result = await query(`
            SELECT ak.*, m.manufacturer_id 
            FROM api_keys ak 
            JOIN manufacturers m ON ak.manufacturer_id = m.id 
            WHERE ak.key_hash = $1 AND ak.is_active = true
            AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
        `, [keyHash]);
        
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('API key validation error:', error);
        return null;
    }
}

async function revokeApiKey(apiKeyId) {
    try {
        await query(`
            UPDATE api_keys 
            SET is_active = false 
            WHERE id = $1
        `, [apiKeyId]);
        
        return true;
    } catch (error) {
        logger.error('API key revocation error:', error);
        return false;
    }
}

module.exports = {
    authenticateApiKey,
    createApiKey,
    validateApiKey,
    revokeApiKey,
    hashApiKey
};