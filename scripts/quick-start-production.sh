#!/bin/bash

# =============================================================================
# Mtaani Production Quick Start Script
# =============================================================================
# This script guides you through the complete production setup process
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
DOMAIN=""
EMAIL=""
DB_TYPE=""
DB_HOST=""
DB_USERNAME=""
DB_PASSWORD=""

print_header() {
    echo -e "${BLUE}=============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=============================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

# Welcome message
welcome() {
    clear
    print_header "🚀 MTAANI PRODUCTION SETUP"
    echo
    echo "This script will guide you through setting up Mtaani for production."
    echo "You'll need:"
    echo "  • A domain name"
    echo "  • Email address"
    echo "  • CouchDB database (we'll help you choose)"
    echo "  • Root/sudo access"
    echo
    read -p "Ready to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
}

# Collect basic information
collect_info() {
    print_header "📋 BASIC INFORMATION"
    
    # Domain
    while [[ -z "$DOMAIN" ]]; do
        read -p "Enter your domain name (e.g., mtaani.example.com): " DOMAIN
        if [[ -z "$DOMAIN" ]]; then
            print_error "Domain is required"
        fi
    done
    
    # Email
    while [[ -z "$EMAIL" ]]; do
        read -p "Enter your email address: " EMAIL
        if [[ -z "$EMAIL" ]]; then
            print_error "Email is required"
        fi
    done
    
    print_success "Domain: $DOMAIN"
    print_success "Email: $EMAIL"
}

# Choose database option
choose_database() {
    print_header "🗄️  DATABASE SETUP"
    
    echo "Choose your CouchDB option:"
    echo "1. Self-hosted CouchDB (full control, requires setup)"
    echo "2. IBM Cloudant (managed, easy setup)"
    echo "3. Apache CouchDB Cloud (managed, good performance)"
    echo "4. I already have CouchDB configured"
    echo
    
    while [[ -z "$DB_TYPE" ]]; do
        read -p "Choose option (1-4): " choice
        case $choice in
            1)
                DB_TYPE="self-hosted"
                setup_self_hosted_db
                ;;
            2)
                DB_TYPE="cloudant"
                setup_cloudant_db
                ;;
            3)
                DB_TYPE="couchdb-cloud"
                setup_couchdb_cloud
                ;;
            4)
                DB_TYPE="existing"
                setup_existing_db
                ;;
            *)
                print_error "Invalid option. Please choose 1-4."
                ;;
        esac
    done
}

setup_self_hosted_db() {
    print_step "Setting up self-hosted CouchDB..."
    
    # Install CouchDB
    print_info "Installing CouchDB..."
    curl -L https://couchdb.apache.org/repo/keys.asc | sudo apt-key add -
    echo "deb https://apache.jfrog.io/artifactory/couchdb-deb/ focal main" | sudo tee /etc/apt/sources.list.d/couchdb.list
    sudo apt update
    sudo apt install -y couchdb
    
    # Configure CouchDB
    DB_HOST="localhost"
    read -p "Enter CouchDB admin username [admin]: " DB_USERNAME
    DB_USERNAME=${DB_USERNAME:-admin}
    
    read -s -p "Enter CouchDB admin password: " DB_PASSWORD
    echo
    
    # Set up admin user
    curl -X PUT http://localhost:5984/_users/org.couchdb.user:$DB_USERNAME \
         -H "Accept: application/json" \
         -H "Content-Type: application/json" \
         -d "{\"name\": \"$DB_USERNAME\", \"password\": \"$DB_PASSWORD\", \"roles\": [], \"type\": \"user\"}"
    
    print_success "Self-hosted CouchDB configured"
}

setup_cloudant_db() {
    print_step "Setting up IBM Cloudant..."
    
    print_info "Please set up IBM Cloudant manually:"
    echo "1. Go to https://cloud.ibm.com"
    echo "2. Create a Cloudant service instance"
    echo "3. Generate service credentials"
    echo "4. Come back with the connection details"
    echo
    
    read -p "Enter Cloudant hostname: " DB_HOST
    read -p "Enter Cloudant username: " DB_USERNAME
    read -s -p "Enter Cloudant API key: " DB_PASSWORD
    echo
    
    print_success "Cloudant configuration collected"
}

setup_couchdb_cloud() {
    print_step "Setting up CouchDB Cloud..."
    
    print_info "Please set up CouchDB Cloud manually:"
    echo "1. Go to https://couchdb.com"
    echo "2. Create an account and cluster"
    echo "3. Note the connection details"
    echo "4. Come back with the connection details"
    echo
    
    read -p "Enter CouchDB Cloud hostname: " DB_HOST
    read -p "Enter username: " DB_USERNAME
    read -s -p "Enter password: " DB_PASSWORD
    echo
    
    print_success "CouchDB Cloud configuration collected"
}

setup_existing_db() {
    print_step "Using existing CouchDB..."
    
    read -p "Enter CouchDB hostname: " DB_HOST
    read -p "Enter username: " DB_USERNAME
    read -s -p "Enter password: " DB_PASSWORD
    echo
    
    print_success "Existing CouchDB configuration collected"
}

