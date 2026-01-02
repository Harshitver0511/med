const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { query } = require('../config/database');
const { get, set, incr } = require('../config/redis');
const { generateAuthenticationCode, verifyCode } = require('../services/verificationService');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateVerificationRequest = [
    body('authentication_code')
        .notEmpty()
        .withMessage('Authentication code is required')
        .isLength({ min: 32, max: 32 })
        .withMessage('Authentication code must be 32 characters'),
    body('location.latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    body('location.longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180')
];

// Verify authentication code
router.post('/',
    validateVerificationRequest,
    asyncHandler(async (req, res) => {
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

        const { authentication_code, location } = req.body;
        const manufacturerId = req.apiKeyData.manufacturer_id;
        const apiKeyId = req.apiKeyData.id;

        // Check rate limit for this specific API key
        const rateLimitKey = `verify_rate:${apiKeyId}`;
        const currentCount = await get(rateLimitKey) || 0;
        const verifyRateLimit = 1000; // 1000 verifications per hour per API key

        if (parseInt(currentCount) >= verifyRateLimit) {
            return res.status(429).json({
                success: false,
                error: 'Verification rate limit exceeded',
                retryAfter: '1 hour'
            });
        }

        // Increment verification rate counter
        await incr(rateLimitKey);
        await set(rateLimitKey, parseInt(currentCount) + 1, 3600); // 1 hour expiry

        // Perform verification
        const result = await verifyCode(authentication_code, manufacturerId, location, apiKeyId);

        res.json({
            success: true,
            data: result
        });
    })
);

// Sync offline verifications
router.post('/sync',
    asyncHandler(async (req, res) => {
        const { verifications } = req.body;
        const manufacturerId = req.apiKeyData.manufacturer_id;
        const apiKeyId = req.apiKeyData.id;

        if (!Array.isArray(verifications)) {
            return res.status(400).json({
                success: false,
                error: 'Verifications must be an array'
            });
        }

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        for (const verification of verifications) {
            try {
                const { authentication_code, location } = verification;
                
                if (!authentication_code || authentication_code.length !== 32) {
                    results.push({
                        code: authentication_code,
                        status: 'error',
                        error: 'Invalid authentication code'
                    });
                    errorCount++;
                    continue;
                }

                const result = await verifyCode(
                    authentication_code,
                    manufacturerId,
                    location,
                    apiKeyId,
                    true // Mark as offline verification
                );

                results.push({
                    code: authentication_code,
                    status: 'success',
                    result: result
                });
                successCount++;

            } catch (error) {
                logger.error('Sync verification error:', error);
                results.push({
                    code: verification.authentication_code || 'unknown',
                    status: 'error',
                    error: error.message
                });
                errorCount++;
            }
        }

        res.json({
            success: true,
            data: {
                total: verifications.length,
                successful: successCount,
                failed: errorCount,
                results: results
            }
        });
    })
);

// Get verification statistics
router.get('/stats',
    asyncHandler(async (req, res) => {
        const manufacturerId = req.apiKeyData.manufacturer_id;
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        let params = [manufacturerId];

        if (start_date && end_date) {
            dateFilter = 'AND vl.verification_timestamp BETWEEN $2 AND $3';
            params.push(start_date, end_date);
        }

        const statsQuery = `
            SELECT 
                COUNT(*) as total_verifications,
                COUNT(CASE WHEN vl.result = 'authentic' THEN 1 END) as authentic_count,
                COUNT(CASE WHEN vl.result = 'suspicious' THEN 1 END) as suspicious_count,
                COUNT(CASE WHEN vl.result = 'invalid' THEN 1 END) as invalid_count,
                COUNT(CASE WHEN vl.is_duplicate = true THEN 1 END) as duplicate_count,
                COUNT(CASE WHEN vl.is_offline = true THEN 1 END) as offline_count,
                AVG(vl.confidence_score) as avg_confidence,
                DATE(vl.verification_timestamp) as verification_date,
                COUNT(*) as daily_count
            FROM verification_logs vl
            JOIN authentication_codes ac ON vl.authentication_code_id = ac.id
            JOIN batches b ON ac.batch_id = b.id
            WHERE b.manufacturer_id = $1 ${dateFilter}
            GROUP BY DATE(vl.verification_timestamp)
            ORDER BY verification_date DESC
            LIMIT 30
        `;

        const result = await query(statsQuery, params);

        // Calculate summary statistics
        const summaryQuery = `
            SELECT 
                COUNT(*) as total_verifications,
                COUNT(CASE WHEN vl.result = 'authentic' THEN 1 END) as authentic_count,
                COUNT(CASE WHEN vl.result = 'suspicious' THEN 1 END) as suspicious_count,
                COUNT(CASE WHEN vl.result = 'invalid' THEN 1 END) as invalid_count,
                COUNT(CASE WHEN vl.is_duplicate = true THEN 1 END) as duplicate_count,
                COUNT(CASE WHEN vl.is_offline = true THEN 1 END) as offline_count,
                AVG(vl.confidence_score) as avg_confidence
            FROM verification_logs vl
            JOIN authentication_codes ac ON vl.authentication_code_id = ac.id
            JOIN batches b ON ac.batch_id = b.id
            WHERE b.manufacturer_id = $1 ${dateFilter}
        `;

        const summaryResult = await query(summaryQuery, params);
        const summary = summaryResult.rows[0];

        res.json({
            success: true,
            data: {
                summary: {
                    total_verifications: parseInt(summary.total_verifications) || 0,
                    authentic_count: parseInt(summary.authentic_count) || 0,
                    suspicious_count: parseInt(summary.suspicious_count) || 0,
                    invalid_count: parseInt(summary.invalid_count) || 0,
                    duplicate_count: parseInt(summary.duplicate_count) || 0,
                    offline_count: parseInt(summary.offline_count) || 0,
                    avg_confidence: parseFloat(summary.avg_confidence) || 0
                },
                daily_breakdown: result.rows.map(row => ({
                    date: row.verification_date,
                    count: parseInt(row.daily_count),
                    authentic_count: parseInt(row.authentic_count || 0),
                    suspicious_count: parseInt(row.suspicious_count || 0),
                    invalid_count: parseInt(row.invalid_count || 0)
                }))
            }
        });
    })
);

// Generate authentication codes for a batch
router.post('/generate',
    [
        body('batch_id').notEmpty().withMessage('Batch ID is required'),
        body('count').isInt({ min: 1 }).withMessage('Count must be a positive integer')
    ],
    asyncHandler(async (req, res) => {
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

        const { batch_id, count } = req.body;
        const manufacturerId = req.apiKeyData.manufacturer_id;

        // Check if batch exists
        const batchResult = await query(`
            SELECT id FROM batches 
            WHERE batch_id = $1 AND manufacturer_id = $2
        `, [batch_id, manufacturerId]);

        if (batchResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Batch not found'
            });
        }

        const batchId = batchResult.rows[0].id;
        const codes = [];

        // Generate authentication codes
        for (let i = 0; i < count; i++) {
            const serialNumber = generateSerialNumber(batch_id, i + 1);
            const authCode = generateAuthenticationCode(
                manufacturerId,
                batch_id,
                serialNumber
            );

            codes.push({
                batch_id: batchId,
                serial_number: serialNumber,
                authentication_code: authCode
            });
        }

        // Insert codes in batch
        const insertQuery = `
            INSERT INTO authentication_codes (batch_id, serial_number, authentication_code)
            VALUES ($1, $2, $3)
        `;

        let insertedCount = 0;
        for (const code of codes) {
            try {
                await query(insertQuery, [code.batch_id, code.serial_number, code.authentication_code]);
                insertedCount++;
            } catch (error) {
                if (error.code !== '23505') { // Ignore duplicate key errors
                    logger.error('Error inserting authentication code:', error);
                }
            }
        }

        res.json({
            success: true,
            data: {
                batch_id: batch_id,
                requested_count: count,
                generated_count: insertedCount,
                codes: codes.slice(0, 10) // Return first 10 for reference
            }
        });
    })
);

function generateSerialNumber(batchId, index) {
    return `${batchId}-${index.toString().padStart(6, '0')}`;
}

module.exports = router;