/**
 * Severity levels for validation issues.
 */
export enum ValidationSeverity {
  /**
   * Critical error - generation cannot proceed.
   */
  ERROR = 'error',

  /**
   * Warning - generation can proceed but issue should be reviewed.
   */
  WARNING = 'warning',

  /**
   * Information - non-blocking notification.
   */
  INFO = 'info',
}

/**
 * Get numeric value for sorting severity levels.
 */
export function getSeverityLevel(severity: ValidationSeverity): number {
  switch (severity) {
    case ValidationSeverity.ERROR:
      return 3;
    case ValidationSeverity.WARNING:
      return 2;
    case ValidationSeverity.INFO:
      return 1;
  }
}

/**
 * Compare two severity levels.
 */
export function compareSeverity(a: ValidationSeverity, b: ValidationSeverity): number {
  return getSeverityLevel(b) - getSeverityLevel(a);
}
