-- MEDGENESIS Database Initialization Script
-- This script creates all necessary tables for the pharmaceutical authentication system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create manufacturers table
CREATE TABLE IF NOT EXISTS manufacturers (
    id SERIAL PRIMARY KEY,
    manufacturer_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    key_hash VARCHAR(64) UNIQUE NOT NULL,
    manufacturer_id INTEGER NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_minute INTEGER DEFAULT 100,
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE CASCADE
);

-- Create batches table
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
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE CASCADE
);

-- Create authentication codes table
CREATE TABLE IF NOT EXISTS authentication_codes (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL,
    serial_number VARCHAR(50) NOT NULL,
    authentication_code VARCHAR(32) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    first_verified_at TIMESTAMP,
    revoked_at TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- Create verification logs table
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
    FOREIGN KEY (authentication_code_id) REFERENCES authentication_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_auth_codes ON authentication_codes(authentication_code);
CREATE INDEX idx_verification_logs_timestamp ON verification_logs(verification_timestamp);
CREATE INDEX idx_verification_logs_code ON verification_logs(authentication_code_id);
CREATE INDEX idx_verification_logs_api_key ON verification_logs(api_key_id);
CREATE INDEX idx_batches_manufacturer ON batches(manufacturer_id);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- Insert sample data for demonstration
INSERT INTO manufacturers (manufacturer_id, name, contact_email, contact_phone, address) VALUES
('PHARMA001', 'MediCare Pharmaceuticals Ltd.', 'contact@medicare.com', '+91-11-12345678', 'New Delhi, India'),
('PHARMA002', 'HealthWell Labs Pvt. Ltd.', 'info@healthwell.com', '+91-22-87654321', 'Mumbai, India'),
('PHARMA003', 'CureFast Pharma', 'support@curefast.com', '+91-80-11223344', 'Bangalore, India');

-- Insert sample API keys (hash: demo-api-key)
INSERT INTO api_keys (key_hash, manufacturer_id, name, rate_limit_per_minute) VALUES
('a591a6d40bf420404a0107330b8e0a7b8e2b3b9b8e2b3b9b8e2b3b9b8e2b3b9', 1, 'Production API Key', 1000),
('b591a6d40bf420404a0107330b8e0a7b8e2b3b9b8e2b3b9b8e2b3b9b8e2b3b9', 2, 'Development API Key', 500),
('c591a6d40bf420404a0107330b8e0a7b8e2b3b9b8e2b3b9b8e2b3b9b8e2b3b9', 3, 'Testing API Key', 100);

-- Insert sample batches
INSERT INTO batches (manufacturer_id, batch_id, product_name, product_code, strength, form, packaging, expiry_date, manufacturing_date, total_units) VALUES
(1, 'BATCH2025001', 'Paracetamol 500mg', 'PCM500', '500mg', 'Tablet', 'Strip of 10', '2026-12-31', '2025-01-01', 10000),
(1, 'BATCH2025002', 'Ibuprofen 400mg', 'IBU400', '400mg', 'Tablet', 'Strip of 10', '2026-11-30', '2025-01-15', 5000),
(2, 'BATCH2025003', 'Aspirin 75mg', 'ASP75', '75mg', 'Tablet', 'Strip of 14', '2026-10-31', '2025-02-01', 8000),
(3, 'BATCH2025004', 'Amoxicillin 500mg', 'AMX500', '500mg', 'Capsule', 'Strip of 10', '2026-09-30', '2025-02-15', 6000),
(1, 'BATCH2025005', 'Metformin 500mg', 'MET500', '500mg', 'Tablet', 'Strip of 10', '2026-08-31', '2025-03-01', 12000);

-- Insert sample authentication codes (first 5 codes for each batch)
-- Batch 1: Paracetamol
INSERT INTO authentication_codes (batch_id, serial_number, authentication_code) VALUES
(1, 'BATCH2025001-000001', 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'),
(1, 'BATCH2025001-000002', 'B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7'),
(1, 'BATCH2025001-000003', 'C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8'),
(1, 'BATCH2025001-000004', 'D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9'),
(1, 'BATCH2025001-000005', 'E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0');

-- Batch 2: Ibuprofen
INSERT INTO authentication_codes (batch_id, serial_number, authentication_code) VALUES
(2, 'BATCH2025002-000001', 'F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1'),
(2, 'BATCH2025002-000002', 'G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2'),
(2, 'BATCH2025002-000003', 'H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3'),
(2, 'BATCH2025002-000004', 'I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4'),
(2, 'BATCH2025002-000005', 'J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5');

-- Batch 3: Aspirin
INSERT INTO authentication_codes (batch_id, serial_number, authentication_code) VALUES
(3, 'BATCH2025003-000001', 'K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6'),
(3, 'BATCH2025003-000002', 'L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7'),
(3, 'BATCH2025003-000003', 'M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8'),
(3, 'BATCH2025003-000004', 'N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9'),
(3, 'BATCH2025003-000005', 'O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0');

-- Insert sample verification logs
-- Some successful verifications
INSERT INTO verification_logs (authentication_code_id, api_key_id, location_lat, location_lng, result, confidence_score) VALUES
(1, 1, 28.6139, 77.2090, 'authentic', 0.95),
(2, 1, 19.0760, 72.8777, 'authentic', 0.98),
(3, 1, 12.9716, 77.5946, 'authentic', 0.97),
(6, 2, 28.6139, 77.2090, 'authentic', 0.96),
(11, 3, 19.0760, 72.8777, 'authentic', 0.94);

-- Some suspicious verifications
INSERT INTO verification_logs (authentication_code_id, api_key_id, location_lat, location_lng, result, confidence_score, is_duplicate) VALUES
(4, 1, 28.6139, 77.2090, 'suspicious', 0.45, true),
(7, 2, 19.0760, 72.8777, 'suspicious', 0.32, false),
(12, 3, 12.9716, 77.5946, 'suspicious', 0.28, true);

-- Some invalid verifications
INSERT INTO verification_logs (authentication_code_id, api_key_id, location_lat, location_lng, result, confidence_score) VALUES
(5, 1, 28.6139, 77.2090, 'invalid', 0.0),
(8, 2, 19.0760, 72.8777, 'invalid', 0.0),
(13, 3, 12.9716, 77.5946, 'invalid', 0.0);

-- Create a view for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    m.manufacturer_id,
    m.name as manufacturer_name,
    COUNT(DISTINCT b.id) as total_batches,
    COUNT(DISTINCT ac.id) as total_codes,
    COUNT(DISTINCT vl.id) as total_verifications,
    COUNT(DISTINCT CASE WHEN vl.result = 'authentic' THEN vl.id END) as authentic_count,
    COUNT(DISTINCT CASE WHEN vl.result = 'suspicious' THEN vl.id END) as suspicious_count,
    COUNT(DISTINCT CASE WHEN vl.result = 'invalid' THEN vl.id END) as invalid_count,
    COUNT(DISTINCT CASE WHEN vl.is_duplicate = true THEN vl.id END) as duplicate_count,
    COUNT(DISTINCT CASE WHEN vl.is_offline = true THEN vl.id END) as offline_count,
    AVG(vl.confidence_score) as avg_confidence,
    MAX(vl.verification_timestamp) as last_verification
FROM manufacturers m
LEFT JOIN batches b ON m.id = b.manufacturer_id
LEFT JOIN authentication_codes ac ON b.id = ac.batch_id
LEFT JOIN verification_logs vl ON ac.id = vl.authentication_code_id
GROUP BY m.id, m.name;

-- Create a function to generate authentication codes
CREATE OR REPLACE FUNCTION generate_auth_code(manufacturer_id TEXT, batch_id TEXT, serial_number TEXT)
RETURNS TEXT AS $$
DECLARE
    secret TEXT := 'default-secret-key';
    input TEXT;
    hash TEXT;
BEGIN
    input := manufacturer_id || ':' || batch_id || ':' || serial_number || ':' || secret;
    hash := encode(digest(input, 'sha256'), 'hex');
    RETURN substring(hash, 1, 32);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust based on your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_database_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_database_user;

-- Create indexes for better query performance
CREATE INDEX idx_verification_logs_recent ON verification_logs(verification_timestamp DESC);
CREATE INDEX idx_batches_recent ON batches(created_at DESC);
CREATE INDEX idx_authentication_codes_recent ON authentication_codes(created_at DESC);

-- Create materialized view for performance (optional, for large datasets)
CREATE MATERIALIZED VIEW batch_statistics AS
SELECT 
    b.id,
    b.batch_id,
    b.product_name,
    b.total_units,
    COUNT(ac.id) as code_count,
    COUNT(CASE WHEN ac.first_verified_at IS NOT NULL THEN 1 END) as verified_count,
    COUNT(CASE WHEN ac.status = 'revoked' THEN 1 END) as revoked_count,
    COUNT(CASE WHEN ac.status = 'active' THEN 1 END) as active_count,
    COUNT(vl.id) as total_verifications,
    AVG(vl.confidence_score) as avg_confidence
FROM batches b
LEFT JOIN authentication_codes ac ON b.id = ac.batch_id
LEFT JOIN verification_logs vl ON ac.id = vl.authentication_code_id
GROUP BY b.id, b.batch_id, b.product_name, b.total_units;

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_batch_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW batch_statistics;
END;
$$ LANGUAGE plpgsql;