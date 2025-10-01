# TriAgro AI Database Setup Guide

This guide walks you through setting up PostgreSQL database for the TriAgro AI agricultural data management system.

## Prerequisites

### 1. Install PostgreSQL

**Windows:**

- Download and install PostgreSQL from https://www.postgresql.org/download/windows/
- During installation, remember the password you set for the `postgres` user
- Make sure to install pgAdmin (PostgreSQL GUI) if you want a visual interface

**macOS:**

```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Or using PostgreSQL.app
# Download from https://postgresapp.com/
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

Connect to PostgreSQL as the postgres superuser:

```bash
# Windows (if PostgreSQL is in PATH)
psql -U postgres

# macOS/Linux
sudo -u postgres psql
```

Create the database and user:

```sql
-- Create user
CREATE USER triagro_user WITH PASSWORD 'triagro_password';

-- Create database
CREATE DATABASE triagro_ai OWNER triagro_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE triagro_ai TO triagro_user;

-- Connect to the database to grant schema privileges
\c triagro_ai;
GRANT ALL ON SCHEMA public TO triagro_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO triagro_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO triagro_user;

-- Exit psql
\q
```

### 3. Configure Environment Variables

Update your `.env` file with the database configuration:

```env
# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=triagro_ai
DB_USER=triagro_user
DB_PASSWORD=triagro_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Database Migration

### 1. Run Database Migrations

Execute the database setup command:

```bash
# Run all pending migrations
npm run migrate

# Or check migration status
npm run migrate:status

# Or run specific migration script directly
node scripts/migrate-database.js
```

### 2. Verify Database Setup

After running migrations, you should see output similar to:

```
🟢 Database connected successfully
✅ Migration tracking table initialized
📋 Found 2 pending migration(s):
   - 001_initial_schema.sql
   - 002_seed_reference_data.sql
🔄 Executing migration: 001_initial_schema.sql
✅ Migration 001_initial_schema.sql completed in 1250ms
🔄 Executing migration: 002_seed_reference_data.sql
✅ Migration 002_seed_reference_data.sql completed in 850ms
🎉 Successfully executed 2 migration(s)

📊 Migration Status:
────────────────────────────────────────────────────────────────────────────────
Migration File                          Status    Executed At         Time
────────────────────────────────────────────────────────────────────────────────
001_initial_schema.sql                   ✅        2025-01-05 10:30:15 1250ms
002_seed_reference_data.sql              ✅        2025-01-05 10:30:17 850ms
────────────────────────────────────────────────────────────────────────────────
```

### 3. Test Database Connection

Start the new database-enabled server:

```bash
node auth-server-v2.js
```

You should see:

```
🟢 Database connected successfully
🟢 TriAgro AI Auth Server v2 - Database Ready
🚀 TriAgro AI Auth Server v2 running on port 3002
📊 Database: PostgreSQL
🔐 JWT Auth: Enabled
📁 File Upload: uploads
🌐 CORS: Enabled for local development

🎯 Endpoints:
   Authentication: POST /sign-in, POST /sign-up
   File Upload: POST /upload, /files/upload, /user/files/upload
   Agricultural Data: GET /api/crop-calendar, /api/production-calendar, etc.
   Admin: GET /admin/users, /admin/files
   Reference: GET /api/regions, /api/districts-detailed, /api/commodities
```

## Database Schema Overview

The database includes the following main tables:

### Core Tables

- **users**: User accounts and authentication
- **files**: Uploaded file tracking and metadata
- **agricultural_records**: Main agricultural data storage
- **user_sessions**: JWT token management (optional)

### Reference Data Tables

- **regions**: Ghana regions (Greater Accra, Ashanti, etc.)
- **districts**: Districts within each region
- **commodities**: Agricultural commodities (crops, livestock)
- **production_stages**: Production stages for different commodities

### Key Features

- **UUID primary keys** for security
- **JSONB fields** for flexible metadata storage
- **Full-text search** capabilities
- **Comprehensive indexes** for performance
- **Foreign key relationships** for data integrity
- **Audit trails** with created_at/updated_at timestamps

## Sample Data Included

The migration automatically creates:

