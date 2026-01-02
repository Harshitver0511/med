const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware for batch operations
const validateBatchCreation = [
    body('batch_id').notEmpty().withMessage('Batch ID is required'),
    body('product_name').notEmpty().withMessage('Product name is required'),
    body('total_units').isInt({ min: 1 }).withMessage('Total units must be a positive integer'),
    body('expiry_date').optional().isISO8601().withMessage('Expiry date must be in ISO 8601 format'),
    body('manufacturing_date').optional().isISO8601().withMessage('Manufacturing date must be in ISO 8601 format')
];

// Create new batch
router.post('/',
    validateBatchCreation,
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

        const {
            batch_id,
            product_name,
            product_code,
            strength,
            form,
            packaging,
            expiry_date,
            manufacturing_date,
            total_units
        } = req.body;

        const manufacturerId = req.apiKeyData.manufacturer_id;

        // Check if batch already exists
        const existingBatch = await query(`
            SELECT id FROM batches 
            WHERE batch_id = $1 AND manufacturer_id = $2
        `, [batch_id, manufacturerId]);

        if (existingBatch.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Batch with this ID already exists'
            });
        }

        // Create new batch
        const result = await query(`
            INSERT INTO batches (
                manufacturer_id,
                batch_id,
                product_name,
                product_code,
                strength,
                form,
                packaging,
                expiry_date,
                manufacturing_date,
                total_units
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, created_at
        `, [
            manufacturerId,
            batch_id,
            product_name,
            product_code,
            strength,
            form,
            packaging,
            expiry_date,
            manufacturing_date,
            total_units
        ]);

        const newBatch = result.rows[0];

        logger.info(`Batch created: ${batch_id} for manufacturer ${manufacturerId}`);

        res.status(201).json({
            success: true,
            data: {
                batch_id: batch_id,
                id: newBatch.id,
                created_at: newBatch.created_at,
                status: 'active'
            }
        });
    })
);

// Get all batches
router.get('/',
    asyncHandler(async (req, res) => {
        const manufacturerId = req.apiKeyData.manufacturer_id;
        const { status, limit = 50, offset = 0 } = req.query;

        let statusFilter = '';
        let params = [manufacturerId, limit, offset];

        if (status) {
            statusFilter = 'AND b.status = $4';
            params.push(status);
        }

        const result = await query(`
            SELECT 
                b.id,
                b.batch_id,
                b.product_name,
                b.product_code,
                b.strength,
                b.form,
                b.packaging,
                b.expiry_date,
                b.manufacturing_date,
                b.total_units,
                b.created_at,
                b.status,
                COUNT(ac.id) as code_count,
                COUNT(CASE WHEN ac.first_verified_at IS NOT NULL THEN 1 END) as verified_count
            FROM batches b
            LEFT JOIN authentication_codes ac ON b.id = ac.batch_id
            WHERE b.manufacturer_id = $1 ${statusFilter}
            GROUP BY b.id
            ORDER BY b.created_at DESC
            LIMIT $2 OFFSET $3
        `, params);

        res.json({
            success: true,
            data: result.rows.map(batch => ({
                id: batch.id,
                batch_id: batch.batch_id,
                product_name: batch.product_name,
                product_code: batch.product_code,
                strength: batch.strength,
                form: batch.form,
                packaging: batch.packaging,
                expiry_date: batch.expiry_date,
                manufacturing_date: batch.manufacturing_date,
                total_units: batch.total_units,
                created_at: batch.created_at,
                status: batch.status,
                code_count: parseInt(batch.code_count),
                verified_count: parseInt(batch.verified_count)
            })),
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: result.rows.length
            }
        });
    })
);

// Get specific batch
router.get('/:batchId',
    asyncHandler(async (req, res) => {
        const { batchId } = req.params;
        const manufacturerId = req.apiKeyData.manufacturer_id;

        const result = await query(`
            SELECT 
                b.*,
                COUNT(ac.id) as code_count,
                COUNT(CASE WHEN ac.first_verified_at IS NOT NULL THEN 1 END) as verified_count,
                COUNT(CASE WHEN ac.status = 'revoked' THEN 1 END) as revoked_count
            FROM batches b
            LEFT JOIN authentication_codes ac ON b.id = ac.batch_id
            WHERE b.batch_id = $1 AND b.manufacturer_id = $2
            GROUP BY b.id
        `, [batchId, manufacturerId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Batch not found'
            });
        }

        const batch = result.rows[0];

        res.json({
            success: true,
            data: {
                id: batch.id,
                batch_id: batch.batch_id,
                product_name: batch.product_name,
                product_code: batch.product_code,
                strength: batch.strength,
                form: batch.form,
                packaging: batch.packaging,
                expiry_date: batch.expiry_date,
                manufacturing_date: batch.manufacturing_date,
                total_units: batch.total_units,
                created_at: batch.created_at,
                status: batch.status,
                statistics: {
                    code_count: parseInt(batch.code_count),
                    verified_count: parseInt(batch.verified_count),
                    revoked_count: parseInt(batch.revoked_count),
                    verification_rate: batch.code_count > 0 ? 
                        (parseInt(batch.verified_count) / parseInt(batch.code_count)) * 100 : 0
                }
            }
        });
    })
);

