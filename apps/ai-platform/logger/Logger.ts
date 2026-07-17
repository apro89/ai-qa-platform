import { LogLevel, LogLevelNames, colorize } from './LogLevel.js';

export interface LogContext {
  [key: string]: unknown;
}

/**
 * Transport interface for extensibility.
 * Allows different output targets (console, file, JSON, OpenTelemetry, etc.)
 * without changing business logic.
 */
export interface ILogTransport {
  write(
    level: LogLevel,
    timestamp: Date,
    module: string,
    message: string,
    context?: LogContext,
    error?: Error,
  ): void;
}

/**
 * Centralized Logger following Clean Architecture and SOLID principles.
 *
 * Responsibilities:
 * - Format log messages
 * - Route to configured transports
 * - Track execution time
 *
 * Never modifies business logic; only improves observability.
 */
export class Logger {
  private level: LogLevel;
  private module: string;
  private transports: ILogTransport[];
  private executionStacks: Map<string, number> = new Map();

  constructor(module: string, level: LogLevel, transports: ILogTransport[]) {
    this.module = module;
    this.level = level;
    this.transports = transports;
  }

  /**
   * Log at TRACE level - for very detailed debugging
   */
  trace(message: string, context?: LogContext): void {
    this.log(LogLevel.TRACE, message, context);
  }

  /**
   * Log at DEBUG level - for development debugging
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log at INFO level - for general informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log at WARN level - for warnings that don't prevent execution
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log at ERROR level - for errors and exceptions
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.logError(LogLevel.ERROR, message, error, context);
  }

  /**
   * Start timing a named operation.
   * Use with endTimer() to measure execution duration.
   */
  startTimer(operationName: string): void {
    this.executionStacks.set(operationName, Date.now());
  }

  /**
   * End timing and log the duration.
   */
  endTimer(operationName: string, context?: LogContext): number {
    const startTime = this.executionStacks.get(operationName);
    if (!startTime) {
      this.warn(`Timer "${operationName}" was not started`, { operationName });
      return 0;
    }

    const duration = Date.now() - startTime;
    this.executionStacks.delete(operationName);

    const durationContext = { ...context, duration: `${duration} ms` };
    this.info(`${operationName} completed`, durationContext);

    return duration;
  }

  /**
   * Get current configured log level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Set log level (useful for runtime configuration)
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Add additional transport
   */
  addTransport(transport: ILogTransport): void {
    this.transports.push(transport);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (level < this.level) {
      return;
    }

    const timestamp = new Date();
    this.transports.forEach((transport) => {
      transport.write(level, timestamp, this.module, message, context);
    });
  }

  /**
   * Error logging with stack trace
   */
  private logError(level: LogLevel, message: string, error?: Error, context?: LogContext): void {
    if (level < this.level) {
      return;
    }

    const timestamp = new Date();
    this.transports.forEach((transport) => {
      transport.write(level, timestamp, this.module, message, context, error);
    });
  }
}

/**
 * Console transport - outputs to stdout/stderr with colors
 */
export class ConsoleTransport implements ILogTransport {
  private useColors: boolean;

  constructor(useColors: boolean = true) {
    this.useColors = useColors;
  }

  write(
    level: LogLevel,
    timestamp: Date,
    module: string,
    message: string,
    context?: LogContext,
    error?: Error,
  ): void {
    const levelName = LogLevelNames[level];
    const timeStr = timestamp.toISOString();
    const contextStr = context && Object.keys(context).length > 0 ? JSON.stringify(context) : '';

    const lines: string[] = [];

    // Main log line
    const mainLine = `[${timeStr}] [${levelName}] [${module}] ${message}${contextStr ? ' ' + contextStr : ''}`;
    lines.push(colorize(level, mainLine, this.useColors));

    // Error stack trace if present
    if (error && error.stack) {
      const stackLines = error.stack.split('\n').map((line) => `  ${line}`);
      lines.push(colorize(LogLevel.ERROR, stackLines.join('\n'), this.useColors));
    }

    // Output to appropriate stream
    if (level === LogLevel.ERROR || level === LogLevel.WARN) {
      console.error(lines.join('\n'));
    } else {
      console.log(lines.join('\n'));
    }
  }
}
