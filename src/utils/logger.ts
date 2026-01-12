/**
 * Logger Utility - Production-safe logging
 * 
 * Usage:
 * import { logger } from '../utils/logger';
 * 
 * logger.log('Debug info');        // Only in development
 * logger.error('Error occurred');  // Always logged
 * logger.warn('Warning message');  // Only in development
 * logger.info('Info message');     // Only in development
 */

type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug';

interface LoggerOptions {
  prefix?: string;
  timestamp?: boolean;
}

class Logger {
  private prefix: string;
  private timestamp: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '[FinTrack]';
    this.timestamp = options.timestamp !== false;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const time = this.timestamp ? `[${new Date().toISOString()}]` : '';
    const levelTag = level.toUpperCase();
    return `${time} ${this.prefix} [${levelTag}] ${message}`;
  }

  /**
   * Debug logging - only in development
   */
  log(message: string, ...args: any[]): void {
    if (__DEV__) {
      console.log(this.formatMessage('log', message), ...args);
    }
  }

  /**
   * Debug logging - only in development
   */
  debug(message: string, ...args: any[]): void {
    if (__DEV__) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  /**
   * Info logging - only in development
   */
  info(message: string, ...args: any[]): void {
    if (__DEV__) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  /**
   * Warning logging - only in development
   */
  warn(message: string, ...args: any[]): void {
    if (__DEV__) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  /**
   * Error logging - ALWAYS logged (even in production)
   * Errors should always be tracked for debugging
   */
  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('error', message), ...args);
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(childPrefix: string): Logger {
    return new Logger({
      prefix: `${this.prefix} ${childPrefix}`,
      timestamp: this.timestamp,
    });
  }
}

// Default logger instance
export const logger = new Logger();

// Named loggers for different modules
export const authLogger = new Logger({ prefix: '[Auth]' });
export const paymentLogger = new Logger({ prefix: '[Payment]' });
export const firestoreLogger = new Logger({ prefix: '[Firestore]' });
export const navigationLogger = new Logger({ prefix: '[Navigation]' });
export const stripeLogger = new Logger({ prefix: '[Stripe]' });

// Helper to create custom logger
export const createLogger = (prefix: string, options?: Omit<LoggerOptions, 'prefix'>) => {
  return new Logger({ ...options, prefix: `[${prefix}]` });
};

export default logger;
