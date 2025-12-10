/**
 * Reverse Smart Proxy Server
 * 
 * This proxy implements Stage 2 of the distributed systems lab:
 * - Acts as a single entry point for clients (transparency in distribution)
 * - Forwards requests to DW servers using load balancing
 * - Implements caching to improve response times
 * - Tracks metrics for monitoring and reporting
 * 
 * Transparency in Distribution:
 * Clients interact only with the proxy (e.g., http://localhost:8080).
 * They don't need to know about the underlying DW servers or which one
 * handles their request. The proxy abstracts away the distributed nature
 * of the backend, making it appear as a single, unified service.
 * 
 * Benefits:
 * 1. Caching: Reduces response time and DW server load
 * 2. Load Balancing: Distributes requests evenly across DW servers
 * 3. Single Entry Point: Simplifies client implementation
 * 4. Scalability: Easy to add/remove DW servers without client changes
 */

import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import axios, { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import { Cache } from './cache';
import { LoadBalancer } from './loadBalancer';
import { ProxyMetrics } from './types';
import { logger } from '../shared/logger';

// Load environment variables
dotenv.config();

// Configuration
// Railway provides $PORT, but we can override with PROXY_PORT
const PROXY_PORT = parseInt(process.env.PROXY_PORT || process.env.PORT || '8080', 10);
const DW_SERVERS = (process.env.DW_SERVERS || 'http://localhost:3001,http://localhost:3002')
    .split(',')
    .map((s) => s.trim());
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '30', 10);

// Initialize components
const cache = new Cache(CACHE_TTL);
const loadBalancer = new LoadBalancer({
    servers: DW_SERVERS,
    algorithm: 'round-robin',
});

// Metrics tracking
const metrics: ProxyMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    requestsByServer: {},
    averageResponseTime: 0,
};

// Track response times for average calculation
const responseTimes: number[] = [];

/**
 * Update metrics after handling a request
 */
function updateMetrics(dwServer: string, responseTime: number, cacheHit: boolean): void {
    metrics.totalRequests++;
    if (cacheHit) {
        metrics.cacheHits++;
    } else {
        metrics.cacheMisses++;
    }

    if (!metrics.requestsByServer[dwServer]) {
        metrics.requestsByServer[dwServer] = 0;
    }
    metrics.requestsByServer[dwServer]++;

    responseTimes.push(responseTime);
    // Keep only last 100 response times for average calculation
    if (responseTimes.length > 100) {
        responseTimes.shift();
    }
    metrics.averageResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
}

/**
 * Forward request to DW server
 * Returns both the response and the server that handled it
 */
async function forwardRequest(
    req: http.IncomingMessage,
    targetUrl: string
): Promise<{ response: AxiosResponse; server: string }> {
    const startTime = Date.now();

    // Select DW server using load balancer
    const dwServer = loadBalancer.getNextServer();
    const fullUrl = `${dwServer}${targetUrl}`;

    logger.info('Forwarding request', {
        method: req.method,
        originalUrl: targetUrl,
        targetServer: dwServer,
        fullUrl,
    });

    // Prepare request options
    // Remove host header to avoid conflicts
    const headers = { ...req.headers };
    delete headers.host;

    const requestOptions: any = {
        method: req.method,
        url: fullUrl,
        headers,
        validateStatus: () => true, // Don't throw on any status code
        responseType: 'text', // Get raw response to preserve XML/JSON format
    };

    // Forward request body if present
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        const body = await new Promise<string>((resolve) => {
            let data = '';
            req.on('data', (chunk) => {
                data += chunk.toString();
            });
            req.on('end', () => {
                resolve(data);
            });
        });
        requestOptions.data = body;
    }

    try {
        const response = await axios(requestOptions);
        const responseTime = Date.now() - startTime;

        logger.info('Response received from DW', {
            server: dwServer,
            statusCode: response.status,
            responseTime: `${responseTime}ms`,
        });

        return { response, server: dwServer };
    } catch (error: any) {
        logger.error('Error forwarding request', {
            server: dwServer,
            error: error.message,
        });
        throw error;
    }
}

/**
 * Handle incoming HTTP request
 */
