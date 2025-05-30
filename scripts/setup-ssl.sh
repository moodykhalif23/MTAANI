#!/bin/bash

# =============================================================================
# Mtaani SSL Certificate Setup Script
# =============================================================================
# This script helps set up SSL certificates for your production environment
# Supports: Let's Encrypt, Custom certificates, and Cloudflare
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=""
EMAIL=""
WEBROOT_PATH="/var/www/html"
CERT_PATH="/etc/ssl/certs"
KEY_PATH="/etc/ssl/private"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Functions
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
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Get domain and email from user
get_user_input() {
    if [[ -z "$DOMAIN" ]]; then
        read -p "Enter your domain name (e.g., mtaani.example.com): " DOMAIN
    fi
    
    if [[ -z "$EMAIL" ]]; then
        read -p "Enter your email address: " EMAIL
    fi
    
    if [[ -z "$DOMAIN" ]] || [[ -z "$EMAIL" ]]; then
        print_error "Domain and email are required"
        exit 1
    fi
    
    print_info "Domain: $DOMAIN"
    print_info "Email: $EMAIL"
}

# Install certbot
install_certbot() {
    print_header "Installing Certbot"
    
    # Update package list
    apt-get update
    
    # Install snapd if not present
    if ! command -v snap &> /dev/null; then
        print_info "Installing snapd..."
        apt-get install -y snapd
    fi
    
    # Install certbot via snap
    print_info "Installing certbot..."
    snap install core; snap refresh core
    snap install --classic certbot
    
    # Create symlink
    ln -sf /snap/bin/certbot /usr/bin/certbot
    
    print_success "Certbot installed successfully"
}

# Install nginx if not present
install_nginx() {
    if ! command -v nginx &> /dev/null; then
        print_header "Installing Nginx"
        apt-get update
        apt-get install -y nginx
        systemctl enable nginx
        systemctl start nginx
        print_success "Nginx installed and started"
    else
        print_info "Nginx is already installed"
    fi
}

