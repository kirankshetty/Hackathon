// Simple structured logger for development and production
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  private shouldLog(level: string): boolean {
    const currentLevel = process.env.LOG_LEVEL || 'info';
    const levels = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(currentLevel);
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const logObject = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(meta && { meta })
    };
    return JSON.stringify(logObject);
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(this.formatMessage(LOG_LEVELS.ERROR, message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(this.formatMessage(LOG_LEVELS.WARN, message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.info(this.formatMessage(LOG_LEVELS.INFO, message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }

  // Database operation logging
  dbQuery(query: string, params?: any[], duration?: number): void {
    this.debug('Database query executed', {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      params: params?.length ? `${params.length} parameters` : 'no parameters',
      duration: duration ? `${duration}ms` : undefined
    });
  }

  dbError(operation: string, error: Error, context?: any): void {
    this.error(`Database operation failed: ${operation}`, {
      error: error.message,
      stack: error.stack,
      context
    });
  }
}

export const logger = new Logger();