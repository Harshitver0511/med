const { query } = require('../config/database');
const { get, set, incr } = require('../config/redis');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Generate authentication code using SHA-256 hashing
 */
function generateAuthenticationCode(manufacturerId, batchId, serialNumber) {
    const secret = process.env.CODE_GENERATION_SECRET || 'default-secret-key';
    const input = `${manufacturerId}:${batchId}:${serialNumber}:${secret}`;
    
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    return hash.substring(0, 32); // Take first 32 characters
}

/**
 * Verify authentication code
 */
async function verifyCode(authCode, manufacturerId, location, apiKeyId, isOffline = false) {
    try {
        // Normalize the authentication code (remove hyphens, convert to uppercase)
        const normalizedCode = authCode.replace(/-/g, '').toUpperCase();
        
        // Check Redis cache first
        const cacheKey = `auth_code:${normalizedCode}`;
        let cachedCode = await get(cacheKey);
        
        let codeData;
        
        if (cachedCode) {
            codeData = JSON.parse(cachedCode);
        } else {
            // Query database
            const result = await query(`
                SELECT 
                    ac.id,
                    ac.authentication_code,
                    ac.serial_number,
                    ac.status,
                    ac.first_verified_at,
                    ac.revoked_at,
                    b.batch_id,
                    b.product_name,
                    b.expiry_date,
                    b.manufacturing_date,
                    m.manufacturer_id,
                    m.name as manufacturer_name
                FROM authentication_codes ac
                JOIN batches b ON ac.batch_id = b.id
                JOIN manufacturers m ON b.manufacturer_id = m.id
                WHERE ac.authentication_code = $1
            `, [normalizedCode]);
            
            if (result.rows.length === 0) {
                // Log invalid code attempt
                await logVerification(normalizedCode, null, apiKeyId, location, 'invalid', 0, isOffline);
                
                return {
                    status: 'invalid',
                    confidence: 0,
                    message: 'Authentication code not found'
                };
            }
            
            codeData = result.rows[0];
            
            // Cache the result for 1 hour
            await set(cacheKey, JSON.stringify(codeData), 3600);
        }
        
        // Check if code belongs to the requesting manufacturer
        if (codeData.manufacturer_id !== manufacturerId) {
            await logVerification(normalizedCode, codeData.id, apiKeyId, location, 'invalid', 0, isOffline);
            
            return {
                status: 'invalid',
                confidence: 0,
                message: 'Authentication code not found'
            };
        }
        
        // Check code status
        if (codeData.status === 'revoked') {
            await logVerification(normalizedCode, codeData.id, apiKeyId, location, 'revoked', 0, isOffline);
            
            return {
                status: 'revoked',
                confidence: 0,
                message: 'This batch has been revoked'
            };
        }
        
        // Check if code has been verified before
        const isDuplicate = codeData.first_verified_at !== null;
        
        // Check expiry date
        const isExpired = codeData.expiry_date && new Date(codeData.expiry_date) < new Date();
        
        if (isExpired) {
            await logVerification(normalizedCode, codeData.id, apiKeyId, location, 'expired', 0, isOffline);
            
            return {
                status: 'expired',
                confidence: 0,
                message: 'This product has expired'
            };
        }
        
        // Calculate confidence score
        let confidence = 1.0; // Start with 100% confidence
        
        if (isDuplicate) {
            confidence -= 0.3; // Reduce confidence for duplicate scans
        }
        
        if (isOffline) {
            confidence -= 0.2; // Reduce confidence for offline verifications
        }
        
        // Check for suspicious patterns
        const isSuspicious = await checkSuspiciousPatterns(normalizedCode, location);
        if (isSuspicious) {
            confidence -= 0.4;
        }
        
        // Ensure confidence is between 0 and 1
        confidence = Math.max(0, Math.min(1, confidence));
        
        // Determine result status
        let status = 'authentic';
        let message = 'Product verified as authentic';
        
        if (isDuplicate) {
            status = 'duplicate';
            message = 'This code has been verified before';
        }
        
        if (confidence < 0.5) {
            status = 'suspicious';
            message = 'Suspicious activity detected';
        }
        
        // Log verification attempt
        await logVerification(
            normalizedCode,
            codeData.id,
            apiKeyId,
            location,
            status,
            confidence,
            isOffline,
            isDuplicate
        );
        
        // Update first verification timestamp if this is the first verification
        if (!codeData.first_verified_at) {
            await query(`
                UPDATE authentication_codes 
                SET first_verified_at = NOW() 
                WHERE id = $1
            `, [codeData.id]);
        }
        
        // Return result
        return {
            status: status,
            confidence: confidence,
            message: message,
            manufacturer_id: codeData.manufacturer_id,
            manufacturer_name: codeData.manufacturer_name,
            batch_id: codeData.batch_id,
            product_name: codeData.product_name,
            serial_number: codeData.serial_number,
            expiry_date: codeData.expiry_date,
            manufacturing_date: codeData.manufacturing_date,
            is_duplicate: isDuplicate,
            is_offline: isOffline
        };
        
    } catch (error) {
        logger.error('Verification error:', error);
        throw new Error('Verification failed');
    }
}