# Create nginx configuration
create_nginx_config() {
    print_header "Creating Nginx Configuration"
    
    # Create initial HTTP configuration
    cat > "$NGINX_AVAILABLE/$DOMAIN" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root $WEBROOT_PATH;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (will be updated after certificate generation)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files (if serving directly)
    location /_next/static/ {
        alias /var/www/$DOMAIN/_next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Enable the site
    ln -sf "$NGINX_AVAILABLE/$DOMAIN" "$NGINX_ENABLED/"
    
    print_success "Nginx configuration created"
}

# Obtain Let's Encrypt certificate
obtain_certificate() {
    print_header "Obtaining SSL Certificate"
    
    # Create webroot directory
    mkdir -p "$WEBROOT_PATH"
    
    # Test nginx configuration
    nginx -t
    if [[ $? -ne 0 ]]; then
        print_error "Nginx configuration test failed"
        exit 1
    fi
    
    # Reload nginx
    systemctl reload nginx
    
    # Obtain certificate
    print_info "Requesting certificate from Let's Encrypt..."
    certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT_PATH" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN,www.$DOMAIN"
    
    if [[ $? -eq 0 ]]; then
        print_success "SSL certificate obtained successfully"
    else
        print_error "Failed to obtain SSL certificate"
        exit 1
    fi
}

# Setup automatic renewal
setup_auto_renewal() {
    print_header "Setting up Automatic Renewal"
    
    # Test renewal
    certbot renew --dry-run
    
    if [[ $? -eq 0 ]]; then
        print_success "Certificate renewal test passed"
        
        # Create renewal hook
        cat > /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF
        chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh
        
        print_success "Automatic renewal configured"
    else
        print_warning "Certificate renewal test failed"
    fi
}

# Create environment file with SSL paths
update_env_file() {
    print_header "Updating Environment Configuration"
    
    ENV_FILE=".env.local"
    
    # Backup existing env file
    if [[ -f "$ENV_FILE" ]]; then
        cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Update SSL paths in environment file
    cat >> "$ENV_FILE" << EOF

# SSL Configuration (auto-generated)
SSL_CERT_PATH=/etc/letsencrypt/live/$DOMAIN/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/$DOMAIN/privkey.pem
SSL_CA_PATH=/etc/letsencrypt/live/$DOMAIN/chain.pem
LETSENCRYPT_EMAIL=$EMAIL
LETSENCRYPT_DOMAIN=$DOMAIN
EOF
    
    print_success "Environment file updated with SSL paths"
}

# Test SSL configuration
test_ssl() {
    print_header "Testing SSL Configuration"
    
    # Reload nginx with new SSL configuration
    nginx -t && systemctl reload nginx
    
    print_info "Testing SSL certificate..."
    
    # Test with curl
    if curl -I "https://$DOMAIN" &> /dev/null; then
        print_success "SSL certificate is working correctly"
    else
        print_warning "SSL test failed - please check configuration manually"
    fi
    
    print_info "You can test your SSL configuration at:"
    print_info "https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
}

# Main menu
show_menu() {
    print_header "Mtaani SSL Setup"
    echo "1. Full automatic setup (Let's Encrypt + Nginx)"
    echo "2. Install Certbot only"
    echo "3. Install Nginx only"
    echo "4. Create Nginx configuration only"
    echo "5. Obtain SSL certificate only"
    echo "6. Test SSL configuration"
    echo "7. Setup custom certificate"
    echo "8. Exit"
    echo
    read -p "Choose an option (1-8): " choice
}

# Custom certificate setup
setup_custom_certificate() {
    print_header "Custom Certificate Setup"
    
    print_info "For custom certificates, you need:"
    print_info "1. Certificate file (.crt or .pem)"
    print_info "2. Private key file (.key)"
    print_info "3. Certificate chain/bundle (optional)"
    
    read -p "Enter path to certificate file: " CERT_FILE
    read -p "Enter path to private key file: " KEY_FILE
    read -p "Enter path to certificate chain (optional): " CHAIN_FILE
    
    if [[ ! -f "$CERT_FILE" ]] || [[ ! -f "$KEY_FILE" ]]; then
        print_error "Certificate or key file not found"
        exit 1
    fi
    
    # Copy certificates to standard location
    cp "$CERT_FILE" "$CERT_PATH/$DOMAIN.crt"
    cp "$KEY_FILE" "$KEY_PATH/$DOMAIN.key"
    
    if [[ -f "$CHAIN_FILE" ]]; then
        cp "$CHAIN_FILE" "$CERT_PATH/$DOMAIN-chain.crt"
    fi
    
    # Set proper permissions
    chmod 644 "$CERT_PATH/$DOMAIN.crt"
    chmod 600 "$KEY_PATH/$DOMAIN.key"
    
    print_success "Custom certificate installed"
    
    # Update environment file
    cat >> ".env.local" << EOF

# Custom SSL Configuration
SSL_CERT_PATH=$CERT_PATH/$DOMAIN.crt
SSL_KEY_PATH=$KEY_PATH/$DOMAIN.key
SSL_CA_PATH=$CERT_PATH/$DOMAIN-chain.crt
EOF
    
    print_success "Environment file updated"
}

# Main execution
main() {
    check_root
    
    while true; do
        show_menu
        
        case $choice in
            1)
                get_user_input
                install_nginx
                install_certbot
                create_nginx_config
                obtain_certificate
                setup_auto_renewal
                update_env_file
                test_ssl
                print_success "Full SSL setup completed!"
                break
                ;;
            2)
                install_certbot
                break
                ;;
            3)
                install_nginx
                break
                ;;
            4)
                get_user_input
                create_nginx_config
                break
                ;;
            5)
                get_user_input
                obtain_certificate
                break
                ;;
            6)
                get_user_input
                test_ssl
                break
                ;;
            7)
                get_user_input
                setup_custom_certificate
                break
                ;;
            8)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-8."
                ;;
        esac
    done
}

# Run main function
main "$@"
