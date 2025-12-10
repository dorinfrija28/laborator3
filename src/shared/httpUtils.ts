/**
 * HTTP utility functions for request/response handling
 * Supports format negotiation (JSON/XML) via query params or Accept header
 */

import { IncomingMessage } from 'http';
import { parse } from 'url';

export type ResponseFormat = 'json' | 'xml';

export interface ParsedQuery {
    [key: string]: string | undefined;
}

/**
 * Parse query string from URL
 */
export function parseQuery(url: string): ParsedQuery {
    const parsed = parse(url, true);
    return parsed.query as ParsedQuery;
}

/**
 * Determine response format from query parameter or Accept header
 * Defaults to JSON if not specified
 */
export function getResponseFormat(req: IncomingMessage, query: ParsedQuery): ResponseFormat {
    // Check query parameter first
    const formatParam = query.format?.toLowerCase();
    if (formatParam === 'json' || formatParam === 'xml') {
        return formatParam;
    }

    // Check Accept header
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/xml') || acceptHeader.includes('text/xml')) {
        return 'xml';
    }
    if (acceptHeader.includes('application/json')) {
        return 'json';
    }

    // Default to JSON
    return 'json';
}

/**
 * Set appropriate Content-Type header based on format
 */
export function getContentType(format: ResponseFormat): string {
    return format === 'xml' ? 'application/xml' : 'application/json';
}

/**
 * Parse request body from IncomingMessage
 */
export function parseRequestBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            resolve(body);
        });
        req.on('error', (err: Error) => {
            reject(err);
        });
    });
}

