const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'medgenesis',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
    connectionTimeoutMillis: 2000, // how long to wait for connection
};

async function connectDatabase() {
    try {
        pool = new Pool(config);
        
        // Test connection
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        
        logger.info('Database connected successfully');
        
        // Setup connection error handling
        pool.on('error', (err) => {
            logger.error('Database pool error:', err);
        });
        
    } catch (error) {
        logger.error('Database connection failed:', error);
        throw error;
    }
}

async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.debug('Database query executed', { duration, rows: result.rowCount });
        return result;
    } catch (error) {
        logger.error('Database query error:', { error, query: text, params });
        throw error;
    }
}

async function getClient() {
    return pool.connect();
}

async function closeDatabase() {
    if (pool) {
        await pool.end();
        logger.info('Database connection closed');
    }
}

// Database initialization
async function initializeDatabase() {
    try {
        const client = await pool.connect();
        
        // Create tables if they don't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS manufacturers (
                id SERIAL PRIMARY KEY,
                manufacturer_id VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                contact_email VARCHAR(100),
                contact_phone VARCHAR(20),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS api_keys (
                id SERIAL PRIMARY KEY,
                key_hash VARCHAR(64) UNIQUE NOT NULL,
                manufacturer_id INTEGER NOT NULL,
                name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                rate_limit_per_minute INTEGER DEFAULT 100,
                FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id)
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS batches (
                id SERIAL PRIMARY KEY,
                manufacturer_id INTEGER NOT NULL,
                batch_id VARCHAR(50) NOT NULL,
                product_name VARCHAR(200) NOT NULL,
                product_code VARCHAR(50),
                strength VARCHAR(50),
                form VARCHAR(50),
                packaging VARCHAR(100),
                expiry_date DATE,
                manufacturing_date DATE,
                total_units INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'active',
                UNIQUE(manufacturer_id, batch_id),
                FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id)
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS authentication_codes (
                id SERIAL PRIMARY KEY,
                batch_id INTEGER NOT NULL,
                serial_number VARCHAR(50) NOT NULL,
                authentication_code VARCHAR(32) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'active',
                first_verified_at TIMESTAMP,
                revoked_at TIMESTAMP,
                FOREIGN KEY (batch_id) REFERENCES batches(id)
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS verification_logs (
                id SERIAL PRIMARY KEY,
                authentication_code_id INTEGER NOT NULL,
                api_key_id INTEGER NOT NULL,
                verification_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                location_lat DECIMAL(10, 8),
                location_lng DECIMAL(11, 8),
                result VARCHAR(50) NOT NULL,
                confidence_score DECIMAL(5, 4),
                is_duplicate BOOLEAN DEFAULT false,
                is_offline BOOLEAN DEFAULT false,
                FOREIGN KEY (authentication_code_id) REFERENCES authentication_codes(id),
                FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
            )
        `);
        
        // Create indexes for better performance
        await client.query(`
            CREATE INDEX idx_auth_codes ON authentication_codes(authentication_code);
            CREATE INDEX idx_verification_logs_timestamp ON verification_logs(verification_timestamp);
            CREATE INDEX idx_verification_logs_code ON verification_logs(authentication_code_id);
            CREATE INDEX idx_batches_manufacturer ON batches(manufacturer_id);
            CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
        `);
        
        client.release();
        logger.info('Database tables initialized successfully');
        
    } catch (error) {
        logger.error('Database initialization failed:', error);
        throw error;
    }
}

module.exports = {
    connectDatabase,
    query,
    getClient,
    closeDatabase,
    initializeDatabase
};