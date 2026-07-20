import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import type { GenerationResult } from '@automation/response/models/GenerationResult.js';
import type { ValidatedGeneration, ValidationReport } from '../models/ValidatedGeneration.js';
import { ValidatedGenerationBuilder } from '../models/ValidatedGeneration.js';
import { ValidationSeverity, compareSeverity } from '../models/ValidationSeverity.js';
import { ValidationEngineError } from '../errors/ValidationEngineError.js';
import { ValidationPipeline } from './ValidationPipeline.js';
import { DuplicateDetector } from '../validators/DuplicateDetector.js';
import { ProjectConflictDetector } from '../validators/ProjectConflictDetector.js';

/**
 * Coordinates all validation activities.
 * Acts as the Validation & Quality Gate for the AI platform.
 */
export class ValidationEngine {
  private pipeline: ValidationPipeline;
  private duplicateDetector: DuplicateDetector;
  private conflictDetector: ProjectConflictDetector;

  constructor() {
    this.pipeline = new ValidationPipeline();
    this.duplicateDetector = new DuplicateDetector();
    this.conflictDetector = new ProjectConflictDetector();
  }

  /**
   * Initialize with project context (existing files, etc).
   */
  initializeWithProjectContext(config: {
    existingTasks?: string[];
    existingQuestions?: string[];
    existingInteractions?: string[];
    existingPages?: string[];
    existingFiles?: string[];
    forbiddenPaths?: string[];
  }): void {
    this.duplicateDetector.setExistingObjects(
      config.existingTasks || [],
      config.existingQuestions || [],
      config.existingInteractions || [],
      config.existingPages || [],
    );

    this.conflictDetector.setExistingFiles(config.existingFiles || []);
    this.conflictDetector.setForbiddenPaths(config.forbiddenPaths || []);

    // Register detectors with pipeline
    this.pipeline.register('DuplicateDetector', this.duplicateDetector);
    this.pipeline.register('ProjectConflictDetector', this.conflictDetector);
  }

  /**
   * Validate a GenerationResult.
   * This is the main entry point for Phase 7.
   */
  async validate(generationResult: GenerationResult): Promise<ValidatedGeneration> {
    const startTime = Date.now();

    if (!generationResult.success) {
      return this.handleFailedGeneration(generationResult, startTime);
    }

    const violations = [];
    const approvedFiles: GeneratedFile[] = [];
    const rejectedFiles: GeneratedFile[] = [];
    const validators: string[] = [];

    // Validate each file
    for (const file of generationResult.generatedFiles) {
      try {
        const validationResult = await this.pipeline.validate(file);
        violations.push(...validationResult.violations);
        validators.push(...validationResult.validatorsApplied);

        if (validationResult.isValid && validationResult.readyToWrite) {
          approvedFiles.push(file);
        } else {
          rejectedFiles.push(file);
        }
      } catch (error) {
        violations.push({
          ruleId: 'VALIDATION_ERROR',
          ruleName: 'Validation Error',
          severity: ValidationSeverity.ERROR,
          message: `Validation failed for file "${file.path}": ${error}`,
          category: 'validation',
          affectedFile: file,
        });
        rejectedFiles.push(file);
      }
    }

    // Calculate overall metrics
    const hasErrors = violations.some((v) => v.severity === ValidationSeverity.ERROR);
    const isValid = !hasErrors;
    const qualityScore = this.calculateOverallQualityScore(approvedFiles, violations);
    const executionTimeMs = Date.now() - startTime;

    // Build validation report
    const report = this.generateValidationReport(
      violations,
      approvedFiles,
      rejectedFiles,
      qualityScore,
    );

    // Build result
    const builder = new ValidatedGenerationBuilder()
      .withTotalFilesValidated(generationResult.generatedFiles.length)
      .withApprovedFiles(approvedFiles)
      .withRejectedFiles(rejectedFiles)
      .withIsValid(isValid)
      .withQualityScore(qualityScore)
      .withReadyToWrite(isValid && approvedFiles.length > 0)
      .withViolations(violations)
      .withExecutionTimeMs(executionTimeMs)
      .withReport(report)
      .withValidators([...new Set(validators)]);

    return builder.build();
  }

  /**
   * Get validation pipeline for advanced configuration.
   */
  getPipeline(): ValidationPipeline {
    return this.pipeline;
  }

  /**
   * Get duplicate detector for advanced configuration.
   */
  getDuplicateDetector(): DuplicateDetector {
    return this.duplicateDetector;
  }

  /**
   * Get conflict detector for advanced configuration.
   */
  getConflictDetector(): ProjectConflictDetector {
    return this.conflictDetector;
  }

  private handleFailedGeneration(
    generationResult: GenerationResult,
    startTime: number,
  ): ValidatedGeneration {
    const failureReason = generationResult.metadata?.failureReason || 'Unknown failure';

    const violations = [
      {
        ruleId: 'GENERATION_FAILED',
        ruleName: 'Generation Failed',
        severity: ValidationSeverity.ERROR,
        message: `Generation failed: ${failureReason}`,
        category: 'generation',
      },
    ];

    const report = this.generateValidationReport(violations, [], [], 0);

    return new ValidatedGenerationBuilder()
      .withTotalFilesValidated(0)
      .withApprovedFiles([])
      .withRejectedFiles([])
      .withIsValid(false)
      .withQualityScore(0)
      .withReadyToWrite(false)
      .withViolations(violations)
      .withExecutionTimeMs(Date.now() - startTime)
      .withReport(report)
      .build();
  }

