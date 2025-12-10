/**
 * In-Memory Cache Implementation
 * 
 * This cache stores HTTP responses at the proxy level to:
 * - Reduce response time for repeated requests (cache hits)
 * - Reduce load on DW servers by serving cached data
 * - Improve overall system performance and scalability
 * 
 * Cache Strategy:
 * - Only caches idempotent GET requests
 * - Uses TTL (Time To Live) to expire stale entries
 * - Invalidates cache on POST/PUT/DELETE operations
 * - Cache key: HTTP method + normalized URL path + query string
 * 
 * Future enhancement: This structure can be replaced with Redis
 * for distributed caching across multiple proxy instances
 */

import { CacheEntry } from './types';
import { logger } from '../shared/logger';

export class Cache {
    private store: Map<string, CacheEntry> = new Map();
    private ttlSeconds: number;

    constructor(ttlSeconds: number = 30) {
        this.ttlSeconds = ttlSeconds;
        logger.info('Cache initialized', { ttlSeconds });
    }

    /**
     * Generate cache key from HTTP method, path, and query string
     * Includes format parameter to ensure JSON and XML are cached separately
     */
    private generateKey(method: string, url: string): string {
        // Split URL into path and query
        const [pathPart, queryPart = ''] = url.split('?');
        const normalizedPath = pathPart.replace(/\/$/, '');

        // Parse query parameters
        const params = new URLSearchParams(queryPart);
        const format = params.get('format') || 'json';

        // Remove format, sort other params, then add format first
        params.delete('format');
        const sortedParams = Array.from(params.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        const otherParams = sortedParams.map(([k, v]) => `${k}=${v}`).join('&');

        // Build key with format first to ensure separate caching for JSON/XML
        const queryString = `format=${format}${otherParams ? '&' + otherParams : ''}`;

        return `${method.toUpperCase()}:${normalizedPath}?${queryString}`;
    }

    /**
     * Check if a request should be cached (only GET requests)
     */
    shouldCache(method: string): boolean {
        return method.toUpperCase() === 'GET';
    }

    /**
     * Get cached response if available and not expired
     */
    get(method: string, url: string): CacheEntry | null {
        if (!this.shouldCache(method)) {
            return null;
        }

        const key = this.generateKey(method, url);
        const entry = this.store.get(key);

        if (!entry) {
            return null;
        }

        // Check if entry has expired
        const now = Date.now();
        if (now > entry.expiresAt) {
            this.store.delete(key);
            logger.debug('Cache entry expired', { key });
            return null;
        }

        logger.debug('Cache hit', { key });
        return entry;
    }

    /**
     * Store response in cache
     */
    set(method: string, url: string, body: string, headers: Record<string, string | string[]>, statusCode: number): void {
        if (!this.shouldCache(method)) {
            return;
        }

        const key = this.generateKey(method, url);
        const now = Date.now();

        const entry: CacheEntry = {
            body,
            headers,
            statusCode,
            cachedAt: now,
            expiresAt: now + this.ttlSeconds * 1000,
        };

        this.store.set(key, entry);
        logger.debug('Cache entry stored', { key, ttl: this.ttlSeconds });
    }

    /**
     * Invalidate cache entries matching a pattern
     * Used when POST/PUT/DELETE operations modify data
     */
    invalidate(pattern: string): void {
        let invalidatedCount = 0;
        for (const key of this.store.keys()) {
            // Simple pattern matching: if key contains the pattern, invalidate it
            if (key.includes(pattern)) {
                this.store.delete(key);
                invalidatedCount++;
            }
        }
        if (invalidatedCount > 0) {
            logger.info('Cache invalidated', { pattern, count: invalidatedCount });
        }
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        const count = this.store.size;
        this.store.clear();
        logger.info('Cache cleared', { entriesRemoved: count });
    }

    /**
     * Get cache statistics
     */
    getStats(): { size: number; keys: string[] } {
        return {
            size: this.store.size,
            keys: Array.from(this.store.keys()),
        };
    }
}