# Create environment file
create_env_file() {
    print_header "⚙️  ENVIRONMENT CONFIGURATION"
    
    print_step "Creating production environment file..."
    
    # Copy template
    cp .env.production .env.local
    
    # Generate secure tokens
    JWT_SECRET=$(openssl rand -base64 64)
    SECURITY_TOKEN=$(openssl rand -hex 32)
    INTERNAL_API_KEY=$(openssl rand -hex 32)
    ADMIN_API_KEY=$(openssl rand -hex 32)
    ADMIN_TOKEN=$(openssl rand -hex 32)
    
    # Update environment file
    cat > .env.local << EOF
# =============================================================================
# MTAANI PRODUCTION ENVIRONMENT (AUTO-GENERATED)
# =============================================================================

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NEXT_PUBLIC_API_URL=https://$DOMAIN/api

# Database
COUCHDB_HOST=$DB_HOST
COUCHDB_PORT=5984
COUCHDB_PROTOCOL=https
COUCHDB_USERNAME=$DB_USERNAME
COUCHDB_PASSWORD=$DB_PASSWORD
COUCHDB_DATABASE=mtaani_production

# Security (auto-generated)
JWT_SECRET=$JWT_SECRET
SECURITY_VALIDATION_TOKEN=$SECURITY_TOKEN
INTERNAL_API_KEY=$INTERNAL_API_KEY
ADMIN_API_KEY=$ADMIN_API_KEY
ADMIN_DASHBOARD_TOKEN=$ADMIN_TOKEN

# SSL (will be updated after SSL setup)
SSL_CERT_PATH=/etc/letsencrypt/live/$DOMAIN/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/$DOMAIN/privkey.pem
LETSENCRYPT_EMAIL=$EMAIL
LETSENCRYPT_DOMAIN=$DOMAIN

# Features
FEATURE_BUSINESS_TOOLS=true
FEATURE_EVENT_MANAGEMENT=true
FEATURE_SUBSCRIPTION_SYSTEM=true
FEATURE_API_GATEWAY=true
FEATURE_ANALYTICS=true

# Production settings
DEBUG_MODE=false
MOCK_DATA_ENABLED=false
EOF
    
    print_success "Environment file created: .env.local"
    print_warning "Keep your .env.local file secure and never commit it to version control!"
}

# Install dependencies
install_dependencies() {
    print_header "📦 INSTALLING DEPENDENCIES"
    
    print_step "Installing Node.js dependencies..."
    npm install
    
    print_step "Installing system dependencies..."
    sudo apt update
    sudo apt install -y curl nginx certbot
    
    print_success "Dependencies installed"
}

# Setup SSL
setup_ssl() {
    print_header "🔒 SSL CERTIFICATE SETUP"
    
    print_info "Setting up SSL certificate with Let's Encrypt..."
    
    # Make SSL script executable
    chmod +x scripts/setup-ssl.sh
    
    # Run SSL setup
    sudo DOMAIN="$DOMAIN" EMAIL="$EMAIL" ./scripts/setup-ssl.sh
    
    print_success "SSL certificate configured"
}

# Setup database
setup_database() {
    print_header "🗃️  DATABASE INITIALIZATION"
    
    print_step "Validating environment configuration..."
    npm run validate:env
    
    print_step "Testing database connection..."
    npm run test:db-connection
    
    print_step "Setting up production database..."
    npm run setup:production-db
    
    print_success "Database setup completed"
}

# Build and deploy
build_and_deploy() {
    print_header "🚀 BUILD AND DEPLOYMENT"
    
    print_step "Building application for production..."
    npm run production:build
    
    print_step "Installing PM2 process manager..."
    sudo npm install -g pm2
    
    print_step "Creating PM2 ecosystem file..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mtaani',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF
    
    print_step "Starting application with PM2..."
    mkdir -p logs
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    
    print_success "Application deployed and running"
}

# Final verification
verify_deployment() {
    print_header "🔍 DEPLOYMENT VERIFICATION"
    
    print_step "Testing application health..."
    sleep 5  # Give the app time to start
    
    if curl -f "https://$DOMAIN/health" > /dev/null 2>&1; then
        print_success "Application is responding correctly"
    else
        print_warning "Application health check failed - please check logs"
    fi
    
    print_step "Testing SSL certificate..."
    if openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" < /dev/null > /dev/null 2>&1; then
        print_success "SSL certificate is working correctly"
    else
        print_warning "SSL certificate test failed"
    fi
    
    print_step "Testing database connectivity..."
    if npm run test:db-connection > /dev/null 2>&1; then
        print_success "Database connection is working"
    else
        print_warning "Database connection test failed"
    fi
}

# Show completion summary
show_summary() {
    print_header "🎉 DEPLOYMENT COMPLETED!"
    
    echo "Your Mtaani platform is now running in production!"
    echo
    echo "📍 Application URL: https://$DOMAIN"
    echo "🔑 Admin Token: $ADMIN_TOKEN"
    echo "📊 Admin Dashboard: https://$DOMAIN/admin"
    echo
    echo "📋 Important files created:"
    echo "  • .env.local (keep this secure!)"
    echo "  • ecosystem.config.js (PM2 configuration)"
    echo
    echo "🔧 Useful commands:"
    echo "  • View logs: npm run logs:view"
    echo "  • Restart app: pm2 restart mtaani"
    echo "  • Check status: pm2 status"
    echo "  • Test health: curl https://$DOMAIN/health"
    echo
    echo "📚 Next steps:"
    echo "  1. Test your application thoroughly"
    echo "  2. Set up monitoring and backups"
    echo "  3. Configure your domain's DNS if not done already"
    echo "  4. Review security settings"
    echo
    print_warning "Remember to keep your .env.local file secure!"
    print_info "For troubleshooting, check PRODUCTION_DEPLOYMENT.md"
}

# Main execution
main() {
    welcome
    collect_info
    choose_database
    create_env_file
    install_dependencies
    setup_ssl
    setup_database
    build_and_deploy
    verify_deployment
    show_summary
}

# Check if running as root for certain operations
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. Some operations will be performed with elevated privileges."
fi

# Run main function
main "$@"
