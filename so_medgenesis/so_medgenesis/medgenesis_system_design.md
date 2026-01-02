# MEDGENESIS - System Design Document

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [High-Level Architecture](#high-level-architecture)
3. [Low-Level Design](#low-level-design)
4. [Component Specifications](#component-specifications)
5. [Data Models](#data-models)
6. [API Specifications](#api-specifications)
7. [Security Architecture](#security-architecture)
8. [Deployment Strategy](#deployment-strategy)

## Executive Summary

MEDGENESIS is a pharmaceutical authentication system designed to combat counterfeit medicines in India through a hybrid online-offline verification platform. The system provides package-level authentication using cryptographic identifiers and visual pattern recognition, targeting pharmacists and healthcare distributors in low-resource settings.

### Key Features
- Unique cryptographic authentication codes for each medicine package
- Android mobile application with dual-mode verification
- Cloud-based backend with offline synchronization
- Web-based administrative dashboard for monitoring
- Batch revocation and duplicate detection capabilities

### Success Metrics
- Verification accuracy: >99%
- Offline operation success rate: >95%
- User adoption rate: >80%
- Response time: <3 seconds for online verification

## High-Level Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     MEDGENESIS SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  MANUFACTURER│    │  MOBILE      │    │    BACKEND   │       │
│  │    SYSTEM    │    │     APP      │    │   SERVICE    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                      │                    │           │
│         │                      │                    │           │
│         ▼                      ▼                    ▼           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ CODE         │    │ VERIFICATION │    │ DATABASE     │       │
│  │ GENERATION   │    │ INTERFACE    │    │ & ANALYTICS  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                      │                    │           │
│         └──────────────────────┼────────────────────┘           │
│                                ▼                                │
│                    ┌──────────────┐                             │
│                    │ ADMIN        │                             │
│                    │ DASHBOARD    │                             │
│                    └──────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interactions

1. **Manufacturer System** generates unique authentication codes and visual patterns
2. **Mobile Application** scans packages and performs verification
3. **Backend Service** validates identifiers and maintains system state
4. **Administrative Dashboard** provides monitoring and management capabilities

## Low-Level Design

### 1. Manufacturer Code Generation System

#### Code Generation Algorithm
```python
def generate_authentication_code(
    manufacturer_id: str,
    batch_id: str, 
    serial_number: str,
    secret_key: str
) -> str:
    """
    Generate unique authentication code using SHA-256 hashing
    """
    import hashlib
    
    # Combine input parameters
    input_string = f"{manufacturer_id}:{batch_id}:{serial_number}:{secret_key}"
    
    # Generate SHA-256 hash
    hash_object = hashlib.sha256(input_string.encode())
    authentication_code = hash_object.hexdigest()
    
    # Truncate to 32 characters for QR code compatibility
    return authentication_code[:32]
```

#### Visual Pattern Encoding
- **Format**: High-density QR Code (Version 40)
- **Error Correction**: Level H (30%)
- **Encoding**: Alphanumeric
- **Size**: 177x177 modules minimum
- **Printing**: Standard pharmaceutical packaging processes

#### Database Storage
```sql
CREATE TABLE authentication_codes (
    id SERIAL PRIMARY KEY,
    manufacturer_id VARCHAR(50) NOT NULL,
    batch_id VARCHAR(50) NOT NULL,
    serial_number VARCHAR(50) NOT NULL,
    authentication_code VARCHAR(32) UNIQUE NOT NULL,
    created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    INDEX idx_auth_code (authentication_code),
    INDEX idx_batch (manufacturer_id, batch_id)
);
```

### 2. Mobile Verification Application

#### Architecture
- **Platform**: Android (API Level 21+)
- **Language**: Kotlin/Java
- **Local Database**: SQLite for offline storage
- **Camera**: ZXing library for QR code scanning

#### Verification Logic
```kotlin
class VerificationManager {
    suspend fun verifyPackage(
        authCode: String,
        location: Location?
    ): VerificationResult {
        return if (isOnline()) {
            verifyOnline(authCode, location)
        } else {
            verifyOffline(authCode, location)
        }
    }
    
    private suspend fun verifyOnline(
        authCode: String,
        location: Location?
    ): VerificationResult {
        val response = apiService.verifyCode(authCode, location)
        
        // Cache result locally
        localDatabase.insertVerification(response)
        
        return when (response.status) {
            "valid" -> VerificationResult.Authentic(response.confidence)
            "duplicate" -> VerificationResult.Suspicious("Duplicate scan detected")
            "revoked" -> VerificationResult.Suspicious("Batch revoked")
            else -> VerificationResult.Invalid("Unknown authentication code")
        }
    }
    
    private suspend fun verifyOffline(
        authCode: String,
        location: Location?
    ): VerificationResult {
        val cached = localDatabase.getCachedCode(authCode)
        
        return if (cached != null) {
            // Queue for later synchronization
            syncQueue.add(VerificationEvent(authCode, location))
            VerificationResult.Unverified("Limited confidence - offline mode")
        } else {
            VerificationResult.Invalid("Code not found in local cache")
        }
    }
}
```

#### Offline Data Management
```sql
-- Local SQLite schema
CREATE TABLE cached_codes (
    authentication_code VARCHAR(32) PRIMARY KEY,
    manufacturer_id VARCHAR(50),
    batch_id VARCHAR(50),
    last_updated TIMESTAMP
);

CREATE TABLE verification_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    authentication_code VARCHAR(32),
    timestamp TIMESTAMP,
    location_lat REAL,
    location_lng REAL,
    synced BOOLEAN DEFAULT 0
);
```

### 3. Backend Verification Service

#### API Architecture
- **Framework**: Node.js/Express or Python/FastAPI
- **Authentication**: API Key-based
- **Rate Limiting**: Per API key and IP address
- **Database**: PostgreSQL with Redis caching

#### Core API Endpoints

```python
@app.route('/api/verify', methods=['POST'])
def verify_authentication_code():
    """
    Verify authentication code and return result
    """
    data = request.json
    auth_code = data.get('authentication_code')
    location = data.get('location')
    api_key = request.headers.get('X-API-Key')
    
    # Validate API key
    if not validate_api_key(api_key):
        return jsonify({'error': 'Invalid API key'}), 401
    
    # Check rate limiting
    if not check_rate_limit(api_key, request.remote_addr):
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    # Verify code in database
    result = verify_code_in_database(auth_code)
    
    # Log verification attempt
    log_verification_attempt(auth_code, location, result)
    
    # Check for suspicious patterns
    if is_duplicate_scan(auth_code, location):
        result['status'] = 'suspicious'
        result['reason'] = 'Duplicate scan detected'
    
    return jsonify(result)

@app.route('/api/batch/revoke', methods=['POST'])
def revoke_batch():
    """
    Revoke all codes in a specific batch
    """
    data = request.json
    batch_id = data.get('batch_id')
    manufacturer_id = data.get('manufacturer_id')
    
    # Update batch status
    update_batch_status(batch_id, manufacturer_id, 'revoked')
    
    # Clear cache
    clear_batch_cache(batch_id)
    
    return jsonify({'status': 'success'})
```

#### Database Schema
```sql
-- Main authentication codes table
CREATE TABLE authentication_codes (
    id SERIAL PRIMARY KEY,
    manufacturer_id VARCHAR(50) NOT NULL,
    batch_id VARCHAR(50) NOT NULL,
    serial_number VARCHAR(50) NOT NULL,
    authentication_code VARCHAR(32) UNIQUE NOT NULL,
    created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    revoked_timestamp TIMESTAMP NULL
);

-- Verification logs
CREATE TABLE verification_logs (
    id SERIAL PRIMARY KEY,
    authentication_code VARCHAR(32) NOT NULL,
    verification_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_key_id INTEGER,
    location_lat REAL,
    location_lng REAL,
    result VARCHAR(50),
    confidence_score REAL,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
);

-- Batch information
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    manufacturer_id VARCHAR(50) NOT NULL,
    batch_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200),
    expiry_date DATE,
    created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    UNIQUE(manufacturer_id, batch_id)
);

-- API keys for authentication
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    key_hash VARCHAR(64) UNIQUE NOT NULL,
    organization_name VARCHAR(100),
    created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    rate_limit_per_minute INTEGER DEFAULT 100
);
```

### 4. Administrative Dashboard

#### Technology Stack
- **Frontend**: React.js with TypeScript
- **UI Framework**: Material-UI or Tailwind CSS
- **Charts**: Chart.js or D3.js
- **State Management**: Redux Toolkit

#### Key Features
1. **Real-time Monitoring**
   - Live verification statistics
   - Geographic heat maps
   - Suspicious activity alerts

2. **Batch Management**
   - Register new batches
   - Update batch status
   - Bulk operations

3. **Analytics Dashboard**
   - Verification trends
   - Regional analysis
   - Counterfeit detection metrics

4. **Security Management**
   - API key management
   - User access control
   - Audit logs

#### Sample Dashboard Components
```typescript
const VerificationStats: React.FC = () => {
    const { data: stats } = useQuery('verificationStats', fetchVerificationStats);
    
    return (
        <div className="grid grid-cols-4 gap-4">
            <StatCard 
                title="Total Verifications"
                value={stats?.totalVerifications}
                trend={stats?.verificationGrowth}
            />
            <StatCard 
                title="Authentic Products"
                value={stats?.authenticCount}
                percentage={stats?.authenticPercentage}
            />
            <StatCard 
                title="Suspicious Alerts"
                value={stats?.suspiciousCount}
                color="warning"
            />
            <StatCard 
                title="Offline Verifications"
                value={stats?.offlineCount}
                percentage={stats?.offlinePercentage}
            />
        </div>
    );
};
```

## Data Models

### Authentication Code Lifecycle
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│  GENERATED  │────>│   ACTIVE     │────>│  VERIFIED   │────>│  EXPIRED    │
│             │     │              │     │             │     │             │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  REVOKED     │     │ DUPLICATE   │
                    │              │     │   DETECTED  │
                    └──────────────┘     └─────────────┘
```

### Verification Result Types
- **AUTHENTIC**: Valid code, first verification
- **DUPLICATE**: Valid code, previously verified
- **REVOKED**: Code belongs to revoked batch
- **INVALID**: Code not found in database
- **UNVERIFIED**: Offline verification, limited confidence

## API Specifications

### Authentication
All API requests require an API key in the `X-API-Key` header.

### Endpoints

#### 1. Verify Authentication Code
```http
POST /api/verify
Content-Type: application/json
X-API-Key: your-api-key

{
    "authentication_code": "a1b2c3d4e5f6g7h8",
    "location": {
        "latitude": 19.0760,
        "longitude": 72.8777
    }
}

Response:
{
    "status": "authentic",
    "confidence": 1.0,
    "manufacturer_id": "PHARMA001",
    "batch_id": "BATCH2025001",
    "product_name": "Paracetamol 500mg",
    "timestamp": "2025-01-15T10:30:00Z"
}
```

#### 2. Batch Registration
```http
POST /api/batches
Content-Type: application/json
X-API-Key: your-api-key

{
    "batch_id": "BATCH2025001",
    "product_name": "Paracetamol 500mg",
    "expiry_date": "2026-12-31",
    "total_units": 10000
}

Response:
{
    "batch_id": "BATCH2025001",
    "status": "registered",
    "codes_generated": 10000
}
```

#### 3. Revoke Batch
```http
POST /api/batches/revoke
Content-Type: application/json
X-API-Key: your-api-key

{
    "batch_id": "BATCH2025001",
    "reason": "Quality control issue"
}

Response:
{
    "batch_id": "BATCH2025001",
    "status": "revoked",
    "affected_codes": 10000
}
```

#### 4. Get Verification Statistics
```http
GET /api/stats?start_date=2025-01-01&end_date=2025-01-31
X-API-Key: your-api-key

Response:
{
    "total_verifications": 15000,
    "authentic_count": 14800,
    "suspicious_count": 150,
    "invalid_count": 50,
    "regional_breakdown": [
        {
            "region": "Maharashtra",
            "verifications": 5000,
            "authentic_percentage": 98.5
        }
    ]
}
```

## Security Architecture

### 1. Authentication & Authorization
- **API Keys**: Unique keys for each organization
- **Rate Limiting**: Per-key and per-IP limits
- **Role-Based Access**: Different permissions for different user types

### 2. Data Protection
- **Encryption in Transit**: TLS 1.3 for all communications
- **Encryption at Rest**: AES-256 for database storage
- **Key Management**: Hardware Security Module (HSM) for key rotation

### 3. Audit & Monitoring
- **Verification Logs**: All verification attempts logged
- **Security Events**: Failed authentication, rate limiting, suspicious patterns
- **Real-time Alerts**: Immediate notification of security incidents

### 4. Privacy Protection
- **No PII**: No personally identifiable information stored
- **Location Anonymization**: Coordinates rounded to 100m precision
- **Data Retention**: Automatic deletion after defined period

## Deployment Strategy

### 1. Development Environment
- **Local Development**: Docker containers for all services
- **Testing**: Automated unit and integration tests
- **CI/CD**: GitHub Actions or GitLab CI

### 2. Staging Environment
- **Cloud Deployment**: AWS/Azure/GCP
- **Load Testing**: Simulated high-traffic scenarios
- **Security Testing**: Penetration testing and vulnerability scanning

### 3. Production Deployment
- **Infrastructure**: Kubernetes with auto-scaling
- **Database**: PostgreSQL with read replicas
- **Caching**: Redis cluster for high performance
- **Monitoring**: Prometheus, Grafana, and ELK stack

### 4. Rollout Plan
- **Phase 1**: Limited pilot with 10-20 pharmacies
- **Phase 2**: Expanded pilot to 50-100 pharmacies
- **Phase 3**: Full deployment across target regions
- **Phase 4**: National scaling based on success metrics

### Infrastructure Requirements

#### Minimum Production Setup
- **Web Servers**: 2x instances (4 CPU, 8GB RAM each)
- **Database**: 1x primary + 1x read replica (8 CPU, 16GB RAM)
- **Cache**: 1x Redis cluster (3 nodes, 2GB RAM each)
- **Storage**: 500GB SSD for database, 100GB for logs
- **Network**: Load balancer with SSL termination

#### Scaling Considerations
- **Horizontal Scaling**: Add web server instances based on CPU usage
- **Database Scaling**: Read replicas for high read load
- **Caching**: Redis cluster scaling for high request volume
- **CDN**: Static assets and API response caching

### Monitoring & Alerting

#### Key Metrics
- **API Response Time**: < 3 seconds for 95th percentile
- **Error Rate**: < 1% for all API endpoints
- **Database Performance**: Query execution time < 100ms
- **System Resources**: CPU < 70%, Memory < 80%

#### Alert Conditions
- **High Error Rate**: > 5% error rate for 5 minutes
- **Slow Response**: > 10 seconds average response time
- **Database Issues**: Connection failures or slow queries
- **Security Events**: Failed authentication attempts, suspicious activity

## Conclusion

The MEDGENESIS system provides a robust, scalable solution for pharmaceutical authentication in India. The hybrid online-offline architecture ensures reliability in diverse connectivity conditions while maintaining high security standards. The phased deployment approach minimizes risk while enabling iterative improvement based on real-world feedback.

The system's success depends on strong partnerships with pharmaceutical manufacturers, effective user training, and continuous monitoring of security threats. By focusing on practical, implementable technology, MEDGENESIS can make a significant impact in reducing counterfeit medicines and protecting patient safety.