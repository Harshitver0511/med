# MEDGENESIS - Pharmaceutical Authentication System

A comprehensive pharmaceutical authentication system designed to combat counterfeit medicines in India through a hybrid online-offline verification platform.

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Running the System](#running-the-system)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🎯 Overview

MEDGENESIS provides a robust solution for pharmaceutical authentication with the following key features:

- **Unique Authentication Codes**: Cryptographically generated codes for each medicine package
- **Hybrid Verification**: Works both online and offline for India's diverse connectivity
- **Mobile Application**: Android app for pharmacists and healthcare workers
- **Administrative Dashboard**: Web-based dashboard for manufacturers and administrators
- **Real-time Analytics**: Comprehensive reporting and suspicious activity detection
- **Batch Management**: Complete lifecycle management for pharmaceutical batches

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MEDGENESIS SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mobile App (Android)          Backend API (Node.js)            │
│  ├─ QR Code Scanner            ├─ Authentication                │
│  ├─ Offline Mode               ├─ Batch Management              │
│  ├─ Location Services          ├─ Verification Logic            │
│  └─ Sync Capability            ├─ Analytics & Reporting         │
│                                └─ PostgreSQL + Redis            │
│                                                                 │
│  Admin Dashboard (React)                                        │
│  ├─ Real-time Monitoring                                        │
│  ├─ Batch Management                                            │
│  ├─ Verification History                                        │
│  ├─ Alerts & Notifications                                      │
│  └─ Settings & Configuration                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

### Required Software

- **Node.js** >= 16.0.0
- **PostgreSQL** >= 14.0
- **Redis** >= 7.0
- **Android Studio** (for mobile development)
- **Docker & Docker Compose** (for containerized deployment)

### System Requirements

- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 10GB free space
- **Network**: Internet connection for API calls
- **OS**: Windows 10+, macOS 10.15+, or Linux

## 🚀 Quick Start

### Using Docker Compose (Recommended for Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/medgenesis.git
   cd medgenesis
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the applications:**
   - Backend API: http://localhost:8080
   - Admin Dashboard: http://localhost:3000
   - Database: localhost:5432
   - Redis: localhost:6379

4. **Test the system:**
   ```bash
   curl http://localhost:8080/health
   ```

### Manual Setup

See [Detailed Setup](#detailed-setup) section below for manual installation instructions.

## 🔧 Detailed Setup

### 1. Database Setup

#### Option A: Using Docker (Recommended)

The database will be automatically set up when using Docker Compose.

#### Option B: Manual PostgreSQL Installation

1. **Install PostgreSQL:**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS
   brew install postgresql

   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create database and user:**
   ```bash
   sudo -u postgres psql
   ```

   ```sql
   CREATE DATABASE medgenesis;
   CREATE USER medgenesis WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE medgenesis TO medgenesis;
   ```

3. **Run database initialization:**
   ```bash
   cd database-setup
   npm install
   node migrate.js
   ```

### 2. Redis Setup

#### Option A: Using Docker
Redis will be automatically set up when using Docker Compose.

#### Option B: Manual Redis Installation

1. **Install Redis:**
   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server

   # macOS
   brew install redis

   # Windows
   # Download from https://github.com/tporadowski/redis/releases
   ```

2. **Start Redis:**
   ```bash
   redis-server
   ```

### 3. Backend API Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

### 4. Admin Dashboard Setup

1. **Navigate to admin dashboard directory:**
   ```bash
   cd admin-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

### 5. Android Application Setup

1. **Open Android Studio**

2. **Import the project:**
   - File → Open → Select `android-app` directory

3. **Configure the project:**
   - Update `BASE_URL` in `build.gradle` if needed
   - Sync the project with Gradle files

4. **Run the application:**
   - Connect an Android device or start an emulator
   - Click Run button in Android Studio

## 🏃 Running the System

### Development Mode

1. **Start all services:**
   ```bash
   # Using Docker Compose
   docker-compose up

   # Or manually start each service
   # Terminal 1: Database and Redis
   docker-compose up postgres redis

   # Terminal 2: Backend
   cd backend-api && npm run dev

   # Terminal 3: Admin Dashboard
   cd admin-dashboard && npm start

   # Terminal 4: Android App (in Android Studio)
   ```

2. **Access the applications:**
   - Backend API: http://localhost:8080
   - Admin Dashboard: http://localhost:3000
   - API Documentation: http://localhost:8080/api-docs

### Production Mode

1. **Build and start all services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Configure SSL/TLS:**
   ```bash
   # Place your SSL certificates in ./ssl directory
   # Update nginx.conf with your domain
   ```

## 🧪 Testing

### Backend API Testing

```bash
cd backend-api
npm test
```

### Android Application Testing

1. **Run unit tests:**
   ```bash
   cd android-app
   ./gradlew test
   ```

2. **Run instrumentation tests:**
   ```bash
   ./gradlew connectedAndroidTest
   ```

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8080/api/verify

# Using Artillery
artillery run load-test.yml
```

## 🚀 Deployment

### Using Docker Compose (Recommended)

1. **Production deployment:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Monitor logs:**
   ```bash
   docker-compose logs -f
   ```

### Manual Deployment

1. **Database:** Deploy PostgreSQL on your cloud provider
2. **Redis:** Use managed Redis service or deploy manually
3. **Backend:** Deploy using PM2, systemd, or process manager
4. **Admin Dashboard:** Deploy to static hosting or web server
5. **Android App:** Publish to Google Play Store

### Cloud Deployment

#### AWS Deployment
- Use RDS for PostgreSQL
- Use ElastiCache for Redis
- Deploy backend on EC2 or ECS
- Use S3 + CloudFront for admin dashboard
- Use Route 53 for DNS

#### Google Cloud Deployment
- Use Cloud SQL for PostgreSQL
- Use Memorystore for Redis
- Deploy backend on Cloud Run or GKE
- Use Cloud Storage + Cloud CDN for admin dashboard
- Use Cloud DNS for DNS

## 📚 API Documentation

### Authentication

All API requests require an API key in the `X-API-Key` header:

```http
GET /api/verify
X-API-Key: your-api-key
```

### Endpoints

#### Verify Authentication Code
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
```

#### Create Batch
```http
POST /api/batches
Content-Type: application/json
X-API-Key: your-api-key

{
  "batch_id": "BATCH2025001",
  "product_name": "Paracetamol 500mg",
  "total_units": 10000,
  "expiry_date": "2026-12-31"
}
```

#### Get Statistics
```http
GET /api/stats/dashboard?days=30
X-API-Key: your-api-key
```

For complete API documentation, visit: http://localhost:8080/api-docs

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify connection parameters in .env
   - Ensure database exists and user has permissions

2. **Redis Connection Failed**
   - Check Redis is running
   - Verify Redis host and port in .env
   - Check Redis authentication if enabled

3. **API Key Authentication Failed**
   - Verify API key is correct
   - Check if API key is active and not expired
   - Ensure proper header format: `X-API-Key: your-key`

4. **Mobile App Not Scanning**
   - Check camera permissions
   - Ensure good lighting conditions
   - Verify QR code is clear and undamaged

5. **High Memory Usage**
   - Check for memory leaks in application code
   - Optimize database queries
   - Implement proper caching strategies

### Debug Mode

Enable debug logging:
```bash
export NODE_ENV=development
export LOG_LEVEL=debug
```

### Performance Monitoring

- Use built-in health check endpoint: `/health`
- Monitor PostgreSQL performance with `pg_stat_statements`
- Use Redis `INFO` command for cache monitoring
- Implement application performance monitoring (APM)

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Commit your changes:**
   ```bash
   git commit -m 'Add some feature'
   ```
4. **Push to the branch:**
   ```bash
   git push origin feature/your-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow coding standards for each technology
- Write comprehensive tests
- Update documentation
- Use meaningful commit messages
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the troubleshooting section
- Review API documentation

## 📞 Contact

- **Project Maintainer:** [Your Name]
- **Email:** [your.email@example.com]
- **Project Website:** https://medgenesis.com
- **Documentation:** https://docs.medgenesis.com

---

**Note:** This is a demonstration system. For production use, ensure proper security measures, compliance with pharmaceutical regulations, and thorough testing.