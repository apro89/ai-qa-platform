# Logger Quick Reference

## Creating a Logger

```typescript
import { createLogger } from '@automation/logger/index.js';

const logger = createLogger('ModuleName');
```

## Log Methods

```typescript
// Most verbose (for very detailed debugging)
logger.trace('message', { context: 'data' });

// Development debugging
logger.debug('message', { context: 'data' });

// General information (default level)
logger.info('message', { context: 'data' });

// Warnings (non-fatal issues)
logger.warn('message', { context: 'data' });

// Errors (always include the Error object)
logger.error('message', error, { context: 'data' });
```

## Timing Operations

```typescript
logger.startTimer('operation');
// ... do work ...
logger.endTimer('operation', { result: 'success' });

// Output: [INFO] operation completed in 42 ms
```

## Error Handling Pattern

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error as Error, {
    operation: 'riskyOperation',
    userId: user.id,
  });
  throw error; // Never swallow!
}
```

## Running with Debugging

```bash
# Enable DEBUG level logging
pnpm dev --debug

# Enable TRACE level (most detailed)
pnpm dev --trace

# Via environment variable
LOG_LEVEL=0 pnpm dev    # TRACE
LOG_LEVEL=1 pnpm dev    # DEBUG
LOG_LEVEL=2 pnpm dev    # INFO (default)
LOG_LEVEL=3 pnpm dev    # WARN
LOG_LEVEL=4 pnpm dev    # ERROR
```

## Common Patterns

### Service Start/Complete

```typescript
logger.info('Starting operation', { input: 'value' });
try {
  const result = await performWork();
  logger.info('Operation completed', { output: result });
  return result;
} catch (error) {
  logger.error('Operation failed', error as Error, { input: 'value' });
  throw error;
}
```

### Filesystem Operations

```typescript
logger.debug('Reading file', { path: filePath });
const content = await fs.readFile(filePath);
logger.trace('File read', { bytes: content.length });
```

### Decision Points

```typescript
logger.debug('Evaluating condition', { value: x });
if (shouldProceed(x)) {
  logger.debug('Condition met', { reason: 'value exceeded threshold' });
} else {
  logger.debug('Condition not met', { reason: 'value too low' });
}
```

### Loops/Collections

```typescript
logger.debug('Processing items', { count: items.length });
for (const item of items) {
  logger.trace('Processing item', { id: item.id });
}
logger.debug('Finished processing', { count: items.length });
```

## What NOT to Log

❌ Passwords, API keys, tokens, credentials
❌ Personal identifiable information
❌ Extremely large objects/arrays
❌ Sensitive business data
✅ Module name and operation
✅ Input parameters (non-sensitive)
✅ Output results (non-sensitive)
✅ Timing information
✅ Error messages and stack traces
✅ Decision reasoning

## Colors in Terminal Output

```
TRACE (gray):   Very detailed, usually disabled
DEBUG (cyan):   Development troubleshooting
INFO (green):   Normal operation milestones
WARN (yellow):  Issues requiring attention
ERROR (red):    Failures and exceptions
```

## Extending with Custom Transports

See [logger/README.md](./README.md#extending-with-new-transports) for examples of adding:

- FileTransport - write logs to disk
- JSONTransport - structured JSON output
- OpenTelemetryTransport - integrate with observability
- AzureMonitorTransport - cloud logging

## Architecture Summary

```
createLogger('Module')
  ↓
Logger instance
  ├─ Filters by level
  ├─ Tracks execution time
  └─ Routes to transports
       ├─ ConsoleTransport (colored stdout)
       ├─ (Optional) FileTransport
       └─ (Optional) OpenTelemetryTransport
```

---

For full documentation, see [logger/README.md](./README.md)
