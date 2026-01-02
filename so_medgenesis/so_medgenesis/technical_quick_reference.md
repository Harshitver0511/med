# MEDGENESIS - Technical Quick Reference

## System Overview
- **Purpose**: Pharmaceutical authentication system for India
- **Architecture**: Hybrid online-offline verification
- **Target Users**: Pharmacists, healthcare distributors, NGO workers
- **Platform**: Android mobile app + Cloud backend

## Core Components

### 1. Manufacturer Code Generation
```
Input: Manufacturer ID + Batch ID + Serial Number + Secret Key
Process: SHA-256 Hashing
Output: 32-character authentication code
Encoding: High-density QR Code (Version 40)
```

### 2. Mobile App Verification
```
Modes:
- Online: Real-time backend validation (< 3 seconds)
- Offline: Local cache verification (limited confidence)

Results:
- Authentic (high confidence)
- Unverified (offline mode)
- Suspicious (duplicate/invalid/revoked)
```

### 3. Backend API Endpoints
```http
POST /api/verify          # Verify authentication code
POST /api/batches         # Register new batch
POST /api/batches/revoke  # Revoke batch
GET  /api/stats           # Get verification statistics
```

### 4. Database Tables
```sql
authentication_codes  # Core code storage
verification_logs     # All verification attempts
batches              # Batch information
api_keys             # API authentication
```

## Technology Stack

### Mobile Application
- **Platform**: Android (API 21+)
- **Language**: Kotlin/Java
- **Libraries**: ZXing (QR scanning), SQLite (local storage)
- **Features**: Camera scanning, offline mode, location services

### Backend Service
- **Framework**: Node.js/Express or Python/FastAPI
- **Database**: PostgreSQL (primary), Redis (caching)
- **Security**: TLS 1.3, API key authentication
- **Deployment**: Docker containers, Kubernetes

### Administrative Dashboard
- **Framework**: React.js with TypeScript
- **UI Library**: Material-UI or Tailwind CSS
- **Charts**: Chart.js or D3.js
- **State Management**: Redux Toolkit

## Security Features

### Authentication
- API key-based authentication
- Rate limiting (100 requests/minute default)
- Role-based access control

### Data Protection
- TLS 1.3 encryption in transit
- AES-256 encryption at rest
- No personally identifiable information stored

### Audit & Monitoring
- All verification attempts logged
- Real-time security alerts
- Suspicious pattern detection

## Performance Targets

### Response Times
- Online verification: < 3 seconds
- Offline verification: < 1 second
- Dashboard loading: < 2 seconds

### Accuracy Metrics
- Verification accuracy: > 99%
- Offline success rate: > 95%
- False positive rate: < 1%

### System Uptime
- API availability: > 99.9%
- Database availability: > 99.95%
- Mobile app stability: > 99.5%

## Deployment Checklist

### Development
- [ ] Set up local development environment
- [ ] Implement core verification logic
- [ ] Create mobile app UI components
- [ ] Build administrative dashboard

### Testing
- [ ] Unit tests for all components
- [ ] Integration tests for API endpoints
- [ ] Load testing for high traffic scenarios
- [ ] Security vulnerability scanning

### Staging
- [ ] Deploy to staging environment
- [ ] Test with limited data set
- [ ] Performance benchmarking
- [ ] User acceptance testing

### Production
- [ ] Set up production infrastructure
- [ ] Configure monitoring and alerting
- [ ] Deploy with blue-green strategy
- [ ] Conduct pilot with select pharmacies

## Quick Commands

### Database Setup
```sql
# Create authentication codes table
CREATE TABLE authentication_codes (
    id SERIAL PRIMARY KEY,
    manufacturer_id VARCHAR(50) NOT NULL,
    batch_id VARCHAR(50) NOT NULL,
    serial_number VARCHAR(50) NOT NULL,
    authentication_code VARCHAR(32) UNIQUE NOT NULL,
    created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);
```

### API Testing
```bash
# Test verification endpoint
curl -X POST https://api.medgenesis.com/verify \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"authentication_code": "a1b2c3d4e5f6g7h8"}'
```

### Mobile App Build
```bash
# Build Android APK
cd mobile-app
./gradlew assembleRelease

# Install on device
adb install app/build/outputs/apk/release/app-release.apk
```

## Support & Troubleshooting

### Common Issues
1. **QR Code Not Scanning**: Check camera permissions, lighting conditions
2. **Offline Verification Failing**: Verify local database synchronization
3. **API Timeouts**: Check network connectivity, rate limiting
4. **Database Connection Errors**: Verify credentials, connection pool settings

### Debug Commands
```bash
# Check API health
curl https://api.medgenesis.com/health

# View recent logs
docker logs medgenesis-backend --tail 100

# Check database connections
psql -h localhost -U medgenesis -c "SELECT count(*) FROM pg_stat_activity;"
```

## Contact Information

### Technical Team
- **System Architecture**: [Contact details]
- **Mobile Development**: [Contact details]
- **Backend Development**: [Contact details]
- **DevOps/Infrastructure**: [Contact details]

### Business Stakeholders
- **Product Owner**: [Contact details]
- **Project Manager**: [Contact details]
- **Security Lead**: [Contact details]

---

*This quick reference guide provides essential information for developers, administrators, and support staff working with the MEDGENESIS pharmaceutical authentication system.*