### 1. Administrative User

- **Email**: admin@triagro-ai.com
- **Password**: admin123 (⚠️ **Change this in production!**)
- **Role**: super_admin

### 2. Reference Data

- **16 Regions** of Ghana with codes (REG01-REG16)
- **25+ Districts** including major metropolitan areas
- **32 Commodities** across categories:
  - Cereals (maize, rice, millet, sorghum)
  - Vegetables (tomato, pepper, onion, etc.)
  - Root/Tuber crops (cassava, yam, sweet potato)
  - Tree crops (cocoa, coffee, oil palm)
  - Legumes (beans, groundnut, soybean)
  - Livestock/Poultry (broiler, layer, cattle, etc.)
  - Fruits (mango, orange, pineapple)

### 3. Production Stages

- **17 Crop production stages** (Site Selection → Post-Harvest Handling)
- **5 Poultry production stages** (Brooding → Marketing)

## Testing the System

### 1. Test User Registration

```bash
curl -X POST http://localhost:3002/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "organization": "Test Org"
  }'
```

### 2. Test User Login

```bash
curl -X POST http://localhost:3002/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Test Data Retrieval

```bash
# Get regions
curl http://localhost:3002/api/regions

# Get districts
curl http://localhost:3002/api/districts-detailed

# Get commodities
curl http://localhost:3002/api/commodities

# Get agricultural records (crop calendar)
curl http://localhost:3002/api/crop-calendar
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```
🔴 Database connection failed: Connection refused
```

**Solutions:**

- Ensure PostgreSQL service is running
- Verify database credentials in `.env`
- Check if database and user exist
- Verify network connectivity (if using remote database)

#### 2. Migration Failed

```
❌ Migration 001_initial_schema.sql failed: relation already exists
```

**Solutions:**

- Check if tables already exist: `\dt` in psql
- Drop existing tables if testing: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
- Check migration status: `npm run migrate:status`

#### 3. Permission Denied

```
🔴 Database query error: permission denied for table users
```

**Solutions:**

- Grant proper permissions to triagro_user
- Ensure database owner is correct
- Re-run the user creation commands from step 2

### Database Management

#### View Database Contents

```bash
# Connect to database
psql -U triagro_user -d triagro_ai -h localhost

# List tables
\dt

# View table structure
\d users
\d agricultural_records

# Query data
SELECT * FROM regions LIMIT 5;
SELECT * FROM commodities WHERE category = 'cereal';
```

#### Backup Database

```bash
# Create backup
pg_dump -U triagro_user -h localhost triagro_ai > triagro_backup.sql

# Restore backup
psql -U triagro_user -h localhost triagro_ai < triagro_backup.sql
```

#### Reset Database (Development Only)

```sql
-- Connect as postgres superuser
DROP DATABASE triagro_ai;
DROP USER triagro_user;

-- Re-create (follow step 2 above)
```

## Production Deployment

### Security Checklist

1. **Change Default Passwords**

   - Database user password
   - JWT secret key
   - Admin user password

2. **Environment Variables**

   - Use strong, unique passwords
   - Store sensitive data in environment variables
   - Never commit secrets to version control

3. **Database Security**

   - Use SSL connections for remote databases
   - Restrict database user permissions
   - Enable database logging and monitoring
   - Regular security updates

4. **Network Security**
   - Configure firewall rules
   - Use VPN for database access
   - Restrict database port access

### Performance Optimization

1. **Database Tuning**

   - Configure PostgreSQL for your hardware
   - Set appropriate connection pool sizes
   - Monitor query performance
   - Add additional indexes as needed

2. **Application Optimization**
   - Use connection pooling
   - Implement caching for reference data
   - Optimize database queries
   - Monitor memory usage

## Next Steps

1. **Install and configure PostgreSQL** following the steps above
2. **Run database migrations** with `npm run migrate`
3. **Test the system** using the provided curl commands
4. **Start using the new auth-server-v2.js** instead of the old auth-server.js
5. **Update frontend services** to use the new API structure (next phase)

The database-enabled system provides a solid foundation for production use with proper data persistence, user management, and scalable agricultural data processing capabilities.
