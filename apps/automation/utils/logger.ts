export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export class Logger {
  private static write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const details = context ? ` ${JSON.stringify(context)}` : '';
    console.log(`[${new Date().toISOString()}] ${level} ${message}${details}`);
  }

  static debug(message: string, context?: Record<string, unknown>): void {
    this.write('DEBUG', message, context);
  }
  static info(message: string, context?: Record<string, unknown>): void {
    this.write('INFO', message, context);
  }
  static warn(message: string, context?: Record<string, unknown>): void {
    this.write('WARN', message, context);
  }
  static error(message: string, context?: Record<string, unknown>): void {
    this.write('ERROR', message, context);
  }
}
