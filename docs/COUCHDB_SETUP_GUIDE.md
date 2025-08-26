# CouchDB Setup Guide for Mtaani Platform

## Overview

This guide provides comprehensive instructions for setting up CouchDB for the Mtaani platform with a focus on scalability, security, and optimal performance for NoSQL document storage.

## Table of Contents

1. [Installation & Basic Setup](#installation--basic-setup)
2. [Security Configuration](#security-configuration)
3. [Database Design](#database-design)
4. [Indexes & Views](#indexes--views)
5. [Replication & Clustering](#replication--clustering)
6. [Performance Optimization](#performance-optimization)
7. [Backup & Recovery](#backup--recovery)
8. [Monitoring & Maintenance](#monitoring--maintenance)

## Installation & Basic Setup

### 1. Docker Installation (Recommended)

```bash
# Create CouchDB directory structure
mkdir -p ~/couchdb/{data,config,logs}

# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'

services:
  couchdb:
    image: couchdb:3.3
    container_name: mtaani-couchdb
    hostname: couchdb
    restart: unless-stopped
    ports:
      - "5984:5984"
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=secure_admin_password_2024
      - COUCHDB_SECRET=your_secret_key_here_32_chars_min
      - NODENAME=couchdb
    volumes:
      - ./couchdb/data:/opt/couchdb/data
      - ./couchdb/config:/opt/couchdb/etc/local.d
      - ./couchdb/logs:/opt/couchdb/var/log
    networks:
      - mtaani-network

networks:
  mtaani-network:
    driver: bridge
EOF

# Start CouchDB
docker-compose up -d
```

### 3. Initial Configuration

```bash
# Access CouchDB Fauxton (Web Interface)
# http://localhost:5984/_utils

# Or via curl
curl -X GET http://admin:password@localhost:5984/

# Create the main database
curl -X PUT http://admin:password@localhost:5984/mtaani
```

## Security Configuration

### 1. Authentication & Authorization

```javascript
// Set up database security
PUT /mtaani/_security
{
  "admins": {
    "names": ["admin"],
    "roles": ["_admin"]
  },
  "members": {
    "names": [],
    "roles": ["mtaani_user", "mtaani_business", "mtaani_admin"]
  }
}
```

### 2. User Management

```javascript
// Create application users
PUT /_users/org.couchdb.user:mtaani_app
{
  "_id": "org.couchdb.user:mtaani_app",
  "name": "mtaani_app",
  "type": "user",
  "roles": ["mtaani_user"],
  "password": "secure_app_password"
}

// Create admin user
PUT /_users/org.couchdb.user:mtaani_admin
{
  "_id": "org.couchdb.user:mtaani_admin",
  "name": "mtaani_admin",
  "type": "user",
  "roles": ["mtaani_admin", "_admin"],
  "password": "secure_admin_password"
}
```

### 3. SSL/TLS Configuration

```ini
# /opt/couchdb/etc/local.d/ssl.ini
[ssl]
enable = true
cert_file = /path/to/certificate.pem
key_file = /path/to/private_key.pem
ca_file = /path/to/ca_certificate.pem

[httpsd]
port = 6984
bind_address = 0.0.0.0
```

### 4. CORS Configuration

```ini
# /opt/couchdb/etc/local.d/cors.ini
[httpd]
enable_cors = true

[cors]
origins = https://mtaani.com, https://www.mtaani.com, http://localhost:3000
credentials = true
methods = GET, PUT, POST, HEAD, DELETE
headers = accept, authorization, content-type, origin, referer, x-csrf-token
```

## Database Design

### 1. Document Structure

All documents follow this base structure:

```javascript
{
  "_id": "type:identifier",
  "_rev": "1-abc123...",
  "type": "user|business|subscription|review|event|booking|security_audit|session",
  "version": 1,
  "isDeleted": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "createdBy": "user_id",
  "updatedBy": "user_id",
  // Document-specific fields...
}
```

### 2. Document ID Conventions

```javascript
// User documents
"user:user@example.com"
"user:1234567890:abc123"

// Business documents
"business:user_id-business-name"
"business:1234567890:restaurant-name"

// Subscription documents
"subscription:user_id"
"subscription:1234567890"

// Review documents
"review:business_id:user_id:timestamp"

// Event documents
"event:organizer_id:timestamp:random"

// Booking documents
"booking:business_id:user_id:timestamp"

// Security audit documents
"security_audit:timestamp:random"

// Session documents
"session:user_id:session_id"
```

### 3. Validation Functions

```javascript
// Design document: _design/validation
{
  "_id": "_design/validation",
  "validate_doc_update": function(newDoc, oldDoc, userCtx) {
    // Require type field
    if (!newDoc.type) {
      throw({forbidden: "Document must have a type field"});
    }

    // Require timestamps
    if (!newDoc.createdAt || !newDoc.updatedAt) {
      throw({forbidden: "Document must have createdAt and updatedAt fields"});
    }

    // Prevent type changes
    if (oldDoc && oldDoc.type !== newDoc.type) {
      throw({forbidden: "Document type cannot be changed"});
    }

    // Version control
    if (oldDoc && newDoc.version <= oldDoc.version) {
      throw({forbidden: "Document version must be incremented"});
    }

    // Soft delete validation
    if (newDoc.isDeleted && !newDoc.deletedAt) {
      throw({forbidden: "Deleted documents must have deletedAt timestamp"});
    }

    // Type-specific validations
    if (newDoc.type === "user") {
      if (!newDoc.email || !newDoc.name || !newDoc.role) {
        throw({forbidden: "User documents must have email, name, and role"});
      }

      // Email format validation
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newDoc.email)) {
        throw({forbidden: "Invalid email format"});
      }
    }

    if (newDoc.type === "business") {
      if (!newDoc.ownerId || !newDoc.name || !newDoc.category) {
        throw({forbidden: "Business documents must have ownerId, name, and category"});
      }

      if (!newDoc.location || !newDoc.location.coordinates) {
        throw({forbidden: "Business documents must have location coordinates"});
      }
    }

    // Security: Only allow users to modify their own documents
    if (newDoc.type === "user" && userCtx.name !== newDoc.email && userCtx.roles.indexOf("_admin") === -1) {
      throw({forbidden: "Users can only modify their own documents"});
    }
  }
}
```

## Indexes & Views

### 1. Essential Indexes

```javascript
// Create indexes for common queries
POST /mtaani/_index
{
  "index": {
    "fields": ["type", "isDeleted"]
  },
  "name": "type-deleted-index",
  "type": "json"
}

POST /mtaani/_index
{
  "index": {
    "fields": ["type", "email"]
  },
  "name": "user-email-index",
  "type": "json"
}

POST /mtaani/_index
{
  "index": {
    "fields": ["type", "ownerId", "isDeleted"]
  },
  "name": "business-owner-index",
  "type": "json"
}

POST /mtaani/_index
{
  "index": {
    "fields": ["type", "category", "location.county", "status", "isDeleted"]
  },
  "name": "business-search-index",
  "type": "json"
}

POST /mtaani/_index
{
  "index": {
    "fields": ["type", "businessId", "status", "isDeleted"]
  },
  "name": "review-business-index",
  "type": "json"
}

// Geospatial index for location-based queries
POST /mtaani/_index
{
  "index": {
    "fields": ["type", "location.coordinates"]
  },
  "name": "geo-location-index",
  "type": "json"
}
```

### 2. Map-Reduce Views

```javascript
// Design document: _design/analytics
{
  "_id": "_design/analytics",
  "views": {
    "businesses_by_category": {
      "map": "function(doc) { if (doc.type === 'business' && !doc.isDeleted) { emit([doc.category, doc.location.county], 1); } }",
      "reduce": "_count"
    },
    "users_by_role": {
      "map": "function(doc) { if (doc.type === 'user' && !doc.isDeleted) { emit(doc.role, 1); } }",
      "reduce": "_count"
    },
    "reviews_by_rating": {
      "map": "function(doc) { if (doc.type === 'review' && !doc.isDeleted) { emit([doc.businessId, doc.rating], doc.rating); } }",
      "reduce": "_stats"
    },
    "subscriptions_by_plan": {
      "map": "function(doc) { if (doc.type === 'subscription' && !doc.isDeleted) { emit([doc.plan, doc.status], 1); } }",
      "reduce": "_count"
    },
    "events_by_date": {
      "map": "function(doc) { if (doc.type === 'event' && !doc.isDeleted) { emit(doc.schedule.startDate, 1); } }",
      "reduce": "_count"
    }
  }
}

// Design document: _design/business
{
  "_id": "_design/business",
  "views": {
    "by_owner": {
      "map": "function(doc) { if (doc.type === 'business' && !doc.isDeleted) { emit(doc.ownerId, doc); } }"
    },
    "by_category_and_location": {
      "map": "function(doc) { if (doc.type === 'business' && !doc.isDeleted && doc.status === 'active') { emit([doc.category, doc.location.county, doc.location.town], doc); } }"
    },
    "verified_businesses": {
      "map": "function(doc) { if (doc.type === 'business' && !doc.isDeleted && doc.verification.status === 'verified') { emit([doc.stats.rating, doc.stats.reviewCount], doc); } }"
    }
  }
}
```

## Replication & Clustering

### 1. Single Node to Cluster Migration

```bash
# Convert single node to cluster
curl -X POST http://admin:password@localhost:5984/_cluster_setup \
  -H "Content-Type: application/json" \
  -d '{"action": "enable_cluster", "bind_address":"0.0.0.0", "username": "admin", "password": "password", "node_count": "3"}'
```

### 2. Multi-Node Cluster Setup

```bash
# Node 1 (Primary)
docker run -d --name couchdb-node1 \
  -p 5984:5984 \
  -e COUCHDB_USER=admin \
  -e COUCHDB_PASSWORD=password \
  -e NODENAME=couchdb@node1.mtaani.local \
  -v couchdb1-data:/opt/couchdb/data \
  couchdb:3.3

# Node 2
docker run -d --name couchdb-node2 \
  -p 5985:5984 \
  -e COUCHDB_USER=admin \
  -e COUCHDB_PASSWORD=password \
  -e NODENAME=couchdb@node2.mtaani.local \
  -v couchdb2-data:/opt/couchdb/data \
  couchdb:3.3

# Node 3
docker run -d --name couchdb-node3 \
  -p 5986:5984 \
  -e COUCHDB_USER=admin \
  -e COUCHDB_PASSWORD=password \
  -e NODENAME=couchdb@node3.mtaani.local \
  -v couchdb3-data:/opt/couchdb/data \
  couchdb:3.3
```

### 3. Replication Configuration

```javascript
// Continuous replication for backup
PUT /_replicator/mtaani-backup
{
  "source": "mtaani",
  "target": "http://admin:password@backup-server:5984/mtaani-backup",
  "continuous": true,
  "create_target": true
}

// Filtered replication (only active documents)
PUT /_replicator/mtaani-active-only
{
  "source": "mtaani",
  "target": "mtaani-active",
  "continuous": true,
  "filter": "validation/active_only",
  "create_target": true
}
```

## Performance Optimization

### 1. Configuration Tuning

```ini
# /opt/couchdb/etc/local.d/performance.ini
[couchdb]
max_document_size = 4294967296
os_process_timeout = 5000
max_dbs_open = 500

[httpd]
max_connections = 2048
bind_address = 0.0.0.0

[query_servers]
javascript = /opt/couchdb/bin/couchjs /opt/couchdb/share/server/main.js

[compaction]
_default = [{db_fragmentation, "70%"}, {view_fragmentation, "60%"}]
```

### 2. Compaction Strategy

```bash
# Manual compaction
curl -X POST http://admin:password@localhost:5984/mtaani/_compact

# View compaction
curl -X POST http://admin:password@localhost:5984/mtaani/_compact/analytics

# Automatic compaction configuration
curl -X PUT http://admin:password@localhost:5984/mtaani/_config/compactions/_default \
  -d '"[{db_fragmentation, \"70%\"}, {view_fragmentation, \"60%\"}, {from, \"22:00\"}, {to, \"06:00\"}]"'
```

### 3. Monitoring Queries

```bash
# Database info
curl http://admin:password@localhost:5984/mtaani

# Active tasks
curl http://admin:password@localhost:5984/_active_tasks

# Database statistics
curl http://admin:password@localhost:5984/_stats
```

## Environment Variables

```bash
# .env.local
COUCHDB_HOST=localhost
COUCHDB_PORT=5984
COUCHDB_PROTOCOL=http
COUCHDB_USERNAME=mtaani_app
COUCHDB_PASSWORD=secure_app_password
COUCHDB_DATABASE=mtaani

# Production environment
COUCHDB_HOST=couchdb.mtaani.com
COUCHDB_PORT=6984
COUCHDB_PROTOCOL=https
COUCHDB_USERNAME=mtaani_prod
COUCHDB_PASSWORD=ultra_secure_production_password
COUCHDB_DATABASE=mtaani_prod
```

## Security Best Practices

1. **Always use HTTPS in production**
2. **Implement proper authentication and authorization**
3. **Use validation functions to enforce data integrity**
4. **Regular security audits and updates**
5. **Implement rate limiting and DDoS protection**
6. **Use strong passwords and rotate them regularly**
7. **Monitor access logs and set up alerts**
8. **Implement proper backup and disaster recovery**

## Scalability Considerations

1. **Horizontal scaling with clustering**
2. **Read replicas for improved performance**
3. **Proper indexing strategy**
4. **Document size optimization**
5. **Efficient query patterns**
6. **Caching layer (Redis) for frequently accessed data**
7. **CDN for static assets**
8. **Load balancing across cluster nodes**

## REST API Integration

### 1. CouchDB Client Configuration

```typescript
// lib/couchdb-config.ts
import { CouchDBClient } from './couchdb'

const config = {
  host: process.env.COUCHDB_HOST || 'localhost',
  port: parseInt(process.env.COUCHDB_PORT || '5984'),
  protocol: (process.env.COUCHDB_PROTOCOL as 'http' | 'https') || 'http',
  username: process.env.COUCHDB_USERNAME || 'admin',
  password: process.env.COUCHDB_PASSWORD || 'password',
  database: process.env.COUCHDB_DATABASE || 'mtaani',
  maxRetries: 3,
  timeout: 30000
}

export const couchdb = new CouchDBClient(config)
```

### 2. API Response Standards

All REST API responses follow this structure:

```typescript
// Success Response
{
  "success": true,
  "data": {
    // Response data
  },
  "message"?: string,
  "meta"?: {
    "total": number,
    "limit": number,
    "skip": number,
    "page": number
  }
}

// Error Response
{
  "success": false,
  "error": string,
  "details"?: any,
  "code"?: string
}
```

### 3. Serialization Best Practices

```typescript
// Document serialization for API responses
function serializeDocument<T extends CouchDBDocument>(doc: T): any {
  const serialized = { ...doc }

  // Remove CouchDB internal fields from public API
  delete serialized._rev

  // Rename _id to id for frontend consistency
  if (serialized._id) {
    serialized.id = serialized._id
    delete serialized._id
  }

  // Remove sensitive fields
  if (serialized.type === 'user') {
    delete serialized.passwordHash
    delete serialized.security?.twoFactorSecret
    delete serialized.emailVerificationToken
    delete serialized.passwordResetToken
  }

  // Format dates consistently
  if (serialized.createdAt) {
    serialized.createdAt = new Date(serialized.createdAt).toISOString()
  }

  if (serialized.updatedAt) {
    serialized.updatedAt = new Date(serialized.updatedAt).toISOString()
  }

  return serialized
}
```

### 4. Pagination Implementation

```typescript
// Pagination helper
interface PaginationOptions {
  limit?: number
  skip?: number
  page?: number
}

function getPaginationParams(options: PaginationOptions) {
  const limit = Math.min(options.limit || 20, 100) // Max 100 items
  const page = Math.max(options.page || 1, 1)
  const skip = options.skip || (page - 1) * limit

  return { limit, skip, page }
}

// Usage in API endpoints
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const { limit, skip, page } = getPaginationParams({
    limit: parseInt(searchParams.get('limit') || '20'),
    page: parseInt(searchParams.get('page') || '1')
  })

  const result = await couchdb.find('mtaani', selector, { limit, skip })

  return NextResponse.json({
    success: true,
    data: result.docs.map(serializeDocument),
    meta: {
      total: result.docs.length,
      limit,
      skip,
      page,
      hasMore: result.docs.length === limit
    }
  })
}
```

## Backup & Recovery

### 1. Automated Backup Script

```bash
#!/bin/bash
# backup-couchdb.sh

BACKUP_DIR="/backups/couchdb"
DATE=$(date +%Y%m%d_%H%M%S)
COUCHDB_URL="http://admin:password@localhost:5984"
DATABASE="mtaani"

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup database
curl -X GET "$COUCHDB_URL/$DATABASE/_all_docs?include_docs=true" > "$BACKUP_DIR/$DATE/$DATABASE.json"

# Backup design documents
curl -X GET "$COUCHDB_URL/$DATABASE/_all_docs?startkey=\"_design/\"&endkey=\"_design0\"&include_docs=true" > "$BACKUP_DIR/$DATE/design_docs.json"

# Compress backup
tar -czf "$BACKUP_DIR/$DATABASE-$DATE.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_DIR/$DATE"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATABASE-$DATE.tar.gz"
```

### 2. Recovery Script

```bash
#!/bin/bash
# restore-couchdb.sh

BACKUP_FILE="$1"
COUCHDB_URL="http://admin:password@localhost:5984"
DATABASE="mtaani"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.tar.gz>"
    exit 1
fi

# Extract backup
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Recreate database
curl -X DELETE "$COUCHDB_URL/$DATABASE"
curl -X PUT "$COUCHDB_URL/$DATABASE"

# Restore documents
curl -X POST "$COUCHDB_URL/$DATABASE/_bulk_docs" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_DIR"/*/"$DATABASE.json"

# Restore design documents
curl -X POST "$COUCHDB_URL/$DATABASE/_bulk_docs" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_DIR"/*/design_docs.json

# Cleanup
rm -rf "$TEMP_DIR"

echo "Database restored from $BACKUP_FILE"
```

## Monitoring & Maintenance

### 1. Health Check Endpoint

```typescript
// app/api/health/couchdb/route.ts
import { couchdb } from '@/lib/couchdb'

export async function GET() {
  try {
    // Check CouchDB connection
    const dbExists = await couchdb.databaseExists('mtaani')

    if (!dbExists) {
      return NextResponse.json({
        status: 'unhealthy',
        error: 'Database not found'
      }, { status: 503 })
    }

    // Check database stats
    const stats = await couchdb.request('GET', '/mtaani')

    return NextResponse.json({
      status: 'healthy',
      database: {
        name: stats.db_name,
        docCount: stats.doc_count,
        updateSeq: stats.update_seq,
        diskSize: stats.disk_size,
        dataSize: stats.data_size
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 503 })
  }
}
```

### 2. Performance Monitoring

```bash
# Monitor CouchDB performance
curl -s http://admin:password@localhost:5984/_stats | jq '.'

# Database fragmentation check
curl -s http://admin:password@localhost:5984/mtaani | jq '.disk_size, .data_size'

# Active tasks monitoring
curl -s http://admin:password@localhost:5984/_active_tasks | jq '.'
```

This setup provides a robust, scalable, and secure CouchDB foundation for the Mtaani platform with proper document structure, indexing, security measures, and comprehensive REST API integration optimized for NoSQL document serialization.
