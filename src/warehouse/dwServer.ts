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
import { initializeDatabase, testConnection, closePool } from './database/db';
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
// Railway provides PORT automatically, but we can override with --port argument
const args = process.argv.slice(2);
let port = parseInt(process.env.PORT || '3001', 10);
let serverId = process.env.SERVER_ID || 'dw1';

// Command line arguments override environment variables
args.forEach((arg: string, index: number) => {
    if (arg === '--port' && args[index + 1]) {
        const argPort = parseInt(args[index + 1], 10);
        if (!isNaN(argPort)) {
            port = argPort;
        }
    }
    if (arg === '--server-id' && args[index + 1]) {
        serverId = args[index + 1];
    }
});

// Log configuration for debugging
logger.info('DW Server configuration', {
    port,
    serverId,
    envPort: process.env.PORT,
    envServerId: process.env.SERVER_ID,
    nodeEnv: process.env.NODE_ENV,
    args: process.argv.slice(2),
});

const app: Express = express();

// Middleware for parsing JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    try {
        res.json({
            status: 'ok',
            server: serverId,
            port: port,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        logger.error('Error in health check', { error: error.message });
        res.status(500).json({
            error: 'Health check failed',
            message: error.message,
        });
    }
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

// Server initialization moved to startServer() function below

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    server.close(async () => {
        logger.info('Server closed');
        await closePool();
        process.exit(0);
    });
});

// Initialize database connection and start server
let server: any = null;

async function startServer() {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            logger.error('Database connection failed. Server will not start.');
            process.exit(1);
        }

        // Initialize database schema
        await initializeDatabase();
        logger.info('Database initialized and ready');

        // Start HTTP server
        const host = process.env.HOST || '0.0.0.0';

        // Validate port
        if (isNaN(port) || port <= 0 || port > 65535) {
            logger.error('Invalid port', { port, envPort: process.env.PORT });
            process.exit(1);
        }

        server = app.listen(port, host, () => {
            logger.info(`Data Warehouse Server ${serverId} started successfully`, {
                host,
                port,
                serverId,
                nodeEnv: process.env.NODE_ENV,
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

        // Handle server errors
        server.on('error', (error: NodeJS.ErrnoException) => {
            logger.error('Server error', {
                error: error.message,
                code: error.code,
                port,
                host,
            });

            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${port} is already in use`);
                process.exit(1);
            } else if (error.code === 'EACCES') {
                logger.error(`Permission denied to bind to port ${port}`);
                process.exit(1);
            }
        });
    } catch (error) {
        logger.error('Failed to start server', { error: (error as Error).message });
        process.exit(1);
    }
}

// Start the server
startServer();

