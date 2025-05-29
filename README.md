# Mtaani - Community Business Platform

A comprehensive platform connecting local businesses with their communities across Kenya. Built with Next.js 14, TypeScript, CouchDB, and JWT authentication.

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/moodykhalif23/mtaani.git
cd mtaani
pnpm install

# Setup environment (single .env.local file)
cp .env.example .env.local
# Edit .env.local with your values (JWT secrets are pre-generated)

# Start development
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
**Backend:** Next.js API Routes, JWT Authentication
**Database:** CouchDB (NoSQL)
**Payment:** M-Pesa, Stripe
**Storage:** Local/AWS S3/Cloudinary


## 🔐 Authentication & Security

- **JWT-based authentication** with refresh tokens
- **Role-based access control** (user, business_owner, admin)
- **Account security** (login attempts, lockout, MFA)
- **API security** (rate limiting, CORS, validation)
- **Audit logging** for all security events

## 🗄️ Database (CouchDB)

**Document Types:**
- Users, Businesses, Subscriptions, Reviews, Events, Bookings
- Security audits, Sessions

**Features:**
- NoSQL document storage
- Built-in replication and clustering
- REST API integration
- Geospatial queries for location-based search

## 💳 Subscription System

**Plans:** Starter (Free), Professional (KES 3,900/month), Enterprise (KES 9,900/month)

**Features:**
- Business listings, photo uploads, digital menus
- Appointment booking, analytics, API access
- Usage tracking and limits enforcement
- M-Pesa and Stripe payment integration

## 🔧 Environment Configuration

Single `.env.local` file contains all configuration:

```bash
# Critical (pre-generated secure values)
JWT_SECRET=mK8vN2pQ7rS9tU1wX4yZ6aB3cD5eF8gH...
SECURITY_VALIDATION_TOKEN=dev_validation_token_2024_secure...
COUCHDB_PASSWORD=dev_couchdb_password_2024_secure

# Add your API keys
SENDGRID_API_KEY=your_sendgrid_key
MPESA_CONSUMER_KEY=your_mpesa_key
GOOGLE_MAPS_API_KEY=your_maps_key
```

## 📡 API Endpoints

**Authentication:**
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Token refresh

**Business:**
- `GET /api/businesses` - Search businesses
- `POST /api/businesses` - Create business
- `GET /api/businesses/[id]` - Get business details
- `PUT /api/businesses/[id]` - Update business

**Subscription:**
- `POST /api/subscription/validate` - Validate feature access
- `POST /api/subscription/upgrade` - Upgrade plan

## 🛠️ Development

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm run type-check

# Linting
pnpm lint
```

## 🚀 Deployment

1. **Environment Setup:**
   ```bash
   # Generate production secrets
   node scripts/setup-env.js production
   ```

2. **CouchDB Setup:**
   ```bash
   # Follow COUCHDB_SETUP_GUIDE.md
   docker-compose up -d
   ```

3. **Build & Deploy:**
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```

## 📚 Documentation

- **[CouchDB Setup Guide](COUCHDB_SETUP_GUIDE.md)** - Database setup and configuration
- **[API Documentation](API_DOCUMENTATION.md)** - Complete REST API reference
- **[Environment Setup](ENVIRONMENT_SETUP.md)** - Environment configuration guide

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Demo Accounts:**
- User: `user@example.com` / `secret123`
- Business: `business@example.com` / `secret123`
- Admin: `admin@example.com` / `secret123`

Built with ❤️ for Kenyan communities
