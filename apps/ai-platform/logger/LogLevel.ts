/**
 * Log level hierarchy: TRACE < DEBUG < INFO < WARN < ERROR
 * Only messages at or above the configured level will be logged.
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

export const LogLevelNames: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

export const LogLevelColors: Record<LogLevel, string> = {
  [LogLevel.TRACE]: '\x1b[90m', // Bright black (gray)
  [LogLevel.DEBUG]: '\x1b[36m', // Cyan
  [LogLevel.INFO]: '\x1b[32m', // Green
  [LogLevel.WARN]: '\x1b[33m', // Yellow
  [LogLevel.ERROR]: '\x1b[31m', // Red
};

const colorReset = '\x1b[0m';

export function colorize(level: LogLevel, text: string, useColor: boolean = true): string {
  if (!useColor) {
    return text;
  }
  return `${LogLevelColors[level]}${text}${colorReset}`;
}
