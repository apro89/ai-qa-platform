# Centralized Logging System

A production-grade, extensible logging system for the AI QA Platform that follows Clean Architecture and SOLID principles.

## Design Goals

- **No console.log()**: All logging goes through the centralized logger
- **Observable**: Track execution flow, decisions, and failures
- **Extensible**: Support multiple transports (console, file, JSON, OpenTelemetry, Azure Monitor)
- **Performance-aware**: Measure execution time, log durations
- **Debug-friendly**: Support --debug and --trace modes
- **SOLID**: Single Responsibility, Open/Closed, Interface Segregation, Dependency Inversion

## Architecture

```
┌─────────────────────────────────────┐
│ Services / Analyzers                │
│ (Use Logger via createLogger())      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Logger Instance                     │
│ - Format messages                   │
│ - Filter by level                   │
│ - Track timers                      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ ILogTransport (Extensible)          │
├─────────────────────────────────────┤
│ - ConsoleTransport                  │
│ - (Future) FileTransport            │
│ - (Future) JSONTransport            │
│ - (Future) OpenTelemetryTransport   │
│ - (Future) AzureMonitorTransport    │
└─────────────────────────────────────┘
```

## Usage

### Basic Usage

```typescript
import { createLogger } from '@automation/logger/index.js';

const logger = createLogger('MyModule');

logger.info('Operation starting', { userId: 123 });
logger.debug('Processing item', { item: 'widget' });
logger.warn('Unusual condition detected', { condition: 'slow' });
logger.error('Operation failed', error, { context: 'data' });
```

### Timing Operations

```typescript
logger.startTimer('databaseQuery');
const result = await db.query('SELECT * FROM users');
logger.endTimer('databaseQuery', { rows: result.length });

// Output:
// [INFO] databaseQuery completed in 245 ms
```

### Error Handling

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed unexpectedly', error as Error, {
    operation: 'riskyOperation',
    userId: user.id,
  });
  throw error; // Never swallow exceptions
}
```

### Context Objects

```typescript
logger.info('Project analysis started', {
  workspace: '/home/user/project',
  framework: 'Playwright',
  pattern: 'Screenplay',
});

// Output includes JSON context:
// [INFO] [ProjectAnalyzer] Project analysis started {"workspace":"/home/user/project","framework":"Playwright","pattern":"Screenplay"}
```

## Log Levels

| Level | Numeric | Usage                                            |
| ----- | ------- | ------------------------------------------------ |
| TRACE | 0       | Very detailed debugging (disabled in production) |
| DEBUG | 1       | Development debugging, detailed flow             |
| INFO  | 2       | General informational messages (default)         |
| WARN  | 3       | Warnings that don't prevent execution            |
| ERROR | 4       | Errors and exceptions                            |

## Running with Debug Flags

```bash
# Enable DEBUG logging
pnpm dev --debug

# Enable TRACE logging (most verbose)
pnpm dev --trace

# Set via environment variable
LOG_LEVEL=1 pnpm dev
```

## Examples by Component

### ProjectAnalyzer

```
[INFO] Starting Project Analysis
[INFO] Workspace: /Users/me/projects/automation
[DEBUG] Scanning project structure...
[INFO] Project scan completed {"folders":12,"files":145}
[DEBUG] Parsing scanned project...
[INFO] Project parsing completed {"parsedComponents":8}
[DEBUG] Analyzing dependencies...
[INFO] Dependency analysis completed {"dependencies":24}
[DEBUG] Detecting framework pattern...
[INFO] Pattern detected {"pattern":"screenplay","reason":"Core folders found"}
[DEBUG] Building project structure...
[INFO] Project analysis completed in 182 ms {"topLevelFolders":8}
```

### FilesystemService

```
[DEBUG] Starting filesystem scan
[DEBUG] Scanning directory recursively
[TRACE] Reading directory /Users/me/projects/automation
[TRACE] Directory entries found {"path":"/Users/me/projects/automation","count":12}
[TRACE] Found folder tasks
[TRACE] Reading text file tests/authentication/login.spec.ts
[TRACE] Skipping binary file public/favicon.ico
[DEBUG] Filesystem scan completed {"folders":42,"files":189,"skipped":15}
```

### PatternDetector

```
[DEBUG] Starting pattern detection {"tasks":8,"pages":12,"interactions":6,"questions":4}
[TRACE] Pattern rule evaluated {"pattern":"screenplay","detected":true}
[TRACE] Pattern rule evaluated {"pattern":"page-object-model","detected":true}
[DEBUG] Pattern rules evaluated {"patternsFound":["screenplay","page-object-model"],"totalRules":2}
[INFO] Pattern detected {"pattern":"hybrid","reason":"Multiple patterns detected in project","evidence":["screenplay","page-object-model"]}
```

## Extending with New Transports

The logger is designed to support multiple transports without changing business logic.

### Example: File Transport

```typescript
import { ILogTransport, LogLevel, LogLevelNames } from '@automation/logger/Logger.js';
import fs from 'fs';