  private calculateOverallQualityScore(
    approvedFiles: GeneratedFile[],
    violations: ReturnType<typeof this.groupViolationsBySeverity>[],
  ): number {
    if (approvedFiles.length === 0) {
      return 0;
    }

    let score = 100;

    // Degrade based on violation counts
    const severityGroups = this.groupViolationsBySeverity(violations);
    score -= (severityGroups[ValidationSeverity.ERROR] || []).length * 15;
    score -= (severityGroups[ValidationSeverity.WARNING] || []).length * 5;
    score -= (severityGroups[ValidationSeverity.INFO] || []).length * 1;

    return Math.max(0, Math.min(100, score));
  }

  private groupViolationsBySeverity(
    violations: Record<string, unknown>[],
  ): Record<string, Record<string, unknown>[]> {
    const grouped: Record<string, Record<string, unknown>[]> = {};

    for (const violation of violations) {
      const severity = (violation.severity as string) || ValidationSeverity.INFO;
      if (!grouped[severity]) {
        grouped[severity] = [];
      }
      grouped[severity].push(violation);
    }

    return grouped;
  }

  private generateValidationReport(
    violations: Record<string, unknown>[],
    approvedFiles: GeneratedFile[],
    rejectedFiles: GeneratedFile[],
    qualityScore: number,
  ): ValidationReport {
    // Group violations
    const byCategory: Record<string, Record<string, unknown>[]> = {};
    const bySeverity: Record<string, Record<string, unknown>[]> = {};
    const byFile: Record<string, Record<string, unknown>[]> = {};

    for (const violation of violations) {
      const category = (violation.category as string) || 'unknown';
      const severity = (violation.severity as string) || ValidationSeverity.INFO;
      const filePath = (violation.affectedFile as GeneratedFile)?.path || 'unknown';

      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(violation);

      if (!bySeverity[severity]) bySeverity[severity] = [];
      bySeverity[severity].push(violation);

      if (!byFile[filePath]) byFile[filePath] = [];
      byFile[filePath].push(violation);
    }

    // Sort violations by severity
    const severities = Object.keys(bySeverity);
    severities.sort((a, b) => compareSeverity(a as ValidationSeverity, b as ValidationSeverity));

    // Generate summary
    const summary = this.generateSummary(approvedFiles, rejectedFiles, qualityScore, bySeverity);

    // Generate recommendations
    const recommendations = this.generateRecommendations(violations, rejectedFiles);

    // Score breakdown
    const scoreBreakdown = this.calculateScoreBreakdown(violations);

    return {
      summary,
      byCategory,
      bySeverity,
      byFile,
      scoreBreakdown,
      recommendations,
    };
  }

  private generateSummary(
    approvedFiles: GeneratedFile[],
    rejectedFiles: GeneratedFile[],
    qualityScore: number,
    bySeverity: Record<string, Record<string, unknown>[]>,
  ): string {
    const errorCount = (bySeverity[ValidationSeverity.ERROR] || []).length;
    const warningCount = (bySeverity[ValidationSeverity.WARNING] || []).length;
    const infoCount = (bySeverity[ValidationSeverity.INFO] || []).length;

    const parts: string[] = [];
    parts.push(`Validation Quality: ${qualityScore}%`);
    parts.push(`Approved Files: ${approvedFiles.length}`);
    parts.push(`Rejected Files: ${rejectedFiles.length}`);

    if (errorCount > 0) {
      parts.push(`Errors: ${errorCount}`);
    }
    if (warningCount > 0) {
      parts.push(`Warnings: ${warningCount}`);
    }
    if (infoCount > 0) {
      parts.push(`Info: ${infoCount}`);
    }

    return parts.join(' | ');
  }

  private generateRecommendations(
    violations: Record<string, unknown>[],
    rejectedFiles: GeneratedFile[],
  ): string[] {
    const recommendations: string[] = [];

    if (rejectedFiles.length > 0) {
      recommendations.push(`Fix ${rejectedFiles.length} rejected file(s) before proceeding`);
    }

    // Count error types
    const errorTypes = new Map<string, number>();
    for (const v of violations) {
      if ((v.severity as string) === ValidationSeverity.ERROR) {
        const ruleId = (v.ruleId as string) || 'unknown';
        errorTypes.set(ruleId, (errorTypes.get(ruleId) || 0) + 1);
      }
    }

    // Add specific recommendations
    if (errorTypes.has('NAMING_INVALID_EXTENSION')) {
      recommendations.push('Ensure all files use .ts extension');
    }
    if (errorTypes.has('SCREENPLAY_WRONG_BASE_CLASS')) {
      recommendations.push('Verify Screenplay pattern implementation');
    }
    if (errorTypes.has('DUPLICATE_TASK') || errorTypes.has('DUPLICATE_QUESTION')) {
      recommendations.push('Choose different names to avoid duplicates');
    }

    return recommendations;
  }

  private calculateScoreBreakdown(violations: Record<string, unknown>[]): Record<string, number> {
    const breakdown: Record<string, number> = {
      naming: 25,
      architecture: 25,
      imports: 20,
      syntax: 20,
      'code-quality': 10,
    };

    // Reduce scores based on violations in each category
    for (const violation of violations) {
      const category = (violation.category as string) || 'unknown';
      if (breakdown[category]) {
        const penalty = (violation.severity as string) === ValidationSeverity.ERROR ? 5 : 1;
        breakdown[category] -= penalty;
      }
    }

    // Ensure no negative scores
    for (const key in breakdown) {
      breakdown[key] = Math.max(0, breakdown[key]);
    }

    return breakdown;
  }
}
