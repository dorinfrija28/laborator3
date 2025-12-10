# Synchronization in the Web Proxy System

## 📋 Overview

This document explains how data synchronization works (or doesn't work) in the distributed web proxy system. Understanding synchronization is crucial for understanding the system's behavior and limitations.

## 🔍 Current Synchronization State

### ❌ **NO Data Synchronization Between DW Servers**

**Important:** The current implementation does **NOT** synchronize data between DW servers. Each DW server maintains its own **independent in-memory data store**.

```
DW1: [Employee 1, Employee 2]  ← Independent
DW2: [Employee 3, Employee 4]  ← Independent  
DW3: [Employee 5]             ← Independent
```

### Why This Matters

When a client creates an employee through the proxy:
1. Proxy uses Round-Robin to select a DW server (e.g., DW1)
2. Employee is created **only on DW1**
3. DW2 and DW3 **do not know** about this employee
4. Subsequent GET requests might go to DW2 or DW3, which won't have the new employee

**Result:** Data inconsistency across servers!

## 🔄 Types of Synchronization in This Project

### 1. **Cache Synchronization (Proxy Level)** ✅

The proxy implements cache synchronization to ensure clients see consistent data:

#### How It Works:

```typescript
// In proxyServer.ts - Cache invalidation on writes
if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    cache.invalidate('/employees');
}
```

**Flow:**
1. Client sends `POST /employees` → Proxy
2. Proxy forwards to DW server (e.g., DW1)
3. Employee created on DW1
4. **Proxy invalidates all `/employees` cache entries**
5. Next `GET /employees` request will fetch fresh data from DW servers

**Benefits:**
- Ensures cache doesn't serve stale data
- Clients see updates immediately after write operations
- Works at the proxy level (single point of control)

**Limitations:**
- Only synchronizes the cache, not the actual data stores
- Each DW server still has different data

### 2. **Load Balancing Synchronization** ✅

The proxy synchronizes **request distribution** across servers:

```typescript
// Round-Robin algorithm ensures even distribution
const dwServer = loadBalancer.getNextServer();
// Cycles: DW1 → DW2 → DW3 → DW1 → ...
```

**How It Works:**
- Maintains a counter (`currentIndex`)
- Each request goes to the next server in rotation
- Ensures even load distribution

**This is NOT data synchronization** - it only synchronizes which server handles which request.

### 3. **PULL-Style Endpoint (Available but Not Used)** ⚠️

There's a `/update/employees` endpoint designed for synchronization:

```typescript
// GET /update/employees - Returns all employees with timestamp
export function getUpdateEmployees(req: Request, res: Response): void {
    const employees = employeeService.getAll();
    const response = {
        data: employees,
        total: employeeService.getCount(),
        timestamp: new Date().toISOString(), // Timestamp for sync
    };
    // ...
}
```

**Potential Use:**
- DW servers could periodically poll each other
- Compare timestamps to detect changes
- Sync data when differences detected

**Current Status:** This endpoint exists but is **not actively used** for synchronization.

## 🏗️ Architecture: Why No Data Sync?

### Current Design Philosophy

The system is designed as a **stateless load-balanced architecture**:

1. **Each DW server is independent**
   - In-memory storage (no shared database)
   - No inter-server communication
   - Designed for horizontal scaling

2. **Proxy handles distribution**
   - Clients don't know which server handles their request
   - Load balancing distributes load
   - Cache provides performance optimization

3. **Trade-offs:**
   - ✅ Simple architecture
   - ✅ Easy to scale (add more DW servers)
   - ✅ Fault tolerance (if one server fails, others continue)
   - ❌ Data inconsistency between servers
   - ❌ No guarantee of data persistence across restarts

## 📊 Synchronization Scenarios

### Scenario 1: Creating an Employee

```
1. Client → POST /employees → Proxy
2. Proxy → Round-Robin selects DW1
3. DW1 creates Employee #1
4. Proxy invalidates cache
5. Result: Employee exists only on DW1
```

**Problem:** If next request goes to DW2, it won't see Employee #1.

### Scenario 2: Reading Employees

```
1. Client → GET /employees → Proxy
2. Proxy checks cache → MISS
3. Proxy → Round-Robin selects DW2
4. DW2 returns its employees (different from DW1)
5. Proxy caches response
6. Result: Client sees only DW2's employees
```

**Problem:** Different servers return different data.

### Scenario 3: Cache Hit

```
1. Client → GET /employees → Proxy
2. Proxy checks cache → HIT (from previous DW1 request)
3. Proxy returns cached data immediately
4. Result: Fast response, but might be stale if DW1 was updated
```

**Note:** Cache invalidation on writes helps, but TTL expiration can still serve stale data.

## 🔧 How to Add Data Synchronization

If you want to implement data synchronization, here are approaches:

### Option 1: Shared Database (Simplest)

Replace in-memory storage with a shared database:

```typescript
// All DW servers connect to the same database
// PostgreSQL, MongoDB, Redis, etc.
class EmployeeService {
    // Instead of: private employees: Employee[] = [];
    // Use: private db: Database;
    
    async create(dto: CreateEmployeeDTO) {
        return await this.db.employees.insert(dto);
    }
}
```

**Benefits:**
- Automatic synchronization
- Data persistence
- Single source of truth

**Drawbacks:**
- Database becomes a bottleneck
- Single point of failure
- More complex setup

### Option 2: Master-Slave Replication

Designate one DW server as master:

```typescript
// Master server handles all writes
// Slave servers replicate from master
if (isMaster) {
    // Handle write operations
    await replicateToSlaves(data);
} else {
    // Forward writes to master
    await forwardToMaster(data);
}
```

### Option 3: Event-Driven Synchronization

Use a message queue (Redis, RabbitMQ, etc.):

```typescript
// When employee is created on DW1
await publishEvent('employee.created', employeeData);

// Other DW servers subscribe and update
subscribe('employee.created', (data) => {
    employeeService.create(data);
});
```

### Option 4: PULL-Based Sync (Using Existing Endpoint)

Implement periodic synchronization:

```typescript
// On each DW server, periodically:
setInterval(async () => {
    const otherServers = ['http://dw1:3001', 'http://dw2:3002'];
    for (const server of otherServers) {
        const response = await fetch(`${server}/update/employees`);
        const { data, timestamp } = await response.json();
        syncEmployees(data, timestamp);
    }
}, 5000); // Every 5 seconds
```

## 🎯 Current System Behavior Summary

| Aspect | Status | Details |
|--------|--------|---------|
| **Data Sync Between DW Servers** | ❌ No | Each server has independent data |
| **Cache Sync (Proxy)** | ✅ Yes | Cache invalidated on writes |
| **Load Balancing** | ✅ Yes | Round-Robin distribution |
| **Data Persistence** | ❌ No | In-memory only, lost on restart |
| **Consistency** | ⚠️ Eventual | Only if same server handles related requests |

## 💡 Recommendations for Lab Report

When documenting synchronization in your lab report:

1. **Explain the current state:**
   - No data synchronization between DW servers
   - Each server maintains independent state
   - This is a design choice for simplicity

2. **Explain cache synchronization:**
   - How cache invalidation works
   - Why it's important for consistency
   - TTL-based expiration

3. **Discuss trade-offs:**
   - Benefits: Simple, scalable, fault-tolerant
   - Drawbacks: Data inconsistency, no persistence

4. **Propose improvements:**
   - Shared database
   - Event-driven sync
   - Master-slave replication

5. **Demonstrate the issue:**
   - Create employee through proxy
   - Show it only exists on one server
   - Make requests that hit different servers
   - Show inconsistent results

## 🔬 Testing Synchronization Behavior

### Test 1: Data Inconsistency

```bash
# Create employee
curl -X POST http://localhost:8080/employees \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","position":"Tester","salary":50000}'

# Get employees multiple times (will hit different servers)
curl http://localhost:8080/employees
curl http://localhost:8080/employees
curl http://localhost:8080/employees

# Result: Different counts/data from different servers
```

### Test 2: Cache Invalidation

```bash
# First request (cache miss)
curl http://localhost:8080/employees

# Second request (cache hit - fast)
curl http://localhost:8080/employees

# Create employee (invalidates cache)
curl -X POST http://localhost:8080/employees ...

# Third request (cache miss - fetches fresh data)
curl http://localhost:8080/employees
```

### Test 3: Check Metrics

```bash
# View which servers handled requests
curl http://localhost:8080/metrics

# Shows:
# - requestsByServer: { "http://dw1:3001": 5, "http://dw2:3002": 3 }
# - cacheHits vs cacheMisses
```

## 📚 Key Takeaways

1. **No data synchronization** between DW servers in current implementation
2. **Cache synchronization** exists at proxy level (invalidation on writes)
3. **Load balancing** synchronizes request distribution, not data
4. **PULL endpoint** exists but not used for synchronization
5. **Design choice** for simplicity and scalability
6. **Trade-off** between consistency and simplicity

This architecture is common in distributed systems where **eventual consistency** is acceptable, and the focus is on **scalability** and **performance** rather than **strong consistency**.

