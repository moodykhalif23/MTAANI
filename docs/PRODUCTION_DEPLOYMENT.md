# 🚀 Mtaani Production Deployment Guide

This guide provides step-by-step instructions for deploying Mtaani to production with proper security, SSL, and database configuration.

## 📋 Pre-Deployment Checklist

### ✅ Prerequisites
- [ ] Domain name registered and DNS configured
- [ ] Server/VPS with Ubuntu 20.04+ or similar
- [ ] Root/sudo access to the server
- [ ] Node.js 18+ installed
- [ ] Git installed

### ✅ Required Accounts/Services
- [ ] CouchDB hosting (self-hosted, IBM Cloudant, or Apache CouchDB Cloud)
- [ ] Email service (SMTP, SendGrid, etc.)
- [ ] SSL certificate provider (Let's Encrypt recommended)
- [ ] Monitoring service (Sentry, DataDog - optional but recommended)

## 🗄️ Phase 1: Database Setup

### Option A: Self-Hosted CouchDB (Recommended for full control)

1. **Install CouchDB on your server:**
   ```bash
   # Add CouchDB repository
   curl -L https://couchdb.apache.org/repo/keys.asc | sudo apt-key add -
   echo "deb https://apache.jfrog.io/artifactory/couchdb-deb/ focal main" | sudo tee /etc/apt/sources.list.d/couchdb.list
   
   # Install CouchDB
   sudo apt update
   sudo apt install -y couchdb
   
   # Configure CouchDB
   sudo systemctl enable couchdb
   sudo systemctl start couchdb
   ```

2. **Secure CouchDB:**
   ```bash
   # Access CouchDB admin interface
   curl -X PUT http://localhost:5984/_users/org.couchdb.user:admin \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -d '{"name": "admin", "password": "YOUR_STRONG_PASSWORD", "roles": [], "type": "user"}'
   
   # Enable authentication
   curl -X PUT http://admin:YOUR_STRONG_PASSWORD@localhost:5984/_config/chttpd/require_valid_user \
        -d '"true"'
   ```

3. **Configure SSL for CouchDB:**
   ```bash
   # Edit CouchDB configuration
   sudo nano /opt/couchdb/etc/local.ini
   
   # Add SSL configuration:
   [ssl]
   enable = true
   cert_file = /etc/ssl/certs/your-domain.crt
   key_file = /etc/ssl/private/your-domain.key
   port = 6984
   ```

### Option B: IBM Cloudant (Managed CouchDB)

1. **Create Cloudant instance:**
   - Go to [IBM Cloud](https://cloud.ibm.com)
   - Create a Cloudant service instance
   - Generate service credentials
   - Note the URL, username, and API key

### Option C: Apache CouchDB Cloud

1. **Sign up for CouchDB Cloud:**
   - Visit [CouchDB Cloud](https://couchdb.com)
   - Create an account and cluster
   - Note connection details

## 🔧 Phase 2: Environment Configuration

1. **Clone your repository:**
   ```bash
   git clone https://github.com/your-username/mtaani.git
   cd mtaani
   npm install
   ```

2. **Create production environment file:**
   ```bash
   cp .env.production .env.local
   ```

3. **Configure environment variables:**
   ```bash
   nano .env.local
   ```
   
   **Required variables to update:**
   ```env
   # Application
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   NEXT_PUBLIC_API_URL=https://your-domain.com/api
   
   # Database (update with your CouchDB details)
   COUCHDB_HOST=your-couchdb-host.com
   COUCHDB_PORT=5984
   COUCHDB_PROTOCOL=https
   COUCHDB_USERNAME=your-username
   COUCHDB_PASSWORD=your-strong-password
   COUCHDB_DATABASE=mtaani_production
   
   # Security (generate strong random values)
   JWT_SECRET=$(openssl rand -base64 64)
   SECURITY_VALIDATION_TOKEN=$(openssl rand -hex 32)
   INTERNAL_API_KEY=$(openssl rand -hex 32)
   ADMIN_API_KEY=$(openssl rand -hex 32)
   ADMIN_DASHBOARD_TOKEN=$(openssl rand -hex 32)
   ```

4. **Generate secure tokens:**
   ```bash
   # Generate JWT secret
   echo "JWT_SECRET=$(openssl rand -base64 64)" >> .env.local
   
   # Generate security tokens
   echo "SECURITY_VALIDATION_TOKEN=$(openssl rand -hex 32)" >> .env.local
   echo "INTERNAL_API_KEY=$(openssl rand -hex 32)" >> .env.local
   echo "ADMIN_API_KEY=$(openssl rand -hex 32)" >> .env.local
   echo "ADMIN_DASHBOARD_TOKEN=$(openssl rand -hex 32)" >> .env.local
   ```

## 🔒 Phase 3: SSL Certificate Setup

### Option A: Let's Encrypt (Free, Automated)

1. **Run the SSL setup script:**
   ```bash
   sudo chmod +x scripts/setup-ssl.sh
   sudo ./scripts/setup-ssl.sh
   ```

2. **Follow the interactive prompts:**
   - Enter your domain name
   - Enter your email address
   - Choose option 1 for full automatic setup

### Option B: Custom SSL Certificate

1. **If you have custom certificates:**
   ```bash
   sudo ./scripts/setup-ssl.sh
   # Choose option 7 for custom certificate setup
   ```

2. **Provide paths to your certificate files:**
   - Certificate file (.crt or .pem)
   - Private key file (.key)
   - Certificate chain (if applicable)

## 🗃️ Phase 4: Database Initialization

1. **Run the database setup script:**
   ```bash
   npm run setup:production-db
   ```
   
   Or manually:
   ```bash
   npx tsx scripts/setup-production-db.ts
   ```

2. **Verify database setup:**
   - Check that all databases are created
   - Verify indexes are in place
   - Test connectivity

## 🚀 Phase 5: Application Deployment

### Option A: PM2 (Process Manager)

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Create PM2 ecosystem file:**
   ```bash
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
   ```

4. **Start the application:**
   ```bash
   mkdir -p logs
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Option B: Docker (Containerized)

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run:**
   ```bash
   docker build -t mtaani .
   docker run -d --name mtaani -p 3000:3000 --env-file .env.local mtaani
   ```

## 🔍 Phase 6: Verification & Testing

1. **Test application health:**
   ```bash
   curl -I https://your-domain.com/health
   ```

2. **Test API endpoints:**
   ```bash
   # Test public API
   curl https://your-domain.com/api/businesses
   
   # Test admin API (with token)
   curl -H "X-Admin-Token: YOUR_ADMIN_TOKEN" https://your-domain.com/api/admin/dashboard
   ```

3. **Test SSL configuration:**
   ```bash
   # Check SSL certificate
   openssl s_client -connect your-domain.com:443 -servername your-domain.com
   
   # Test SSL rating
   # Visit: https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
   ```

4. **Test database connectivity:**
   ```bash
   npm run test:db-connection
   ```

## 📊 Phase 7: Monitoring & Maintenance

1. **Set up log rotation:**
   ```bash
   sudo nano /etc/logrotate.d/mtaani
   ```
   
   ```
   /var/www/mtaani/logs/*.log {
       daily
       missingok
       rotate 52
       compress
       delaycompress
       notifempty
       create 644 www-data www-data
       postrotate
           pm2 reload mtaani
       endscript
   }
   ```

2. **Configure monitoring:**
   - Set up Sentry for error tracking
   - Configure uptime monitoring
   - Set up log aggregation

3. **Set up backups:**
   ```bash
   # Create backup script
   cat > /usr/local/bin/backup-mtaani.sh << 'EOF'
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/backups/mtaani"
   mkdir -p $BACKUP_DIR
   
   # Backup CouchDB
   curl -X GET http://admin:password@localhost:5984/mtaani_production/_all_docs?include_docs=true > $BACKUP_DIR/db_backup_$DATE.json
   
   # Backup application files
   tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /var/www/mtaani
   
   # Clean old backups (keep 30 days)
   find $BACKUP_DIR -name "*.json" -mtime +30 -delete
   find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
   EOF
   
   chmod +x /usr/local/bin/backup-mtaani.sh
   
   # Add to crontab
   echo "0 2 * * * /usr/local/bin/backup-mtaani.sh" | crontab -
   ```

## 🔧 Troubleshooting

### Common Issues:

1. **Database connection fails:**
   - Check CouchDB service status: `sudo systemctl status couchdb`
   - Verify credentials in `.env.local`
   - Check firewall settings

2. **SSL certificate issues:**
   - Verify domain DNS points to your server
   - Check certificate expiration: `openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout`
   - Test renewal: `sudo certbot renew --dry-run`

3. **Application won't start:**
   - Check logs: `pm2 logs mtaani`
   - Verify environment variables: `pm2 env 0`
   - Check port availability: `sudo netstat -tlnp | grep :3000`

4. **Performance issues:**
   - Monitor resources: `htop`
   - Check database indexes
   - Review application logs

## 📞 Support

If you encounter issues:
1. Check the logs first
2. Verify all environment variables are set
3. Test each component individually
4. Consult the troubleshooting section

## 🎉 Success!

Once deployed successfully, your Mtaani platform will be:
- ✅ Secured with SSL/TLS
- ✅ Connected to production database
- ✅ Protected with proper authentication
- ✅ Monitored and backed up
- ✅ Ready for production traffic

Remember to:
- Keep your system updated
- Monitor performance and logs
- Regularly backup your data
- Review security settings periodically
