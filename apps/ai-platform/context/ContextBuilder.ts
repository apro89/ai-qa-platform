import type { ProjectStructure } from '../models/project-structure.js';
import type { ScannedProject } from '../models/scan-models.js';
import type { ProjectContext } from '../context/ProjectContext.js';
import { NamingConventionService } from '../context/NamingConventionService.js';
import { CodingStyleAnalyzer } from '../context/CodingStyleAnalyzer.js';
import { ImportAnalyzer } from '../context/ImportAnalyzer.js';
import { DependencyMapper } from '../context/DependencyMapper.js';
import { ReusableCodeDetector } from '../context/ReusableCodeDetector.js';
import { ContextValidator } from '../context/ContextValidator.js';
import { ContextSerializer } from '../context/ContextSerializer.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('ContextBuilder');

/**
 * ContextBuilder
 *
 * Orchestrates the transformation of ProjectStructure → ProjectContext
 *
 * Responsibilities:
 * - Coordinate analysis services
 * - Build ProjectContext model
 * - Validate consistency
 * - Serialize output
 */
export class ContextBuilder {
  private readonly namingService: NamingConventionService;
  private readonly styleAnalyzer: CodingStyleAnalyzer;
  private readonly importAnalyzer: ImportAnalyzer;
  private readonly dependencyMapper: DependencyMapper;
  private readonly codeDetector: ReusableCodeDetector;
  private readonly validator: ContextValidator;
  private readonly serializer: ContextSerializer;

  constructor(
    namingService?: NamingConventionService,
    styleAnalyzer?: CodingStyleAnalyzer,
    importAnalyzer?: ImportAnalyzer,
    dependencyMapper?: DependencyMapper,
    codeDetector?: ReusableCodeDetector,
  ) {
    this.namingService = namingService || new NamingConventionService();
    this.styleAnalyzer = styleAnalyzer || new CodingStyleAnalyzer();
    this.importAnalyzer = importAnalyzer || new ImportAnalyzer();
    this.dependencyMapper = dependencyMapper || new DependencyMapper();
    this.codeDetector = codeDetector || new ReusableCodeDetector();
    this.validator = new ContextValidator();
    this.serializer = new ContextSerializer();
  }

  public async build(
    structure: ProjectStructure,
    scannedProject: ScannedProject,
  ): Promise<ProjectContext> {
    logger.startTimer('contextBuilding');
    logger.info('Starting Project Context building', {
      artifacts: structure.pages.length + structure.tasks.length,
      dependencies: structure.dependencies.length,
    });

    try {
      // Build naming conventions
      logger.debug('Analyzing naming conventions');
      const namingConventions = {
        pages: this.namingService.analyzePagesNaming(structure.pages.map((p) => p.path)),
        tasks: this.namingService.analyzeTasksNaming(structure.tasks.map((t) => t.path)),
        interactions: this.namingService.analyzeInteractionsNaming(
          structure.interactions.map((i) => i.path),
        ),
        questions: this.namingService.analyzeQuestionsNaming(
          structure.questions.map((q) => q.path),
        ),
        tests: this.namingService.analyzeTestsNaming(structure.tests.map((t) => t.path)),
        components: this.namingService.analyzeComponentsNaming(
          structure.components.map((c) => c.path),
        ),
        files: this.namingService.analyzeFilesNaming(scannedProject.files.map((f) => f.path)),
      };

      // Analyze coding style
      logger.debug('Analyzing coding style');
      const codingStyle = this.styleAnalyzer.analyze(scannedProject);

      // Analyze import patterns
      logger.debug('Analyzing import patterns');
      const importPatterns = this.importAnalyzer.analyzeImportPatterns(scannedProject);

      // Map dependencies
      logger.debug('Mapping dependencies');
      const mappedDeps = this.dependencyMapper.mapDependencies(structure.dependencies);

      // Detect reusable objects
      logger.debug('Detecting reusable objects');
      const reusableObjects = this.codeDetector.detectReusableObjects(structure);

      // Detect common patterns
      logger.debug('Detecting common patterns');
      const commonPatterns = this.codeDetector.detectCommonPatterns(structure);

      // Build context
      const context: ProjectContext = {
        framework: structure.framework.name,
        frameworkVersion: structure.framework.version,
        typescriptVersion: structure.framework.typescriptVersion,
        architecture: structure.framework.detectedPattern,
        supportedArchitectures: structure.framework.supportedPatterns,
        folderStructure: structure.folders,
        pages: structure.pages,
        tasks: structure.tasks,
        interactions: structure.interactions,
        questions: structure.questions,
        components: structure.components,
        fixtures: structure.fixtures,
        utilities: structure.utilities,
        configurations: structure.configurations,
        namingConventions,
        codingStyle,
        reusableObjects,
        commonPatterns,
        importPatterns,
        topDependencies: mappedDeps,
        metadata: {
          builtAt: new Date().toISOString(),
          projectRoot: scannedProject.rootPath,
          totalArtifacts:
            structure.pages.length +
            structure.tasks.length +
            structure.interactions.length +
            structure.questions.length +
            structure.components.length +
            structure.fixtures.length +
            structure.utilities.length,
          totalDependencies: structure.dependencies.length,
        },
      };

      logger.info('Project Context built', {
        artifacts: context.metadata.totalArtifacts,
        reusable: context.reusableObjects.length,
        patterns: context.commonPatterns.length,
        dependencies: context.topDependencies.length,
      });

      // Validate context
      logger.debug('Validating context');
      const validation = this.validator.validate(context);

      if (!validation.valid) {
        logger.warn('Context validation failed', {
          errors: validation.errors.length,
          warnings: validation.warnings.length,
        });
      }

      logger.endTimer('contextBuilding', {
        valid: validation.valid,
        totalArtifacts: context.metadata.totalArtifacts,
      });

      return context;
    } catch (error) {
      logger.error('Failed to build Project Context', error as Error);
      throw error;
    }
  }

  public serialize(
    context: ProjectContext,
    format: 'json' | 'compact' | 'markdown' = 'json',
  ): string {
    logger.debug('Serializing context', { format });

    try {
      let result: string;

      switch (format) {
        case 'compact':
          result = this.serializer.toCompactJSON(context);
          break;
        case 'markdown':
          result = this.serializer.toMarkdown(context);
          break;
        case 'json':
        default:
          result = this.serializer.toJSON(context);
          break;
      }

      logger.debug('Context serialization completed', { format, size: result.length });
      return result;
    } catch (error) {
      logger.error('Failed to serialize context', error as Error, { format });
      throw error;
    }
  }
}
