# Web Proxy: Transparența în Distribuire

**Distributed Systems Lab Project** - A reverse smart proxy with caching and load balancing that demonstrates transparency in distribution.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [How the Application Works](#how-the-application-works)
4. [Synchronization Explained](#synchronization-explained)
5. [File Structure & Documentation](#file-structure--documentation)
6. [Quick Start](#quick-start)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## 🎯 Project Overview

This project implements a **distributed web proxy system** with two main components:

### Stage 1: Data Warehouse (DW) Servers
- **Purpose**: Backend servers that store and manage employee data
- **Features**: Full CRUD operations (Create, Read, Update, Delete)
- **Protocol**: HTTP with JSON/XML response format support
- **Storage**: PostgreSQL database (shared by all DW servers for data synchronization)

### Stage 2: Reverse Smart Proxy
- **Purpose**: Single entry point for clients, hiding the distributed backend
- **Features**: 
  - Load balancing (Round-Robin algorithm)
  - Response caching with TTL
  - Cache invalidation on write operations
  - Request metrics and monitoring

### Key Concept: Transparency in Distribution
Clients interact **only** with the proxy server. They don't need to know:
- How many DW servers exist
- Which server handles their request
- How requests are distributed
- How caching works

The proxy abstracts all this complexity, making the distributed system appear as a single, unified service.

---

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ HTTP Request
       │ (GET /employees?format=json)
       ▼
┌─────────────────────────────────────┐
│      Reverse Proxy Server           │
│      (Port 8080)                    │
│                                      │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   Cache      │  │ Load Balancer│ │
│  │  (TTL: 30s)  │  │ (Round-Robin)│ │
│  └──────────────┘  └──────────────┘ │
└──────┬───────────────────┬──────────┘
       │                   │
       │ Forward Request   │
       │                   │
       ▼                   ▼
┌──────────┐      ┌──────────┐      ┌──────────┐
│   DW1    │      │   DW2    │      │   DW3    │
│ Port 3001│      │ Port 3002│      │ Port 3003│
│          │      │          │      │          │
│          │      │          │      │          │
└─────┬────┘      └─────┬────┘      └─────┬────┘
      │                 │                 │
      └─────────────────┴─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   PostgreSQL    │
              │   Database      │
              │  (Shared Data)  │
              └─────────────────┘
```

### Component Interaction Flow

1. **Client** → Sends HTTP request to proxy (e.g., `GET /employees`)
2. **Proxy** → Checks cache (if GET request)
3. **Proxy** → If cache miss, load balancer selects next DW server
4. **Proxy** → Forwards request to selected DW server
5. **DW Server** → Processes request, returns response
6. **Proxy** → Caches response (if GET and successful)
7. **Proxy** → Returns response to client

---

## 🔄 How the Application Works

### Request Flow: GET Request (Read Operation)

```
1. Client Request
   └─> GET http://localhost:8080/employees?format=json

2. Proxy Receives Request
   └─> Checks cache for key: "GET:/employees?format=json"
   └─> Cache MISS → Continue to step 3
   └─> Cache HIT → Return cached response immediately (skip steps 3-6)

3. Load Balancer Selection
   └─> Round-Robin algorithm selects next server
   └─> Example: DW1 (index 0) → DW2 (index 1) → DW3 (index 2) → DW1 (index 0)

4. Proxy Forwards Request
   └─> GET http://localhost:3001/employees?format=json
   └─> Uses axios to make HTTP request

5. DW Server Processing
   └─> Express route handler receives request
   └─> EmployeeService.getAll() retrieves employees from in-memory array
   └─> Formatter converts data to JSON/XML
   └─> Returns HTTP 200 with response body

6. Proxy Receives Response
   └─> Caches response (key: "GET:/employees?format=json", TTL: 30s)
   └─> Adds CORS headers
   └─> Returns response to client

7. Client Receives Response
   └─> JSON/XML data with employee list
```

### Request Flow: POST Request (Create Operation)

```
1. Client Request
   └─> POST http://localhost:8080/employees
   └─> Body: { "firstName": "John", "lastName": "Doe", ... }

2. Proxy Receives Request
   └─> Identifies as write operation (POST)
   └─> Invalidates cache entries matching "/employees"
   └─> Load balancer selects next DW server

3. Proxy Forwards Request
   └─> POST http://localhost:3002/employees
   └─> Forwards request body

4. DW Server Processing
   └─> EmployeeService.create() adds new employee to in-memory array
   └─> Returns HTTP 201 with created employee

5. Proxy Receives Response
   └─> Does NOT cache (POST is not cacheable)
   └─> Returns response to client

6. Client Receives Response
   └─> New employee data with assigned ID
```

### Caching Strategy

**Cacheable Requests:**
- ✅ GET requests only
- ✅ Successful responses (HTTP 200)
- ✅ Cached for TTL duration (default: 30 seconds)

**Cache Invalidation:**
- 🔄 POST /employees → Invalidates all `/employees` cache entries
- 🔄 PUT /employees/:id → Invalidates all `/employees` cache entries
- 🔄 DELETE /employees/:id → Invalidates all `/employees` cache entries

**Cache Key Format:**
```
METHOD:PATH?query
Example: "GET:/employees?format=json"
Example: "GET:/employees?format=xml"
```

**Why Separate Cache Keys for JSON/XML?**
- JSON and XML responses have different structures
- Same endpoint can return different formats
- Cache must store both formats separately

### Load Balancing Strategy

**Algorithm: Round-Robin**

```
Request 1 → DW1 (index 0)
Request 2 → DW2 (index 1)
Request 3 → DW3 (index 2)
Request 4 → DW1 (index 0) ← Cycles back
Request 5 → DW2 (index 1)
...
```

**Benefits:**
- Even distribution of requests
- Simple to implement
- Predictable behavior
- Works well for stateless requests

**Limitations:**
- Doesn't consider server load
- Doesn't consider server health
- Doesn't consider response time

---

## 🔄 Synchronization Explained

### ✅ Data IS Synchronized Between DW Servers

**Current Implementation:**
- All DW servers connect to the **same PostgreSQL database**
- Data created on any DW server is **immediately visible** to all other DW servers
- All servers read/write to the same shared database
- Data consistency is guaranteed across all servers

### How It Works

```
1. Client creates employee via proxy
   └─> POST /employees → Load balancer selects DW1
   └─> DW1 inserts employee into PostgreSQL database
   └─> Proxy cache invalidated

2. Client fetches employees via proxy
   └─> GET /employees → Load balancer selects DW2
   └─> DW2 queries PostgreSQL database
   └─> Returns employee created by DW1 ✅
   └─> Client sees the employee (data is synchronized!)

3. Client fetches employees again
   └─> GET /employees → Load balancer selects DW3
   └─> DW3 queries PostgreSQL database
   └─> Returns same employee ✅
   └─> Data is consistent across all servers!
```

### Database Architecture

**PostgreSQL Database:**
- Single shared database instance
- All DW servers connect to the same database
- Connection pooling for efficient resource usage
- Automatic schema initialization on startup

**Table Structure:**
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
```

### Synchronization Benefits

| Operation | What Happens | Data Consistency |
|-----------|-------------|------------------|
| Create on DW1 | Stored in PostgreSQL | ✅ Immediately visible on DW2/DW3 |
| Read from DW1 | Queries PostgreSQL | ✅ Same data as DW2/DW3 |
| Read from DW2 | Queries PostgreSQL | ✅ Same data as DW1/DW3 |
| Update on DW3 | Updates PostgreSQL | ✅ Change visible on DW1/DW2 |
| Delete on DW1 | Deletes from PostgreSQL | ✅ Removed from all servers |
| Cache Invalidation | Clears proxy cache | ✅ Works correctly |
| Load Balancing | Distributes requests | ✅ All servers return same data |

### Database Configuration

**Environment Variables:**
```env
DB_HOST=localhost          # Database host (use 'postgres' in Docker)
DB_PORT=5432              # PostgreSQL port
DB_NAME=employees_db       # Database name
DB_USER=postgres          # Database user
DB_PASSWORD=postgres      # Database password
```

**Connection Pooling:**
- Each DW server maintains a connection pool
- Multiple concurrent requests share connections efficiently
- Automatic connection management and error recovery

### Testing Data Synchronization

1. **Create employee via proxy:**
   ```bash
   curl -X POST http://localhost:8080/employees \
     -H "Content-Type: application/json" \
     -d '{"firstName": "John", "lastName": "Doe", "position": "Developer", "salary": 75000}'
   ```

2. **Fetch from different servers (via proxy load balancing):**
   ```bash
   # Request 1 - might go to DW1
   curl "http://localhost:8080/employees?format=json"
   
   # Request 2 - might go to DW2
   curl "http://localhost:8080/employees?format=json"
   
   # Request 3 - might go to DW3
   curl "http://localhost:8080/employees?format=json"
   ```

3. **Result:** All requests return the same employee data, regardless of which DW server handles the request!

### Database Setup

**Local Development:**
- Install PostgreSQL locally
- Create database: `createdb employees_db`
- Update `.env` with database credentials

**Docker Deployment:**
- PostgreSQL service included in `docker-compose.yml`
- Database automatically created and initialized
- All DW servers connect to `postgres:5432`

**Cloud Deployment:**
- Use managed PostgreSQL service (Railway, Render, AWS RDS, etc.)
- Set database connection string in environment variables
- All DW servers use the same connection string

---

## 📁 File Structure & Documentation

### Root Directory

```
laborator3/
├── src/                    # TypeScript source code
├── public/                 # Static web interface files
├── dist/                   # Compiled JavaScript (generated)
├── node_modules/           # Dependencies (generated)
├── package.json            # Project configuration and scripts
├── tsconfig.json           # TypeScript compiler configuration
├── .env                    # Environment variables (not in git)
├── .gitignore              # Git ignore rules
├── Dockerfile              # Docker image for proxy
├── Dockerfile.dw           # Docker image for DW servers
├── docker-compose.yml      # Docker orchestration
└── README.md               # This file
```

### Source Code Structure (`src/`)

#### `src/proxy/` - Reverse Proxy Server

**`proxyServer.ts`** - Main proxy server
- **Purpose**: HTTP server that receives client requests and forwards them to DW servers
- **Responsibilities**:
  - Listens on port 8080 (configurable)
  - Handles all incoming HTTP requests
  - Serves static files (web interface)
  - Forwards requests to DW servers via load balancer
  - Manages caching (get/set/invalidate)
  - Tracks metrics (request count, cache hits/misses, response times)
  - Adds CORS headers for web interface
- **Key Functions**:
  - `handleRequest()` - Main request handler
  - `forwardRequest()` - Forwards request to DW server using axios
  - `serveStaticFile()` - Serves HTML/CSS/JS files from `public/` folder
  - `addCORSHeaders()` - Adds CORS headers to responses
- **Dependencies**: `cache.ts`, `loadBalancer.ts`, `axios`, `http`, `fs`, `path`

**`cache.ts`** - In-memory cache implementation
- **Purpose**: Stores HTTP responses to improve performance
- **Responsibilities**:
  - Stores GET request responses with TTL
  - Generates cache keys from method + URL + query params
  - Checks if entries are expired
  - Invalidates entries on write operations
  - Provides cache statistics
- **Key Methods**:
  - `get(method, url)` - Retrieves cached response if available and not expired
  - `set(method, url, body, headers, statusCode)` - Stores response in cache
  - `invalidate(pattern)` - Removes cache entries matching pattern
  - `clear()` - Removes all cache entries
  - `getStats()` - Returns cache size and keys
- **Data Structure**: `Map<string, CacheEntry>` where key is `"METHOD:PATH?query"`

**`loadBalancer.ts`** - Round-Robin load balancer
- **Purpose**: Distributes requests across multiple DW servers
- **Responsibilities**:
  - Maintains list of DW server URLs
  - Tracks current server index
  - Selects next server using Round-Robin algorithm
  - Provides server list for metrics
- **Key Methods**:
  - `getNextServer()` - Returns next server URL and increments index
  - `getServers()` - Returns all configured servers
  - `getCurrentIndex()` - Returns current index (for metrics)
- **Algorithm**: `currentIndex = (currentIndex + 1) % servers.length`

**`types.ts`** - TypeScript type definitions
- **Purpose**: Defines interfaces for proxy components
- **Types**:
  - `CacheEntry` - Structure of cached response (body, headers, statusCode, timestamps)
  - `ProxyMetrics` - Metrics structure (totalRequests, cacheHits, cacheMisses, etc.)
  - `LoadBalancerConfig` - Configuration for load balancer (servers array, algorithm)

#### `src/warehouse/` - Data Warehouse Servers

**`dwServer.ts`** - DW HTTP server
- **Purpose**: Express server that handles CRUD operations for employees
- **Responsibilities**:
  - Listens on configurable port (3001, 3002, 3003, or Railway's PORT)
  - Parses command line arguments (`--port`, `--server-id`)
  - Reads environment variables (`PORT`, `SERVER_ID`)
  - Mounts employee routes
  - Provides health check endpoint (`/health`)
  - Handles errors and uncaught exceptions
- **Key Features**:
  - Binds to `0.0.0.0` (not `localhost`) for cloud deployment compatibility
  - Supports both local development and cloud deployment
  - Logs server configuration on startup
- **Dependencies**: `express`, `employeeRoutes.ts`, `logger.ts`

**`routes/employeeRoutes.ts`** - Express route handlers
- **Purpose**: Defines HTTP endpoints for employee CRUD operations
- **Endpoints**:
  - `GET /employees` - Get all employees (supports pagination, format)
  - `GET /employees/:id` - Get single employee by ID
  - `POST /employees` - Create new employee
  - `PUT /employees/:id` - Update existing employee
  - `DELETE /employees/:id` - Delete employee
  - `GET /update/employees` - Get update count (for testing)
- **Responsibilities**:
  - Parses query parameters (format, offset, limit)
  - Parses request body (for POST/PUT)
  - Calls `employeeService` methods
  - Formats response as JSON or XML
  - Sets appropriate HTTP status codes
  - Handles errors and returns error responses
- **Dependencies**: `employeeService.ts`, `formatters.ts`, `httpUtils.ts`

**`services/employeeService.ts`** - Business logic layer
- **Purpose**: Implements CRUD operations for employees
- **Storage**: PostgreSQL database (shared by all DW servers)
- **Responsibilities**:
  - Manages employee data (create, read, update, delete)
  - Executes SQL queries against PostgreSQL
  - Maps database rows to Employee objects
  - Provides pagination support
  - Returns employee count
- **Key Methods** (all async):
  - `getAll(offset, limit)` - Returns paginated employee list from database
  - `getById(id)` - Returns single employee or null from database
  - `create(dto)` - Inserts new employee into database (auto-generated ID)
  - `update(id, dto)` - Updates existing employee in database
  - `delete(id)` - Deletes employee from database
  - `getCount()` - Returns total employee count from database
- **Important**: All DW servers share the same database, ensuring data synchronization

**`database/db.ts`** - Database connection module
- **Purpose**: Manages PostgreSQL database connections and schema
- **Responsibilities**:
  - Creates connection pool for efficient database access
  - Initializes database schema (creates `employees` table if needed)
  - Provides query execution functions
  - Handles connection errors and graceful shutdown
- **Key Functions**:
  - `query(text, params?)` - Execute SQL query with parameters
  - `getClient()` - Get a client from the connection pool
  - `initializeDatabase()` - Create tables and indexes
  - `testConnection()` - Verify database connectivity
  - `closePool()` - Close all database connections
- **Connection Pooling**: Uses `pg.Pool` for efficient connection management
- **Auto-initialization**: Schema is created automatically on first startup

**`models/employee.ts`** - Data models and DTOs
- **Purpose**: Defines TypeScript interfaces for employee data
- **Types**:
  - `Employee` - Full employee object (id, firstName, lastName, position, salary, timestamps)
  - `CreateEmployeeDTO` - Data for creating employee (no id, no timestamps)
  - `UpdateEmployeeDTO` - Partial data for updating employee (all fields optional)

#### `src/shared/` - Shared Utilities

**`logger.ts`** - Logging utility
- **Purpose**: Provides consistent logging across all services
- **Methods**:
  - `logger.info(message, data?)` - Info level logs
  - `logger.warn(message, data?)` - Warning level logs
  - `logger.error(message, data?)` - Error level logs
  - `logger.debug(message, data?)` - Debug level logs (only in development)
- **Format**: JSON-structured logs with timestamps
- **Usage**: All services use this logger for consistent log format

**`httpUtils.ts`** - HTTP helper functions
- **Purpose**: Utility functions for parsing HTTP requests
- **Functions**:
  - `parseQuery(url)` - Parses query string into object
  - `getResponseFormat(query)` - Determines format (json/xml) from query params
  - `getContentType(format)` - Returns Content-Type header for format
  - `parseRequestBody(body)` - Parses JSON request body
- **Usage**: Used by route handlers to parse requests

**`formatters.ts`** - Response formatters
- **Purpose**: Converts JavaScript objects to JSON or XML strings
- **Functions**:
  - `formatJSON(data)` - Converts object to JSON string (pretty-printed)
  - `formatXML(data)` - Converts object to XML string using `xml2js.Builder`
  - `formatResponse(data, format)` - Wrapper that calls formatJSON or formatXML
- **Dependencies**: `xml2js` library for XML generation
- **Usage**: Used by route handlers to format responses

### Static Files (`public/`)

**`index.html`** - Web interface for testing
- **Purpose**: Simple HTML/CSS/JavaScript interface for testing CRUD operations
- **Features**:
  - Form to create new employees
  - Table to display employee list
  - Buttons to edit/delete employees
  - Format selector (JSON/XML)
  - Auto-detects proxy URL (works for localhost and Railway)
  - Handles both JSON and XML responses
- **JavaScript Functions**:
  - `loadEmployees()` - Fetches and displays employees
  - `createEmployee()` - Creates new employee via POST
  - `editEmployee(id)` - Opens edit form
  - `updateEmployee(id)` - Updates employee via PUT
  - `deleteEmployee(id)` - Deletes employee via DELETE
  - `parseXML(xmlText)` - Parses XML response
  - `extractEmployeesFromXML(parsed)` - Extracts employee array from XML
- **Auto-Detection**: Uses `window.location.origin` to detect proxy URL automatically

### Configuration Files

**`package.json`** - Project configuration
- **Scripts**:
  - `build` - Compiles TypeScript to JavaScript
  - `dev:dw1`, `dev:dw2`, `dev:dw3` - Run DW servers in development mode (hot reload)
  - `dev:proxy` - Run proxy in development mode (hot reload)
  - `start:dw1`, `start:dw2`, `start:proxy` - Run servers in production mode
  - `docker:build`, `docker:up`, `docker:down`, `docker:logs` - Docker commands
- **Dependencies**:
  - `express` - HTTP server framework for DW servers
  - `axios` - HTTP client for proxy to forward requests
  - `xml2js` - XML parsing and generation
  - `dotenv` - Environment variable loading
- **DevDependencies**:
  - `typescript` - TypeScript compiler
  - `ts-node-dev` - Development server with hot reload
  - `@types/*` - TypeScript type definitions

**`tsconfig.json`** - TypeScript configuration
- **Compiler Options**:
  - `target: "ES2020"` - Modern JavaScript features
  - `module: "commonjs"` - Node.js module system
  - `outDir: "./dist"` - Output directory for compiled JS
  - `rootDir: "./src"` - Source directory
  - `strict: true` - Enable strict type checking
  - `esModuleInterop: true` - Enable ES module interop
- **Purpose**: Configures how TypeScript compiles to JavaScript

**`.env`** - Environment variables (not in git)
- **Variables**:
  - `PROXY_PORT` - Port for proxy server (default: 8080)
  - `DW_SERVERS` - Comma-separated list of DW server URLs
  - `CACHE_TTL_SECONDS` - Cache TTL in seconds (default: 30)
  - `NODE_ENV` - Environment (development/production)
- **Usage**: Loaded by `dotenv` package in proxy server

**`.gitignore`** - Git ignore rules
- **Ignored**:
  - `node_modules/` - Dependencies
  - `dist/` - Compiled JavaScript
  - `.env` - Environment variables (sensitive)
  - `*.log` - Log files
  - `*.tsbuildinfo` - TypeScript build info

### Docker Files

**`Dockerfile`** - Docker image for proxy server
- **Purpose**: Creates Docker image for proxy server
- **Stages**:
  1. Build stage: Install dependencies, compile TypeScript
  2. Production stage: Copy compiled code, run proxy server
- **Usage**: Used by `docker-compose.yml` to build proxy service

**`Dockerfile.dw`** - Docker image for DW servers
- **Purpose**: Creates Docker image for DW servers
- **Similar to `Dockerfile`** but runs DW server instead of proxy
- **Usage**: Used by `docker-compose.yml` to build DW services

**`docker-compose.yml`** - Docker orchestration
- **Purpose**: Defines and runs all services (proxy + 3 DW servers)
- **Services**:
  - `dw1`, `dw2`, `dw3` - Data warehouse servers
  - `proxy` - Reverse proxy server
- **Configuration**:
  - Build contexts and Dockerfiles
  - Port mappings
  - Environment variables
  - Network configuration
  - Dependencies (proxy depends on DWs)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **PostgreSQL** 12 or higher (for local development)
- (Optional) **Docker** and **Docker Compose** for containerized deployment

### Installation

1. **Clone or navigate to project directory:**
   ```bash
   cd laborator3
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build TypeScript (for production):**
   ```bash
   npm run build
   ```

### Running Locally

#### Development Mode (with hot reload)

**Terminal 1 - DW Server 1:**
```bash
npm run dev:dw1
```

**Terminal 2 - DW Server 2:**
```bash
npm run dev:dw2
```

**Terminal 3 - DW Server 3 (optional):**
```bash
npm run dev:dw3
```

**Terminal 4 - Proxy Server:**
```bash
npm run dev:proxy
```

#### Production Mode

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start servers:**
   ```bash
   npm run start:dw1
   npm run start:dw2
   npm run start:proxy
   ```

### Configuration

Create a `.env` file (copy from `.env.example`):

```env
# Proxy Configuration
PROXY_PORT=8080
DW_SERVERS=http://localhost:3001,http://localhost:3002,http://localhost:3003
CACHE_TTL_SECONDS=30

# Database Configuration (PostgreSQL)
# All DW servers connect to the same database for data synchronization
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employees_db
DB_USER=postgres
DB_PASSWORD=postgres

# Node Environment
NODE_ENV=development
```

**For Docker deployment:** Database configuration is handled automatically in `docker-compose.yml`.

---

## 🧪 Testing

### Web Interface (Recommended)

1. **Start the proxy server:**
   ```bash
   npm run dev:proxy
   ```

2. **Open browser:**
   ```
   http://localhost:8080
   ```

3. **Features:**
   - View all employees in a table
   - Create new employees
   - Edit existing employees
   - Delete employees
   - Switch between JSON and XML formats
   - Real-time updates

### Testing with curl

#### Health Check
```bash
curl http://localhost:3001/health
```

#### Get All Employees (JSON)
```bash
curl "http://localhost:8080/employees?format=json"
```

#### Get All Employees (XML)
```bash
curl "http://localhost:8080/employees?format=xml"
```

#### Create Employee
```bash
curl -X POST http://localhost:8080/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Williams",
    "position": "Data Scientist",
    "salary": 90000
  }'
```

#### Update Employee
```bash
curl -X PUT http://localhost:8080/employees/1 \
  -H "Content-Type: application/json" \
  -d '{"salary": 80000}'
```

#### Delete Employee
```bash
curl -X DELETE http://localhost:8080/employees/1
```

#### View Proxy Metrics
```bash
curl http://localhost:8080/metrics
```

### Demonstrating Load Balancing

Make multiple requests to see Round-Robin distribution:

```bash
# Request 1 - goes to DW1
curl "http://localhost:8080/employees?format=json"

# Request 2 - goes to DW2
curl "http://localhost:8080/employees?format=json"

# Request 3 - goes to DW3 (or back to DW1 if only 2 servers)
curl "http://localhost:8080/employees?format=json"
```

Check the metrics endpoint to see which server handled each request.

### Demonstrating Caching

1. **First request (cache miss)** - slower, fetches from DW:
   ```bash
   time curl "http://localhost:8080/employees?format=json"
   ```

2. **Second request (cache hit)** - faster, served from cache:
   ```bash
   time curl "http://localhost:8080/employees?format=json"
   ```

3. **After write operation** - cache is invalidated:
   ```bash
   curl -X POST http://localhost:8080/employees \
     -H "Content-Type: application/json" \
     -d '{"firstName": "Test", "lastName": "User", "position": "Tester", "salary": 50000}'
   ```

4. **Next GET request** - cache miss (cache was invalidated):
   ```bash
   curl "http://localhost:8080/employees?format=json"
   ```

---

## ☁️ Deployment

### Docker Deployment

```bash
# Build and start all services
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Cloud Deployment

This project is ready for cloud deployment on:
- **Railway** (Easiest - recommended)
- **Render** (Free tier available)
- **AWS** (EC2, ECS, or Cloud Run)
- **Google Cloud Platform**
- **DigitalOcean**

**Key Configuration for Cloud:**
- Set `PROXY_PORT` to use `$PORT` (provided by platform)
- Set `DW_SERVERS` to public URLs of DW services
- Ensure servers bind to `0.0.0.0` (not `localhost`)
- Configure CORS for web interface

---

## 📊 Metrics Endpoint

The proxy exposes metrics at `GET /metrics`:

```json
{
  "totalRequests": 10,
  "cacheHits": 5,
  "cacheMisses": 5,
  "requestsByServer": {
    "http://localhost:3001": 3,
    "http://localhost:3002": 2,
    "http://localhost:3003": 5
  },
  "averageResponseTime": 45.2,
  "cache": {
    "size": 2,
    "hitRate": "50.00%"
  },
  "loadBalancer": {
    "servers": ["http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    "currentIndex": 0
  }
}
```

---

## 🎓 Educational Notes

### Why This Architecture?

1. **Scalability**: Multiple DW servers can handle more requests than a single server
2. **Fault Tolerance**: If one DW server fails, others continue serving requests
3. **Performance**: Caching reduces response time and server load
4. **Transparency**: Clients don't need to know about the distributed backend

### Key Concepts Demonstrated

- **Reverse Proxy**: Intercepts client requests and forwards them to backend servers
- **Load Balancing**: Distributes requests across multiple servers
- **Caching**: Stores responses to serve them faster on subsequent requests
- **HTTP Protocol**: Proper use of GET, POST, PUT, DELETE methods
- **Content Negotiation**: Support for JSON and XML formats
- **Concurrency**: Node.js event loop handles multiple simultaneous requests
- **Transparency in Distribution**: Single entry point hides distributed backend

---

## 🐛 Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
- Change ports in `.env` or command line arguments
- Kill the process using the port:
  - Windows: `netstat -ano | findstr :3001` then `taskkill /PID <pid> /F`
  - Linux/Mac: `lsof -ti:3001 | xargs kill`

### DW Server Not Responding

**Symptoms:** Proxy returns 500 errors, connection refused

**Solution:**
- Check that DW servers are running
- Verify ports match in proxy configuration (`DW_SERVERS`)
- Check logs for connection errors
- Ensure DW servers bind to `0.0.0.0` (not `localhost`) for cloud deployment

### Cache Not Working

**Symptoms:** Every request hits DW server, no cache hits

**Solution:**
- Verify TTL is set correctly
- Check that requests are GET requests (only GET is cacheable)
- Ensure cache invalidation is working for write operations
- Check cache statistics via `/metrics` endpoint

### Data Inconsistency

**Symptoms:** Different data returned on different requests

**Explanation:** This is expected behavior! Each DW server has independent storage. See [Synchronization Explained](#synchronization-explained) section.

**Solution:**
- Use a single DW server for testing
- Or implement data synchronization (shared database, replication, etc.)

---

## 📝 License

ISC

## 👤 Author

Distributed Systems Lab - PAD

---

**Note**: This is an educational project for understanding web proxies, caching, and load balancing in distributed systems. The current implementation does not synchronize data between DW servers - each server maintains independent in-memory storage.