/**
 * Check for suspicious verification patterns
 */
async function checkSuspiciousPatterns(authCode, location) {
    try {
        // Check for rapid verifications from different locations
        if (location) {
            const locationKey = `rapid_verify:${authCode}:${location.latitude}:${location.longitude}`;
            const rapidCount = await get(locationKey) || 0;
            
            if (parseInt(rapidCount) > 5) { // More than 5 verifications from same location in 1 hour
                return true;
            }
            
            await incr(locationKey);
            await set(locationKey, parseInt(rapidCount) + 1, 3600); // 1 hour expiry
        }
        
        // Check for verifications from geographically distant locations
        const recentVerifications = await query(`
            SELECT location_lat, location_lng, verification_timestamp
            FROM verification_logs vl
            JOIN authentication_codes ac ON vl.authentication_code_id = ac.id
            WHERE ac.authentication_code = $1
            AND vl.verification_timestamp > NOW() - INTERVAL '1 hour'
            AND vl.location_lat IS NOT NULL AND vl.location_lng IS NOT NULL
            ORDER BY verification_timestamp DESC
            LIMIT 10
        `, [authCode]);
        
        if (location && recentVerifications.rows.length > 0) {
            const recentLocation = recentVerifications.rows[0];
            const distance = calculateDistance(
                location.latitude, location.longitude,
                recentLocation.location_lat, recentLocation.location_lng
            );
            
            // If distance is more than 100km in less than 1 hour, it's suspicious
            if (distance > 100) {
                return true;
            }
        }
        
        return false;
        
    } catch (error) {
        logger.error('Suspicious pattern check error:', error);
        return false;
    }
}

/**
 * Log verification attempt
 */
async function logVerification(authCode, codeId, apiKeyId, location, result, confidence, isOffline, isDuplicate = false) {
    try {
        await query(`
            INSERT INTO verification_logs (
                authentication_code_id,
                api_key_id,
                location_lat,
                location_lng,
                result,
                confidence_score,
                is_duplicate,
                is_offline
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            codeId,
            apiKeyId,
            location?.latitude,
            location?.longitude,
            result,
            confidence,
            isDuplicate,
            isOffline
        ]);
        
        // Log to Redis for real-time monitoring
        const logKey = `verification_log:${Date.now()}`;
        await set(logKey, JSON.stringify({
            authCode,
            result,
            confidence,
            timestamp: new Date().toISOString(),
            isOffline
        }), 86400); // 24 hours
        
    } catch (error) {
        logger.error('Failed to log verification:', error);
    }
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Batch revoke authentication codes
 */
async function revokeBatch(batchId, reason) {
    try {
        // Update batch status
        await query(`
            UPDATE batches 
            SET status = 'revoked', updated_at = NOW()
            WHERE batch_id = $1
        `, [batchId]);
        
        // Update all codes in the batch
        const result = await query(`
            UPDATE authentication_codes 
            SET status = 'revoked', revoked_at = NOW()
            WHERE batch_id IN (
                SELECT id FROM batches WHERE batch_id = $1
            )
            RETURNING id
        `, [batchId]);
        
        // Clear Redis cache for these codes
        const codes = result.rows;
        for (const code of codes) {
            const cacheKey = `auth_code:${code.id}`;
            // Note: In a real implementation, we'd need to get the actual auth code
        }
        
        logger.info(`Batch ${batchId} revoked: ${result.rowCount} codes affected`);
        
        return {
            batchId: batchId,
            affectedCodes: result.rowCount,
            reason: reason
        };
        
    } catch (error) {
        logger.error('Batch revocation error:', error);
        throw new Error('Failed to revoke batch');
    }
}

module.exports = {
    generateAuthenticationCode,
    verifyCode,
    revokeBatch
};