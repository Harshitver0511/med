const express = require('express');
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard',
    asyncHandler(async (req, res) => {
        const manufacturerId = req.apiKeyData.manufacturer_id;
        const { days = 30 } = req.query;

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Summary statistics
        const summaryQuery = `
            SELECT 
                COUNT(DISTINCT vl.id) as total_verifications,
                COUNT(DISTINCT CASE WHEN vl.result = 'authentic' THEN vl.id END) as authentic_count,
                COUNT(DISTINCT CASE WHEN vl.result = 'suspicious' THEN vl.id END) as suspicious_count,
                COUNT(DISTINCT CASE WHEN vl.result = 'invalid' THEN vl.id END) as invalid_count,
                COUNT(DISTINCT CASE WHEN vl.result = 'expired' THEN vl.id END) as expired_count,
                COUNT(DISTINCT CASE WHEN vl.is_duplicate = true THEN vl.id END) as duplicate_count,
                COUNT(DISTINCT CASE WHEN vl.is_offline = true THEN vl.id END) as offline_count,
                AVG(vl.confidence_score) as avg_confidence,
                COUNT(DISTINCT vl.authentication_code_id) as unique_products_verified,
                COUNT(DISTINCT b.id) as batches_with_verifications
            FROM verification_logs vl
            JOIN authentication_codes ac ON vl.authentication_code_id = ac.id
            JOIN batches b ON ac.batch_id = b.id
            WHERE b.manufacturer_id = $1 
            AND vl.verification_timestamp >= $2 
            AND vl.verification_timestamp <= $3
        `;

        const summaryResult = await query(summaryQuery, [manufacturerId, startDate, endDate]);
        const summary = summaryResult.rows[0];

        // Daily breakdown
        const dailyQuery = `
            SELECT 
                DATE(vl.verification_timestamp) as verification_date,
                COUNT(*) as total_verifications,
                COUNT(CASE WHEN vl.result = 'authentic' THEN 1 END) as authentic_count,
                COUNT(CASE WHEN vl.result = 'suspicious' THEN 1 END) as suspicious_count,
                COUNT(CASE WHEN vl.result = 'invalid' THEN 1 END) as invalid_count,
                COUNT(CASE WHEN vl.result = 'expired' THEN 1 END) as expired_count,
                AVG(vl.confidence_score) as avg_confidence
            FROM verification_logs vl
            JOIN authentication_codes ac ON vl.authentication_code_id = ac.id
            JOIN batches b ON ac.batch_id = b.id
            WHERE b.manufacturer_id = $1 
            AND vl.verification_timestamp >= $2 
            AND vl.verification_timestamp <= $3
            GROUP BY DATE(vl.verification_timestamp)
            ORDER BY verification_date DESC
        `;

        const dailyResult = await query(dailyQuery, [manufacturerId, startDate, endDate]);

        // Top products by verification count
        const productsQuery = `
            SELECT 
                b.product_name,
                b.batch_id,
                COUNT(vl.id) as verification_count,
                AVG(vl.confidence_score) as avg_confidence,
                COUNT(DISTINCT vl.authentication_code_id) as unique_codes_verified
            FROM verification_logs vl
            JOIN authentication_codes ac ON vl.authentication_code_id = ac.id
            JOIN batches b ON ac.batch_id = b.id
            WHERE b.manufacturer_id = $1 
            AND vl.verification_timestamp >= $2 
            AND vl.verification_timestamp <= $3
            GROUP BY b.id, b.product_name, b.batch_id
            ORDER BY verification_count DESC
            LIMIT 10
        `;

        const productsResult = await query(productsQuery, [manufacturerId, startDate, endDate]);

        // Geographic distribution
        const geoQuery = `
            SELECT 
                vl.location_lat,
                vl.location_lng,
                COUNT(*) as verification_count,
                vl.result
            FROM verification_logs vl
            JOIN authentication_codes ac ON vl.authentication_code_id = ac.id
            JOIN batches b ON ac.batch_id = b.id
            WHERE b.manufacturer_id = $1 
            AND vl.verification_timestamp >= $2 
            AND vl.verification_timestamp <= $3
            AND vl.location_lat IS NOT NULL 
            AND vl.location_lng IS NOT NULL
            GROUP BY vl.location_lat, vl.location_lng, vl.result
            ORDER BY verification_count DESC
            LIMIT 100
        `;

        const geoResult = await query(geoQuery, [manufacturerId, startDate, endDate]);

        res.json({
            success: true,
            data: {
                summary: {
                    total_verifications: parseInt(summary.total_verifications) || 0,
                    authentic_count: parseInt(summary.authentic_count) || 0,
                    suspicious_count: parseInt(summary.suspicious_count) || 0,
                    invalid_count: parseInt(summary.invalid_count) || 0,
                    expired_count: parseInt(summary.expired_count) || 0,
                    duplicate_count: parseInt(summary.duplicate_count) || 0,
                    offline_count: parseInt(summary.offline_count) || 0,
                    avg_confidence: parseFloat(summary.avg_confidence) || 0,
                    unique_products_verified: parseInt(summary.unique_products_verified) || 0,
                    batches_with_verifications: parseInt(summary.batches_with_verifications) || 0
                },
                daily_breakdown: dailyResult.rows.map(row => ({
                    date: row.verification_date,
                    total: parseInt(row.total_verifications),
                    authentic: parseInt(row.authentic_count || 0),
                    suspicious: parseInt(row.suspicious_count || 0),
                    invalid: parseInt(row.invalid_count || 0),
                    expired: parseInt(row.expired_count || 0),
                    avg_confidence: parseFloat(row.avg_confidence) || 0
                })),
                top_products: productsResult.rows.map(row => ({
                    product_name: row.product_name,
                    batch_id: row.batch_id,
                    verification_count: parseInt(row.verification_count),
                    avg_confidence: parseFloat(row.avg_confidence) || 0,
                    unique_codes_verified: parseInt(row.unique_codes_verified)
                })),
                geographic_distribution: geoResult.rows.map(row => ({
                    latitude: parseFloat(row.location_lat),
                    longitude: parseFloat(row.location_lng),
                    count: parseInt(row.verification_count),
                    result: row.result
                }))
            }
        });
    })
);

