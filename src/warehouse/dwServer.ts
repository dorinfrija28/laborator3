/**
 * Data Warehouse (DW) HTTP Server
 * 
 * This server implements Stage 1 of the distributed systems lab:
 * - Exposes CRUD operations for Employee entities via HTTP
 * - Supports JSON and XML response formats
 * - Handles concurrent requests using Node.js event loop
 * - Acts as a backend service that the proxy will load balance
 * 
 * Transparency in distribution: Clients should interact with the proxy,
 * not directly with DW servers. However, DW servers can also be accessed
 * directly for testing purposes.
 */

import express, { Express } from 'express';
import { logger } from '../shared/logger';
import {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getUpdateEmployees,
} from './routes/employeeRoutes';

// Parse command line arguments for port and server ID
// Also check environment variables (for Railway/cloud deployment)
const args = process.argv.slice(2);
let port = parseInt(process.env.PORT || '3001', 10);
let serverId = process.env.SERVER_ID || 'dw1';

args.forEach((arg: string, index: number) => {
    if (arg === '--port' && args[index + 1]) {
        port = parseInt(args[index + 1], 10);
    }
    if (arg === '--server-id' && args[index + 1]) {
        serverId = args[index + 1];
    }
});

const app: Express = express();

// Middleware for parsing JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        server: serverId,
        timestamp: new Date().toISOString(),
    });
});

// Employee CRUD routes
app.get('/employees', getAllEmployees);
app.get('/employees/:id', getEmployeeById);
app.post('/employees', createEmployee);
app.put('/employees/:id', updateEmployee);
app.delete('/employees/:id', deleteEmployee);

// Optional PULL-style endpoint for updates
app.get('/update/employees', getUpdateEmployees);

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        name: err.name,
    });
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled promise rejection', {
        reason: reason?.message || String(reason),
        stack: reason?.stack,
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
    });
    // Don't exit in production - let Railway handle it
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

// Start server
// Bind to 0.0.0.0 to accept connections from any interface (required for Railway/cloud)
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
    logger.info(`Data Warehouse Server ${serverId} started`, {
        host,
        port,
        serverId,
        endpoints: [
            'GET /health',
            'GET /employees',
            'GET /employees/:id',
            'POST /employees',
            'PUT /employees/:id',
            'DELETE /employees/:id',
            'GET /update/employees',
        ],
    });
});