async function handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
): Promise<void> {
    const startTime = Date.now();
    const parsedUrl = url.parse(req.url || '/');
    const path = parsedUrl.path || '/';
    const method = req.method || 'GET';

    logger.info('Incoming request', { method, path });

    // Check cache for GET requests
    if (method === 'GET') {
        const cached = cache.get(method, req.url || '/');
        if (cached) {
            // Serve from cache
            res.writeHead(cached.statusCode, cached.headers);
            res.end(cached.body);
            const responseTime = Date.now() - startTime;
            updateMetrics('cache', responseTime, true);
            logger.info('Served from cache', { path, responseTime: `${responseTime}ms` });
            return;
        }
    }

    // Invalidate cache for write operations
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        // Invalidate all employee-related cache entries
        cache.invalidate('/employees');
        logger.debug('Cache invalidated due to write operation', { method, path });
    }

    try {
        // Forward request to DW server
        const { response: dwResponse, server: dwServer } = await forwardRequest(req, req.url || '/');
        const responseTime = Date.now() - startTime;

        // Convert axios headers to Node.js format
        const nodeHeaders: Record<string, string | string[]> = {};
        Object.keys(dwResponse.headers).forEach((key) => {
            const value = dwResponse.headers[key];
            if (value !== undefined) {
                if (Array.isArray(value)) {
                    nodeHeaders[key] = value;
                } else if (typeof value === 'string' || typeof value === 'number') {
                    nodeHeaders[key] = String(value);
                }
            }
        });

        // Cache GET responses (response.data is already a string due to responseType: 'text')
        if (method === 'GET' && dwResponse.status === 200) {
            cache.set(
                method,
                req.url || '/',
                dwResponse.data as string,
                nodeHeaders,
                dwResponse.status
            );
        }

        // Send response to client (preserve original format - JSON or XML)
        res.writeHead(dwResponse.status, nodeHeaders);
        res.end(dwResponse.data);

        updateMetrics(dwServer, responseTime, false);
        logger.info('Request completed', {
            method,
            path,
            statusCode: dwResponse.status,
            responseTime: `${responseTime}ms`,
            server: dwServer,
        });
    } catch (error: any) {
        logger.error('Error handling request', { error: error.message });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

/**
 * Serve static files (for web interface)
 */
function serveStaticFile(req: http.IncomingMessage, res: http.ServerResponse, filePath: string): void {
    const fullPath = path.join(process.cwd(), 'public', filePath);

    fs.readFile(fullPath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentTypes: Record<string, string> = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
        };

        const contentType = contentTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

/**
 * Metrics endpoint - GET /metrics
 */
async function handleRequestWithMetrics(
    req: http.IncomingMessage,
    res: http.ServerResponse
): Promise<void> {
    const parsedUrl = url.parse(req.url || '/');
    const pathname = parsedUrl.pathname || '/';

    // Handle static files (web interface)
    if (pathname === '/' || pathname === '/index.html') {
        serveStaticFile(req, res, 'index.html');
        return;
    }

    // Handle metrics endpoint
    if (pathname === '/metrics' && req.method === 'GET') {
        const cacheStats = cache.getStats();
        const metricsResponse = {
            ...metrics,
            cache: {
                size: cacheStats.size,
                hitRate: metrics.totalRequests > 0
                    ? ((metrics.cacheHits / metrics.totalRequests) * 100).toFixed(2) + '%'
                    : '0%',
            },
            loadBalancer: {
                servers: loadBalancer.getServers(),
                currentIndex: loadBalancer.getCurrentIndex(),
            },
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(metricsResponse, null, 2));
        return;
    }

    // For non-metrics requests, handle normally
    await handleRequest(req, res);
}

// Create HTTP server
const server = http.createServer((req, res) => {
    handleRequestWithMetrics(req, res).catch((err) => {
        logger.error('Unhandled error in request handler', { error: err.message });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    });
});

// Start server
server.listen(PROXY_PORT, () => {
    logger.info('Reverse Proxy Server started', {
        port: PROXY_PORT,
        dwServers: DW_SERVERS,
        cacheTTL: `${CACHE_TTL}s`,
        endpoints: [
            'GET / - Web interface',
            'All routes forwarded to DW servers',
            'GET /metrics - Proxy metrics'
        ],
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('Shutting down proxy server...');
    server.close(() => {
        logger.info('Proxy server closed');
        process.exit(0);
    });
});

