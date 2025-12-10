# Web Proxy: Transparența în Distribuire

Distributed Systems Lab Project - Web Proxy with Caching and Load Balancing

## 📋 Project Overview

This project implements a **reverse smart proxy** that provides transparency in distribution by acting as a single entry point for clients while distributing requests across multiple Data Warehouse (DW) servers using load balancing and caching.

### Architecture

```
Client → Proxy (Port 8080) → [DW1 (3001), DW2 (3002), DW3 (3003)]
                ↓
            Cache Layer
```

### Key Features

**Stage 1 - Data Warehouse Servers:**
- ✅ Full CRUD operations for Employee entities
- ✅ HTTP methods: GET, POST, PUT, DELETE
- ✅ Support for JSON and XML response formats
- ✅ Concurrent request handling via Node.js event loop
- ✅ Pagination support (offset, limit)
- ✅ Health check endpoint

**Stage 2 - Reverse Smart Proxy:**
- ✅ Load balancing (Round-Robin algorithm)
- ✅ Response caching with TTL
- ✅ Cache invalidation on write operations
- ✅ Request metrics and monitoring
- ✅ Transparency: clients only interact with proxy

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone or navigate to the project directory:
```bash
cd laborator3
```

2. Install dependencies:
```bash
npm install
```

3. Build TypeScript (optional, for production):
```bash
npm run build
```

### Running the System

#### Option 1: Development Mode (with hot reload)

**Terminal 1 - Start DW Server 1:**
```bash
npm run dev:dw1
```

**Terminal 2 - Start DW Server 2:**
```bash
npm run dev:dw2
```

**Terminal 3 - Start DW Server 3 (optional):**
```bash
npm run dev:dw3
```

**Terminal 4 - Start Proxy Server:**
```bash
npm run dev:proxy
```

#### Option 2: Production Mode

First build the project:
```bash
npm run build
```

Then start servers:
```bash
npm run start:dw1
npm run start:dw2
npm run start:proxy
```

### Configuration

Create a `.env` file (optional, defaults are used if not present):

```env
PROXY_PORT=8080
DW_SERVERS=http://localhost:3001,http://localhost:3002,http://localhost:3003
CACHE_TTL_SECONDS=30
LOG_LEVEL=info
```

## 🧪 Testing

### Web Interface (Recommended)

A simple web interface is available for testing CRUD operations without using curl:

1. Start the proxy server:
   ```bash
   npm run dev:proxy
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

3. The web interface allows you to:
   - View all employees in a table
   - Create new employees
   - Edit existing employees
   - Delete employees
   - Switch between JSON and XML formats
   - See real-time updates

### Testing DW Servers Directly

#### Health Check
```bash
curl http://localhost:3001/health
```

#### Get All Employees (JSON)
```bash
curl "http://localhost:3001/employees?format=json"
```

#### Get All Employees (XML)
```bash
curl "http://localhost:3001/employees?format=xml"
```

#### Get Employees with Pagination
```bash
curl "http://localhost:3001/employees?offset=0&limit=2&format=json"
```

#### Get Single Employee
```bash
curl "http://localhost:3001/employees/1?format=json"
```

#### Create Employee
```bash
curl -X POST http://localhost:3001/employees \
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
curl -X PUT http://localhost:3001/employees/1 \
  -H "Content-Type: application/json" \
  -d '{
    "salary": 80000
  }'
```

#### Delete Employee
```bash
curl -X DELETE http://localhost:3001/employees/1
```

### Testing Through Proxy

#### Get All Employees (via Proxy)
```bash
curl "http://localhost:8080/employees?format=json"
```

#### Get Single Employee (via Proxy)
```bash
curl "http://localhost:8080/employees/1?format=xml"
```

#### Create Employee (via Proxy - invalidates cache)
```bash
curl -X POST http://localhost:8080/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Bob",
    "lastName": "Anderson",
    "position": "Backend Developer",
    "salary": 85000
  }'
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

Check the metrics endpoint to see which server handled each request:
```bash
curl http://localhost:8080/metrics
```

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

## 📁 Project Structure

