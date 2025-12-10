# Database Setup Guide

## Overview

The project now uses **PostgreSQL** as a shared database for all DW servers, ensuring data synchronization across all instances.

## Architecture

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│   DW1   │  │   DW2   │  │   DW3   │
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     └────────────┴────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   PostgreSQL    │
         │   Database      │
         │  (Shared Data)  │
         └─────────────────┘
```

All DW servers connect to the same PostgreSQL database, so:
- ✅ Data created on DW1 is immediately visible on DW2 and DW3
- ✅ Updates on any server are reflected on all servers
- ✅ Deletes are consistent across all servers
- ✅ No data inconsistency issues

## Local Development Setup

### Option 1: Local PostgreSQL Installation

1. **Install PostgreSQL:**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Create Database:**
   ```bash
   createdb employees_db
   ```

3. **Update `.env` file:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=employees_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

4. **Start DW servers:**
   ```bash
   npm run dev:dw1
   npm run dev:dw2
   npm run dev:dw3
   ```

   The database schema will be created automatically on first startup.

### Option 2: Docker Compose (Recommended)

1. **Start all services (including PostgreSQL):**
   ```bash
   npm run docker:up
   ```

   This will:
   - Start PostgreSQL container
   - Start all DW servers
   - Start proxy server
   - Automatically configure database connections

2. **View logs:**
   ```bash
   npm run docker:logs
   ```

3. **Stop services:**
   ```bash
   npm run docker:down
   ```

## Database Schema

The `employees` table is created automatically with the following structure:

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_id ON employees(id);
```

## Environment Variables

### Required for Local Development

```env
DB_HOST=localhost          # Database host
DB_PORT=5432              # PostgreSQL port
DB_NAME=employees_db       # Database name
DB_USER=postgres          # Database user
DB_PASSWORD=postgres      # Database password
```

### Docker Compose

Database configuration is handled automatically:
- Host: `postgres` (service name)
- Port: `5432`
- Database: `employees_db`
- User: `postgres`
- Password: `postgres`

### Cloud Deployment

For Railway, Render, or other cloud platforms:

1. **Create PostgreSQL service** (managed database)
2. **Get connection string** from platform
3. **Set environment variables** for each DW service:
   ```env
   DB_HOST=your-db-host.railway.app
   DB_PORT=5432
   DB_NAME=railway
   DB_USER=postgres
   DB_PASSWORD=your-password
   ```

## Testing Data Synchronization

1. **Start all services:**
   ```bash
   npm run docker:up
   # OR
   npm run dev:dw1 & npm run dev:dw2 & npm run dev:proxy
   ```

2. **Create an employee:**
   ```bash
   curl -X POST http://localhost:8080/employees \
     -H "Content-Type: application/json" \
     -d '{"firstName": "John", "lastName": "Doe", "position": "Developer", "salary": 75000}'
   ```

3. **Fetch employees multiple times:**
   ```bash
   # Request 1 - might go to DW1
   curl "http://localhost:8080/employees?format=json"
   
   # Request 2 - might go to DW2
   curl "http://localhost:8080/employees?format=json"
   
   # Request 3 - might go to DW3
   curl "http://localhost:8080/employees?format=json"
   ```

4. **Result:** All requests return the same employee, regardless of which DW server handles the request!

## Troubleshooting

### Database Connection Failed

**Error:** `Database connection failed. Server will not start.`

**Solutions:**
1. Check PostgreSQL is running: `pg_isready` or `psql -U postgres`
2. Verify database exists: `psql -U postgres -l`
3. Check environment variables in `.env`
4. Check firewall/network settings

### Port Already in Use

**Error:** `Port 5432 is already in use`

**Solutions:**
1. Stop existing PostgreSQL instance
2. Change `DB_PORT` in `.env` to a different port
3. Update PostgreSQL configuration to use different port

### Permission Denied

**Error:** `permission denied for database employees_db`

**Solutions:**
1. Check database user has proper permissions
2. Verify password is correct
3. Create database with correct user: `createdb -U postgres employees_db`

### Table Already Exists

**Error:** `relation "employees" already exists`

**This is normal!** The initialization checks if the table exists before creating it. This error can be ignored, or you can drop and recreate:

```sql
DROP TABLE IF EXISTS employees;
```

Then restart the DW server.

## Migration from In-Memory to Database

If you had data in the old in-memory version:

1. **Export data** (if possible) from old version
2. **Start new version** with database
3. **Import data** using POST requests or SQL INSERT statements

The database starts empty by default, so you'll need to recreate any test data.

## Connection Pooling

The database module uses connection pooling for efficiency:

- **Max connections:** 20 per DW server
- **Idle timeout:** 30 seconds
- **Connection timeout:** 2 seconds

This allows multiple concurrent requests to share database connections efficiently.

## Next Steps

- ✅ Database synchronization is working
- ✅ All DW servers share the same data
- ✅ No more data inconsistency issues
- ✅ Ready for production deployment

For cloud deployment, use a managed PostgreSQL service (Railway, Render, AWS RDS, etc.) and configure connection strings in environment variables.

