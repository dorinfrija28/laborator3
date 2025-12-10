/**
 * Response formatters for JSON and XML serialization
 * Enables clients to choose their preferred response format
 */

import * as xml2js from 'xml2js';
import { ResponseFormat } from './httpUtils';

const xmlBuilder = new xml2js.Builder({
    rootName: 'response',
    renderOpts: { pretty: true, indent: '  ' },
    xmldec: { version: '1.0', encoding: 'UTF-8' },
});

/**
 * Format data as JSON string
 */
export function formatJSON(data: any): string {
    return JSON.stringify(data, null, 2);
}

/**
 * Format data as XML string using xml2js Builder
 */
export function formatXML(data: any): string {
    try {
        // If data has a 'data' property (wrapped response), use it
        if (data && typeof data === 'object' && 'data' in data) {
            return xmlBuilder.buildObject(data);
        }
        // If data is an array, wrap it
        if (Array.isArray(data)) {
            return xmlBuilder.buildObject({ items: data });
        }
        // Otherwise, build XML from the object directly
        return xmlBuilder.buildObject(data);
    } catch (error) {
        // Fallback: create a simple XML structure
        const fallbackData = {
            error: 'Failed to format as XML',
            data: data,
        };
        return xmlBuilder.buildObject(fallbackData);
    }
}

/**
 * Format data based on the requested format
 */
export function formatResponse(data: any, format: ResponseFormat): string {
    return format === 'xml' ? formatXML(data) : formatJSON(data);
}

