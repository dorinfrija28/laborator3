/**
 * Simple logger utility for tracking request flow and system events
 * Helps demonstrate transparency in distribution by logging proxy → DW interactions
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

class Logger {
    private level: LogLevel = LogLevel.INFO;

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    private formatMessage(level: string, message: string, meta?: Record<string, any>): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] ${message}${metaStr}`;
    }

    debug(message: string, meta?: Record<string, any>): void {
        if (this.level <= LogLevel.DEBUG) {
            console.log(this.formatMessage('DEBUG', message, meta));
        }
    }

    info(message: string, meta?: Record<string, any>): void {
        if (this.level <= LogLevel.INFO) {
            console.log(this.formatMessage('INFO', message, meta));
        }
    }

    warn(message: string, meta?: Record<string, any>): void {
        if (this.level <= LogLevel.WARN) {
            console.warn(this.formatMessage('WARN', message, meta));
        }
    }

    error(message: string, meta?: Record<string, any>): void {
        if (this.level <= LogLevel.ERROR) {
            console.error(this.formatMessage('ERROR', message, meta));
        }
    }
}

export const logger = new Logger();