export class FileTransport implements ILogTransport {
  constructor(private readonly filePath: string) {}

  write(
    level: LogLevel,
    timestamp: Date,
    module: string,
    message: string,
    context?: any,
    error?: Error,
  ): void {
    const line = `[${timestamp.toISOString()}] [${LogLevelNames[level]}] [${module}] ${message}`;
    fs.appendFileSync(this.filePath, line + '\n');

    if (error && error.stack) {
      fs.appendFileSync(this.filePath, error.stack + '\n');
    }
  }
}

// Usage:
const factory = LoggerFactory.getInstance();
factory.addTransport(new FileTransport('./logs/app.log'));
```

### Example: JSON Transport (Future)

```typescript
export class JSONTransport implements ILogTransport {
  write(
    level: LogLevel,
    timestamp: Date,
    module: string,
    message: string,
    context?: any,
    error?: Error,
  ): void {
    const entry = {
      timestamp,
      level: LogLevelNames[level],
      module,
      message,
      context,
      error: error?.message,
      stack: error?.stack,
    };
    console.log(JSON.stringify(entry));
  }
}
```

## Future: OpenTelemetry Support

```typescript
export class OpenTelemetryTransport implements ILogTransport {
  constructor(private readonly logger: opentelemetry.api.Logger) {}

  write(
    level: LogLevel,
    timestamp: Date,
    module: string,
    message: string,
    context?: any,
    error?: Error,
  ): void {
    const severity = this.mapToSeverity(level);
    this.logger.emit({
      severityNumber: severity,
      severityText: LogLevelNames[level],
      body: message,
      attributes: {
        module: module,
        ...context,
      },
      ...(error && { exception: error.message }),
    });
  }

  private mapToSeverity(level: LogLevel): number {
    const severityMap: Record<LogLevel, number> = {
      [LogLevel.TRACE]: 1,
      [LogLevel.DEBUG]: 5,
      [LogLevel.INFO]: 9,
      [LogLevel.WARN]: 13,
      [LogLevel.ERROR]: 17,
    };
    return severityMap[level];
  }
}
```

## Best Practices

### ✅ DO

- Log the start and completion of operations
- Include context objects with relevant data
- Use appropriate log levels (DEBUG for flow, INFO for milestones, WARN for issues, ERROR for failures)
- Measure and log execution time for significant operations
- Include error stack traces when logging errors
- Use debug/trace mode during development

### ❌ DON'T

- Use console.log() directly
- Swallow exceptions without logging
- Log sensitive data (passwords, tokens, API keys)
- Log massive objects that will clutter output
- Use ERROR level for expected recoverable conditions
- Leave debug logging in production

## Integration Checklist

When adding a new service or analyzer:

- [ ] Import `createLogger` at module level
- [ ] Log operation start with relevant context
- [ ] Log key decision points at DEBUG level
- [ ] Use startTimer/endTimer for performance-critical sections
- [ ] Log successful completion at INFO level
- [ ] Use logger.error() for exceptions (never console.error)
- [ ] Test with `--debug` flag to verify log output

## References

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Structured Logging](https://www.kartar.net/2015/12/structured-logging/)
- [OpenTelemetry](https://opentelemetry.io/)
