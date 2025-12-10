/**
 * Database Connection Module
 * 
 * Provides a shared PostgreSQL database connection for all DW servers.
 * All DW servers connect to the same database, ensuring data synchronization.
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import * as dotenv from 'dotenv';
import { logger } from '../../shared/logger';

// Load environment variables
dotenv.config();

// Database configuration from environment variables
// Supports both Railway's DATABASE_URL and individual variables
// Railway provides: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, DATABASE_URL
const DB_CONFIG = {
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
    database: process.env.DB_NAME || process.env.PGDATABASE || 'employees_db',
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// If DATABASE_URL is provided (Railway format), parse it
// Format: postgresql://user:password@host:port/database
if (process.env.DATABASE_URL && !process.env.DB_HOST) {
    try {
        const url = new URL(process.env.DATABASE_URL);
        DB_CONFIG.host = url.hostname;
        DB_CONFIG.port = parseInt(url.port || '5432', 10);
        DB_CONFIG.database = url.pathname.slice(1); // Remove leading '/'
        DB_CONFIG.user = url.username;
        DB_CONFIG.password = url.password;
        logger.info('Using DATABASE_URL for connection');
    } catch (error) {
        logger.warn('Failed to parse DATABASE_URL, using individual variables', { error: (error as Error).message });
    }
}

// Create connection pool
// Connection pooling allows multiple DW servers to share database connections efficiently
const pool = new Pool(DB_CONFIG);

// Handle pool errors
pool.on('error', (err) => {
    logger.error('Unexpected database pool error', { error: err.message });
});

/**
 * Get a client from the connection pool
 */
export async function getClient(): Promise<PoolClient> {
    try {
        const client = await pool.connect();
        return client;
    } catch (error) {
        logger.error('Failed to get database client', { error: (error as Error).message });
        throw error;
    }
}

/**
 * Execute a query using the connection pool
 */
export async function query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.debug('Database query executed', {
            query: text.substring(0, 50) + '...',
            duration: `${duration}ms`,
            rows: result.rowCount
        });
        return result;
    } catch (error) {
        const duration = Date.now() - start;
        logger.error('Database query failed', {
            query: text.substring(0, 50) + '...',
            duration: `${duration}ms`,
            error: (error as Error).message
        });
        throw error;
    }
}

/**
 * Initialize database schema
 * Creates the employees table if it doesn't exist
 */
export async function initializeDatabase(): Promise<void> {
    try {
        // Create employees table
        await query(`
            CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                position VARCHAR(255) NOT NULL,
                salary DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create index on id for faster lookups
        await query(`
            CREATE INDEX IF NOT EXISTS idx_employees_id ON employees(id)
        `);

        logger.info('Database initialized successfully', {
            host: DB_CONFIG.host,
            database: DB_CONFIG.database,
        });
    } catch (error) {
        logger.error('Failed to initialize database', { error: (error as Error).message });
        throw error;
    }
}

/**
 * Close all database connections
 * Used for graceful shutdown
 */
export async function closePool(): Promise<void> {
    try {
        await pool.end();
        logger.info('Database connection pool closed');
    } catch (error) {
        logger.error('Error closing database pool', { error: (error as Error).message });
    }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
    try {
        const result = await query('SELECT NOW()');
        logger.info('Database connection test successful', {
            timestamp: result.rows[0].now
        });
        return true;
    } catch (error) {
        logger.error('Database connection test failed', { error: (error as Error).message });
        return false;
    }
}

// Export pool for advanced usage
export { pool };