// Get real-time alerts
router.get('/alerts',
    asyncHandler(async (req, res) => {
        const manufacturerId = req.apiKeyData.manufacturer_id;
        const { hours = 24 } = req.query;

        const alertDate = new Date();
        alertDate.setHours(alertDate.getHours() - parseInt(hours));

        // Suspicious activity alerts
        const suspiciousQuery = `
            SELECT 
                vl.id,
                ac.authentication_code,
                b.product_name,
                b.batch_id,
                vl.result,
                vl.confidence_score,
                vl.verification_timestamp,
                vl.location_lat,
                vl.location_lng,
                vl.is_duplicate,
                COUNT(*) OVER (PARTITION BY ac.authentication_code) as verification_count
            FROM verification_logs vl
            JOIN authentication_codes ac ON vl.authentication_code_id = ac.id
            JOIN batches b ON ac.batch_id = b.id
            WHERE b.manufacturer_id = $1 
            AND vl.verification_timestamp >= $2
            AND (
                vl.result IN ('suspicious', 'invalid') 
                OR vl.confidence_score < 0.5
                OR vl.is_duplicate = true
                OR vl.is_offline = true
            )
            ORDER BY vl.verification_timestamp DESC
            LIMIT 50
        `;

        const suspiciousResult = await query(suspiciousQuery, [manufacturerId, alertDate]);

        // High verification rate alerts
        const rateQuery = `
            SELECT 
                DATE_TRUNC('hour', vl.verification_timestamp) as hour,
                COUNT(*) as verification_count,
                COUNT(DISTINCT ac.authentication_code) as unique_codes,
                AVG(vl.confidence_score) as avg_confidence
            FROM verification_logs vl
            JOIN authentication_codes ac ON vl.authentication_code_id = ac.id
            JOIN batches b ON ac.batch_id = b.id
            WHERE b.manufacturer_id = $1 
            AND vl.verification_timestamp >= $2
            GROUP BY DATE_TRUNC('hour', vl.verification_timestamp)
            HAVING COUNT(*) > 100
            ORDER BY hour DESC
            LIMIT 24
        `;

        const rateResult = await query(rateQuery, [manufacturerId, alertDate]);

        // Geographic anomaly alerts
        const geoAnomalyQuery = `
            SELECT 
                vl.authentication_code_id,
                ac.authentication_code,
                b.product_name,
                vl.location_lat,
                vl.location_lng,
                vl.verification_timestamp,
                LAG(vl.location_lat) OVER (PARTITION BY ac.authentication_code ORDER BY vl.verification_timestamp) as prev_lat,
                LAG(vl.location_lng) OVER (PARTITION BY ac.authentication_code ORDER BY vl.verification_timestamp) as prev_lng,
                LAG(vl.verification_timestamp) OVER (PARTITION BY ac.authentication_code ORDER BY vl.verification_timestamp) as prev_timestamp
            FROM verification_logs vl
            JOIN authentication_codes ac ON vl.authentication_code_id = ac.id
            JOIN batches b ON ac.batch_id = b.id
            WHERE b.manufacturer_id = $1 
            AND vl.verification_timestamp >= $2
            AND vl.location_lat IS NOT NULL 
            AND vl.location_lng IS NOT NULL
            ORDER BY vl.verification_timestamp DESC
        `;

        const geoAnomalyResult = await query(geoAnomalyQuery, [manufacturerId, alertDate]);

        // Process geographic anomalies
        const geoAnomalies = [];
        for (const row of geoAnomalyResult.rows) {
            if (row.prev_lat && row.prev_lng && row.prev_timestamp) {
                const timeDiff = new Date(row.verification_timestamp) - new Date(row.prev_timestamp);
                const distance = calculateDistance(
                    row.prev_lat, row.prev_lng,
                    row.location_lat, row.location_lng
                );

                // If distance > 100km in less than 1 hour
                if (distance > 100 && timeDiff < 3600000) {
                    geoAnomalies.push({
                        authentication_code: row.authentication_code,
                        product_name: row.product_name,
                        distance_km: distance,
                        time_diff_hours: timeDiff / 3600000,
                        locations: [
                            { lat: row.prev_lat, lng: row.prev_lng },
                            { lat: row.location_lat, lng: row.location_lng }
                        ]
                    });
                }
            }
        }

        res.json({
            success: true,
            data: {
                suspicious_activities: suspiciousResult.rows.map(row => ({
                    id: row.id,
                    authentication_code: row.authentication_code,
                    product_name: row.product_name,
                    batch_id: row.batch_id,
                    result: row.result,
                    confidence_score: parseFloat(row.confidence_score),
                    timestamp: row.verification_timestamp,
                    location: {
                        lat: parseFloat(row.location_lat),
                        lng: parseFloat(row.location_lng)
                    },
                    is_duplicate: row.is_duplicate,
                    verification_count: parseInt(row.verification_count)
                })),
                high_verification_rates: rateResult.rows.map(row => ({
                    hour: row.hour,
                    verification_count: parseInt(row.verification_count),
                    unique_codes: parseInt(row.unique_codes),
                    avg_confidence: parseFloat(row.avg_confidence)
                })),
                geographic_anomalies: geoAnomalies
            }
        });
    })
);

