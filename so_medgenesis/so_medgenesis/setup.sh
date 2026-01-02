#!/bin/bash

# MEDGENESIS Setup Script
# This script automates the setup process for the MEDGENESIS system

set -e

echo "🚀 MEDGENESIS Pharmaceutical Authentication System Setup"
echo "==========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js >= 16.0.0"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version must be >= 16.0.0. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_success "npm $(npm --version) found"

# Check Docker (optional)
if command -v docker &> /dev/null; then
    print_success "Docker $(docker --version) found"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker not found. Some features may not be available."
    DOCKER_AVAILABLE=false
fi

# Check Docker Compose (optional)
if command -v docker-compose &> /dev/null; then
    print_success "Docker Compose $(docker-compose --version) found"
    DOCKER_COMPOSE_AVAILABLE=true
else
    print_warning "Docker Compose not found. Some features may not be available."
    DOCKER_COMPOSE_AVAILABLE=false
fi

# Function to setup backend
check_and_setup_backend() {
    print_status "Setting up Backend API..."
    
    if [ -d "backend-api" ]; then
        cd backend-api
        
        # Check if package.json exists
        if [ -f "package.json" ]; then
            print_status "Installing backend dependencies..."
            npm install
            
            # Check if .env exists, if not copy from example
            if [ ! -f ".env" ]; then
                print_status "Creating .env file from example..."
                cp .env.example .env
                print_warning "Please review and update the .env file with your configuration"
            fi
            
            print_success "Backend setup completed"
        else
            print_error "package.json not found in backend-api directory"
            exit 1
        fi
        
        cd ..
    else
        print_error "backend-api directory not found"
        exit 1
    fi
}

# Function to setup admin dashboard
check_and_setup_admin() {
    print_status "Setting up Admin Dashboard..."
    
    if [ -d "admin-dashboard" ]; then
        cd admin-dashboard
        
        # Check if package.json exists
        if [ -f "package.json" ]; then
            print_status "Installing admin dashboard dependencies..."
            npm install
            
            print_success "Admin dashboard setup completed"
        else
            print_error "package.json not found in admin-dashboard directory"
            exit 1
        fi
        
        cd ..
    else
        print_error "admin-dashboard directory not found"
        exit 1
    fi
}

# Function to setup database
check_and_setup_database() {
    print_status "Setting up Database..."
    
    if [ -d "database-setup" ]; then
        cd database-setup
        
        # Check if init.sql exists
        if [ -f "init.sql" ]; then
            print_success "Database initialization script found"
            
            # Check if migrate.js exists
            if [ -f "migrate.js" ]; then
                print_success "Database migration script found"
            else
                print_error "migrate.js not found"
                exit 1
            fi
        else
            print_error "init.sql not found"
            exit 1
        fi
        
        cd ..
    else
        print_error "database-setup directory not found"
        exit 1
    fi
}

# Function to setup Android app
check_and_setup_android() {
    print_status "Checking Android App..."
    
    if [ -d "android-app" ]; then
        print_success "Android app directory found"
        print_status "To setup the Android app:"
        print_status "1. Open Android Studio"
        print_status "2. File → Open → Select android-app directory"
        print_status "3. Sync project with Gradle files"
        print_status "4. Run on device or emulator"
    else
        print_error "android-app directory not found"
    fi
}

# Main setup function
main() {
    echo ""
    print_status "Starting setup process..."
    echo ""
    
    # Check and setup all components
    check_and_setup_backend
    check_and_setup_admin
    check_and_setup_database
    check_and_setup_android
    
    echo ""
    print_success "Setup completed successfully!"
    echo ""
    
    # Display next steps
    print_status "Next Steps:"
    echo "1. Review and update configuration files (.env files)"
    echo "2. Start PostgreSQL and Redis servers"
    echo "3. Run database migration: cd database-setup && node migrate.js"
    echo "4. Start the backend server: cd backend-api && npm run dev"
    echo "5. Start the admin dashboard: cd admin-dashboard && npm start"
    echo "6. Setup and run the Android app in Android Studio"
    echo ""
    
    # Docker option
    if [ "$DOCKER_AVAILABLE" = true ] && [ "$DOCKER_COMPOSE_AVAILABLE" = true ]; then
        print_status "Alternatively, you can use Docker Compose:"
        echo "  docker-compose up -d"
        echo ""
    fi
    
    # Demo credentials
    echo "Demo Credentials for Admin Dashboard:"
    echo "  Email: admin@medgenesis.com"
    echo "  Password: admin123"
    echo ""
    
    print_success "Setup complete! 🎉"
}

# Run main function
main "$@"