```
laborator3/
├── src/
│   ├── proxy/
│   │   ├── proxyServer.ts      # Main proxy server
│   │   ├── cache.ts            # Cache implementation
│   │   ├── loadBalancer.ts     # Round-robin load balancer
│   │   └── types.ts            # Type definitions
│   ├── warehouse/
│   │   ├── dwServer.ts         # DW HTTP server
│   │   ├── routes/
│   │   │   └── employeeRoutes.ts  # Employee route handlers
│   │   ├── services/
│   │   │   └── employeeService.ts # CRUD business logic
│   │   └── models/
│   │       └── employee.ts     # Employee model
│   └── shared/
│       ├── logger.ts            # Logging utility
│       ├── httpUtils.ts        # HTTP helpers
│       └── formatters.ts       # JSON/XML formatters
├── package.json
├── tsconfig.json
└── README.md
```

## 🔍 How It Works

### Transparency in Distribution

The proxy achieves transparency by:

1. **Single Entry Point**: Clients only know about `http://localhost:8080`
2. **Hidden Backend**: DW servers (3001, 3002, 3003) are not directly exposed to clients
3. **Unified Interface**: Clients interact with the proxy as if it were a single server
4. **Automatic Routing**: The proxy handles all complexity of server selection and request forwarding

### Load Balancing (Round-Robin)

- Maintains an index pointing to the next server
- Cycles through servers: DW1 → DW2 → DW3 → DW1 → ...
- Ensures even distribution of requests
- Improves scalability and fault tolerance

### Caching Strategy

- **Cache Key**: `METHOD:URL?query`
- **TTL**: Configurable (default 30 seconds)
- **Cacheable**: Only GET requests
- **Invalidation**: On POST/PUT/DELETE operations
- **Benefits**: 
  - Faster response times
  - Reduced load on DW servers
  - Better scalability

### Request Flow

1. Client sends request to proxy (port 8080)
2. Proxy checks cache (if GET request)
3. If cache hit: return cached response immediately
4. If cache miss:
   - Load balancer selects next DW server
   - Proxy forwards request to DW server
   - DW server processes request and returns response
   - Proxy caches response (if GET and status 200)
   - Proxy returns response to client
5. For write operations (POST/PUT/DELETE):
   - Cache is invalidated
   - Request is forwarded to DW server
   - Response is returned to client

## 📊 Metrics Endpoint

The proxy exposes metrics at `GET /metrics`:

```json
{
  "totalRequests": 10,
  "cacheHits": 5,
  "cacheMisses": 5,
  "requestsByServer": {
    "http://localhost:3001": 3,
    "http://localhost:3002": 2
  },
  "averageResponseTime": 45.2,
  "cache": {
    "size": 2,
    "hitRate": "50.00%"
  },
  "loadBalancer": {
    "servers": ["http://localhost:3001", "http://localhost:3002"],
    "currentIndex": 0
  }
}
```

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

## ☁️ Cloud Deployment

This project is ready for cloud deployment! See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to:

- **Railway** (Easiest - recommended for quick deployment)
- **Render** (Free tier available)
- **AWS** (EC2, ECS, or Cloud Run)
- **Google Cloud Platform**
- **DigitalOcean**
- **Docker** (Any platform supporting Docker)

### Quick Docker Deployment

```bash
# Build and start all services
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

For detailed cloud deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🐛 Troubleshooting

### Port Already in Use

If you get "port already in use" error:
- Change ports in `.env` or command line arguments
- Kill the process using the port:
  - Windows: `netstat -ano | findstr :3001` then `taskkill /PID <pid> /F`
  - Linux/Mac: `lsof -ti:3001 | xargs kill`

### DW Server Not Responding

- Check that DW servers are running
- Verify ports match in proxy configuration
- Check logs for connection errors

### Cache Not Working

- Verify TTL is set correctly
- Check that requests are GET requests
- Ensure cache invalidation is working for write operations

## 🔄 Synchronization

**Important:** This system does **NOT** synchronize data between DW servers. Each DW server maintains independent in-memory storage. See [SYNCHRONIZATION.md](./SYNCHRONIZATION.md) for detailed explanation of:

- Current synchronization state (cache sync, no data sync)
- Why data isn't synchronized
- How to add synchronization if needed
- Testing synchronization behavior

## 📝 License

ISC

## 👤 Author

Distributed Systems Lab - PAD

---

**Note**: This is an educational project for understanding web proxies, caching, and load balancing in distributed systems.