// Get system health metrics
router.get('/health',
    asyncHandler(async (req, res) => {
        const manufacturerId = req.apiKeyData.manufacturer_id;

        // Database health
        const dbHealth = await query('SELECT NOW() as current_time');
        const dbConnected = dbHealth.rows.length > 0;

        // Recent activity
        const recentActivity = await query(`
            SELECT 
                COUNT(*) as total_last_hour,
                COUNT(CASE WHEN vl.result = 'authentic' THEN 1 END) as authentic_last_hour,
                AVG(vl.confidence_score) as avg_confidence_last_hour
            FROM verification_logs vl
            JOIN authentication_codes ac ON vl.authentication_code_id = ac.id
            JOIN batches b ON ac.batch_id = b.id
            WHERE b.manufacturer_id = $1 
            AND vl.verification_timestamp > NOW() - INTERVAL '1 hour'
        `, [manufacturerId]);

        // System load
        const systemLoad = {
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            cpu_count: require('os').cpus().length,
            load_average: require('os').loadavg()
        };

        res.json({
            success: true,
            data: {
                database: {
                    connected: dbConnected,
                    response_time: new Date() - new Date(dbHealth.rows[0].current_time)
                },
                recent_activity: {
                    total_verifications: parseInt(recentActivity.rows[0].total_last_hour) || 0,
                    authentic_verifications: parseInt(recentActivity.rows[0].authentic_last_hour) || 0,
                    avg_confidence: parseFloat(recentActivity.rows[0].avg_confidence_last_hour) || 0
                },
                system_load: systemLoad
            }
        });
    })
);

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

module.exports = router;