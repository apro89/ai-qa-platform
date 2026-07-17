import { Logger, ConsoleTransport, ILogTransport } from './Logger.js';
import { LogLevel } from './LogLevel.js';

/**
 * LoggerFactory - Centralized configuration and creation of Logger instances.
 *
 * Follows Factory Pattern and Dependency Inversion:
 * - Decouples logger creation from business logic
 * - Allows global configuration changes
 * - Supports --debug mode and environment variables
 * - Enables adding new transports without modifying existing code
 */
export class LoggerFactory {
  private static instance: LoggerFactory;
  private level: LogLevel = LogLevel.INFO;
  private transports: ILogTransport[] = [];
  private loggers: Map<string, Logger> = new Map();

  private constructor() {
    this.initializeDefaults();
  }

  /**
   * Get or create the factory singleton
   */
  static getInstance(): LoggerFactory {
    if (!LoggerFactory.instance) {
      LoggerFactory.instance = new LoggerFactory();
    }
    return LoggerFactory.instance;
  }

  /**
   * Initialize with default transports and level
   */
  private initializeDefaults(): void {
    this.transports = [new ConsoleTransport(true)];

    // Check environment variables
    const envLevel = process.env.LOG_LEVEL;
    if (envLevel) {
      const numLevel = parseInt(envLevel, 10);
      if (!Number.isNaN(numLevel) && numLevel >= LogLevel.TRACE && numLevel <= LogLevel.ERROR) {
        this.level = numLevel;
      }
    }

    // Check --debug flag
    if (process.argv.includes('--debug')) {
      this.level = LogLevel.DEBUG;
    }

    // Check --trace flag
    if (process.argv.includes('--trace')) {
      this.level = LogLevel.TRACE;
    }
  }

  /**
   * Create or retrieve a logger for a module
   */
  getLogger(module: string): Logger {
    let logger = this.loggers.get(module);
    if (!logger) {
      logger = new Logger(module, this.level, this.transports);
      this.loggers.set(module, logger);
    }
    return logger;
  }

  /**
   * Set global log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
    this.loggers.forEach((logger) => {
      logger.setLevel(level);
    });
  }

  /**
   * Add a transport globally to all loggers
   */
  addTransport(transport: ILogTransport): void {
    this.transports.push(transport);
    this.loggers.forEach((logger) => {
      logger.addTransport(transport);
    });
  }

  /**
   * Get current global log level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Enable debug mode
   */
  enableDebugMode(): void {
    this.setLevel(LogLevel.DEBUG);
  }

  /**
   * Enable trace mode (most verbose)
   */
  enableTraceMode(): void {
    this.setLevel(LogLevel.TRACE);
  }
}

/**
 * Create a logger for a specific module
 * Usage: const logger = createLogger('ProjectAnalyzer');
 */
export function createLogger(module: string): Logger {
  return LoggerFactory.getInstance().getLogger(module);
}
