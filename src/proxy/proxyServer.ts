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
    // Remove headers that shouldn't be forwarded
    const headers: Record<string, string> = {};
    const skipHeaders = ['host', 'connection', 'content-length', 'transfer-encoding'];

    Object.keys(req.headers).forEach((key) => {
        if (!skipHeaders.includes(key.toLowerCase())) {
            const value = req.headers[key];
            if (value) {
                headers[key] = Array.isArray(value) ? value[0] : String(value);
            }
        }
    });

    // Set proper content-type for POST/PUT requests
    if ((req.method === 'POST' || req.method === 'PUT') && !headers['content-type']) {
        headers['content-type'] = 'application/json';
    }

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
            url: fullUrl,
        });

        // Log error responses for debugging
        if (response.status >= 400) {
            logger.warn('DW server error response', {
                server: dwServer,
                status: response.status,
                url: fullUrl,
                responseData: typeof response.data === 'string'
                    ? response.data.substring(0, 200)
                    : JSON.stringify(response.data).substring(0, 200),
            });
        }

        return { response, server: dwServer };
    } catch (error: any) {
        logger.error('Error forwarding request to DW', {
            server: dwServer,
            url: fullUrl,
            error: error.message,
            code: error.code,
            response: error.response?.status,
            stack: error.stack?.substring(0, 500),
        });
        throw error;
    }
}

/**
 * Add CORS headers to response
 */
function addCORSHeaders(res: http.ServerResponse): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
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

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        addCORSHeaders(res);
        res.writeHead(200);
        res.end();
        return;
    }

    logger.info('Incoming request', { method, path });

    // Don't forward static file requests to DW servers
    const staticExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.js', '.woff', '.woff2', '.ttf', '.eot'];
    const isStaticFile = staticExtensions.some(ext => path.toLowerCase().endsWith(ext));

    if (isStaticFile && method === 'GET') {
        // Try to serve static file, or return 404
        serveStaticFile(req, res, path.substring(1)); // Remove leading /
        return;
    }

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
            // Skip certain headers that shouldn't be forwarded
            const skipHeaders = ['host', 'connection', 'transfer-encoding'];
            if (skipHeaders.includes(key.toLowerCase())) {
                return;
            }
            if (value !== undefined) {
                if (Array.isArray(value)) {
                    nodeHeaders[key] = value;
                } else if (typeof value === 'string' || typeof value === 'number') {
                    nodeHeaders[key] = String(value);
                }
            }
        });

        // Add CORS headers
        addCORSHeaders(res);

        // Handle errors from DW servers
        if (dwResponse.status >= 400) {
            logger.warn('DW server returned error', {
                status: dwResponse.status,
                server: dwServer,
                path,
            });

            // Try to parse error response
            let errorBody = dwResponse.data;
            try {
                if (typeof errorBody === 'string') {
                    const parsed = JSON.parse(errorBody);
                    errorBody = JSON.stringify(parsed);
                }
            } catch (e) {
                // Keep original error body
            }

            res.writeHead(dwResponse.status, {
                ...nodeHeaders,
                'Content-Type': 'application/json',
            });
            res.end(errorBody || JSON.stringify({ error: 'Request failed' }));
            return;
        }

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
        logger.error('Error handling request', {
            error: error.message,
            stack: error.stack,
            path,
            method,
        });

        addCORSHeaders(res);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Internal server error',
            message: error.message || 'Unknown error',
        }));
    }
}

/**
 * Serve static files (for web interface)
 */
function serveStaticFile(req: http.IncomingMessage, res: http.ServerResponse, filePath: string): void {
    // Normalize file path
    if (filePath === '' || filePath === '/') {
        filePath = 'index.html';
    }

    // Security: prevent directory traversal
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(process.cwd(), 'public', normalizedPath);

    fs.readFile(fullPath, (err, data) => {
        if (err) {
            logger.debug('Static file not found', { filePath, error: err.message });
            addCORSHeaders(res);
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentTypes: Record<string, string> = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
        };

        const contentType = contentTypes[ext] || 'application/octet-stream';
        addCORSHeaders(res);
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600', // Cache static files for 1 hour
        });
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

    // Handle CORS preflight for all routes
    if (req.method === 'OPTIONS') {
        addCORSHeaders(res);
        res.writeHead(200);
        res.end();
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
// Bind to 0.0.0.0 to accept connections from any interface (required for Railway/cloud)
const HOST = process.env.HOST || '0.0.0.0';

// Validate port
if (isNaN(PROXY_PORT) || PROXY_PORT <= 0 || PROXY_PORT > 65535) {
    logger.error('Invalid proxy port', { port: PROXY_PORT, envPort: process.env.PORT, envProxyPort: process.env.PROXY_PORT });
    process.exit(1);
}

server.listen(PROXY_PORT, HOST, () => {
    logger.info('Reverse Proxy Server started successfully', {
        host: HOST,
        port: PROXY_PORT,
        dwServers: DW_SERVERS,
        cacheTTL: `${CACHE_TTL}s`,
        nodeEnv: process.env.NODE_ENV,
        endpoints: [
            'GET / - Web interface',
            'All routes forwarded to DW servers',
            'GET /metrics - Proxy metrics'
        ],
    });
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
    logger.error('Proxy server error', {
        error: error.message,
        code: error.code,
        port: PROXY_PORT,
        host: HOST,
    });

    if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PROXY_PORT} is already in use`);
        process.exit(1);
    } else if (error.code === 'EACCES') {
        logger.error(`Permission denied to bind to port ${PROXY_PORT}`);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('Shutting down proxy server...');
    server.close(() => {
        logger.info('Proxy server closed');
        process.exit(0);
    });
});

