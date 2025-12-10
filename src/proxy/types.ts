/**
 * Type definitions for the reverse proxy system
 */

export interface CacheEntry {
    body: string;
    headers: Record<string, string | string[]>;
    statusCode: number;
    cachedAt: number;
    expiresAt: number;
}

export interface ProxyMetrics {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    requestsByServer: Record<string, number>;
    averageResponseTime: number;
}

export interface LoadBalancerConfig {
    servers: string[];
    algorithm: 'round-robin';
}

