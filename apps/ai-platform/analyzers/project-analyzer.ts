import type { IProjectAnalyzer } from '../interfaces/project-analyzer.js';
import { toProjectStructureJson, type ProjectStructure } from '../models/project-structure.js';
import { DependencyAnalyzer } from './dependency-analyzer.js';
import { PatternDetector } from './pattern-detector.js';
import { ProjectParser } from './project-parser.js';
import { ProjectScanner } from './project-scanner.js';
import { ProjectStructureBuilder } from './project-structure-builder.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('ProjectAnalyzer');

export class ProjectAnalyzer implements IProjectAnalyzer {
  public constructor(
    private readonly scanner: ProjectScanner,
    private readonly parser: ProjectParser,
    private readonly builder: ProjectStructureBuilder,
    private readonly dependencyAnalyzer: DependencyAnalyzer,
    private readonly patternDetector: PatternDetector,
  ) {}

  public async analyze(projectRootPath: string): Promise<ProjectStructure> {
    logger.startTimer('projectAnalysis');
    logger.info('Starting Project Analysis', { workspace: projectRootPath });

    try {
      // Scanning phase
      logger.debug('Scanning project structure...');
      const scanned = await this.scanner.scan(projectRootPath);
      logger.info('Project scan completed', {
        folders: scanned.folders.length,
        files: scanned.files.length,
      });

      // Parsing phase
      logger.debug('Parsing scanned project...');
      const parsed = this.parser.parse(scanned);
      logger.info('Project parsing completed', {
        parsedComponents: Object.keys(parsed).length,
      });

      // Dependency analysis phase
      logger.debug('Analyzing dependencies...');
      const dependencies = this.dependencyAnalyzer.analyze(scanned);
      logger.info('Dependency analysis completed', {
        dependencies: Object.keys(dependencies).length,
      });

      // Pattern detection phase
      logger.debug('Detecting framework pattern...');
      const patternResult = this.patternDetector.detect({ parsed, project: scanned });
      logger.info('Pattern detected', {
        pattern: patternResult.detectedPattern,
      });

      // Building final structure
      logger.debug('Building project structure...');
      const topLevelFolders = Array.from(
        new Set(
          scanned.folders
            .map((folder) => folder.split('/')[0])
            .filter((segment) => Boolean(segment)),
        ),
      ).sort((left, right) => left.localeCompare(right));

      const result = this.builder.build({
        parsed,
        dependencies,
        detectedPattern: patternResult.detectedPattern,
        supportedPatterns: patternResult.supportedPatterns,
        projectStructure: topLevelFolders,
      });

      const duration = logger.endTimer('projectAnalysis', {
        topLevelFolders: topLevelFolders.length,
      });

      logger.info('Project analysis completed successfully', {
        duration: `${duration} ms`,
      });

      return result;
    } catch (error) {
      logger.error('Project analysis failed', error as Error, {
        workspace: projectRootPath,
      });
      throw error;
    }
  }

  public async analyzeAsJson(projectRootPath: string): Promise<string> {
    try {
      logger.debug('Generating JSON representation', { workspace: projectRootPath });
      const structure = await this.analyze(projectRootPath);
      const json = toProjectStructureJson(structure);
      logger.debug('JSON representation generated', {
        size: `${json.length} bytes`,
      });
      return json;
    } catch (error) {
      logger.error('Failed to generate JSON representation', error as Error, {
        workspace: projectRootPath,
      });
      throw error;
    }
  }
}