// Update batch
router.put('/:batchId',
    asyncHandler(async (req, res) => {
        const { batchId } = req.params;
        const manufacturerId = req.apiKeyData.manufacturer_id;
        
        const {
            product_name,
            product_code,
            strength,
            form,
            packaging,
            expiry_date,
            manufacturing_date,
            total_units
        } = req.body;

        // Check if batch exists
        const existingBatch = await query(`
            SELECT id FROM batches 
            WHERE batch_id = $1 AND manufacturer_id = $2
        `, [batchId, manufacturerId]);

        if (existingBatch.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Batch not found'
            });
        }

        // Update batch
        const updateQuery = `
            UPDATE batches 
            SET 
                product_name = COALESCE($1, product_name),
                product_code = COALESCE($2, product_code),
                strength = COALESCE($3, strength),
                form = COALESCE($4, form),
                packaging = COALESCE($5, packaging),
                expiry_date = COALESCE($6, expiry_date),
                manufacturing_date = COALESCE($7, manufacturing_date),
                total_units = COALESCE($8, total_units),
                updated_at = NOW()
            WHERE batch_id = $9 AND manufacturer_id = $10
            RETURNING *
        `;

        const result = await query(updateQuery, [
            product_name,
            product_code,
            strength,
            form,
            packaging,
            expiry_date,
            manufacturing_date,
            total_units,
            batchId,
            manufacturerId
        ]);

        logger.info(`Batch updated: ${batchId}`);

        res.json({
            success: true,
            data: result.rows[0]
        });
    })
);

// Revoke batch
router.post('/:batchId/revoke',
    asyncHandler(async (req, res) => {
        const { batchId } = req.params;
        const manufacturerId = req.apiKeyData.manufacturer_id;
        const { reason } = req.body;

        // Check if batch exists and belongs to manufacturer
        const batchResult = await query(`
            SELECT id FROM batches 
            WHERE batch_id = $1 AND manufacturer_id = $2 AND status = 'active'
        `, [batchId, manufacturerId]);

        if (batchResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Active batch not found'
            });
        }

        // Update batch status
        await query(`
            UPDATE batches 
            SET status = 'revoked', updated_at = NOW()
            WHERE batch_id = $1 AND manufacturer_id = $2
        `, [batchId, manufacturerId]);

        // Update all authentication codes in the batch
        const codesResult = await query(`
            UPDATE authentication_codes 
            SET status = 'revoked', revoked_at = NOW()
            WHERE batch_id IN (
                SELECT id FROM batches WHERE batch_id = $1
            )
        `, [batchId]);

        logger.info(`Batch revoked: ${batchId}, ${codesResult.rowCount} codes affected`);

        res.json({
            success: true,
            data: {
                batch_id: batchId,
                status: 'revoked',
                affected_codes: codesResult.rowCount,
                reason: reason || 'Batch revoked by manufacturer'
            }
        });
    })
);

// Get batch statistics
router.get('/:batchId/stats',
    asyncHandler(async (req, res) => {
        const { batchId } = req.params;
        const manufacturerId = req.apiKeyData.manufacturer_id;

        const result = await query(`
            SELECT 
                b.batch_id,
                b.product_name,
                COUNT(ac.id) as total_codes,
                COUNT(CASE WHEN ac.first_verified_at IS NOT NULL THEN 1 END) as verified_codes,
                COUNT(CASE WHEN ac.status = 'revoked' THEN 1 END) as revoked_codes,
                COUNT(CASE WHEN ac.status = 'active' THEN 1 END) as active_codes,
                COUNT(vl.id) as total_verifications,
                AVG(vl.confidence_score) as avg_confidence,
                MAX(vl.verification_timestamp) as last_verification
            FROM batches b
            LEFT JOIN authentication_codes ac ON b.id = ac.batch_id
            LEFT JOIN verification_logs vl ON ac.id = vl.authentication_code_id
            WHERE b.batch_id = $1 AND b.manufacturer_id = $2
            GROUP BY b.id, b.batch_id, b.product_name
        `, [batchId, manufacturerId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Batch not found'
            });
        }

        const stats = result.rows[0];

        res.json({
            success: true,
            data: {
                batch_id: stats.batch_id,
                product_name: stats.product_name,
                codes: {
                    total: parseInt(stats.total_codes),
                    active: parseInt(stats.active_codes),
                    verified: parseInt(stats.verified_codes),
                    revoked: parseInt(stats.revoked_codes)
                },
                verifications: {
                    total: parseInt(stats.total_verifications),
                    average_confidence: parseFloat(stats.avg_confidence) || 0,
                    last_verification: stats.last_verification
                },
                verification_rate: stats.total_codes > 0 ? 
                    (parseInt(stats.verified_codes) / parseInt(stats.total_codes)) * 100 : 0
            }
        });
    })
);

module.exports = router;