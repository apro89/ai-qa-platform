import type { IProjectAnalyzer } from '../interfaces/project-analyzer.js';
import { toProjectStructureJson, type ProjectStructure } from '../models/project-structure.js';
import { DependencyAnalyzer } from './dependency-analyzer.js';
import { PatternDetector } from './pattern-detector.js';
import { ProjectParser } from './project-parser.js';
import { ProjectScanner } from './project-scanner.js';
import { ProjectStructureBuilder } from './project-structure-builder.js';

export class ProjectAnalyzer implements IProjectAnalyzer {
  public constructor(
    private readonly scanner: ProjectScanner,
    private readonly parser: ProjectParser,
    private readonly builder: ProjectStructureBuilder,
    private readonly dependencyAnalyzer: DependencyAnalyzer,
    private readonly patternDetector: PatternDetector,
  ) {}

  public async analyze(projectRootPath: string): Promise<ProjectStructure> {
    const scanned = await this.scanner.scan(projectRootPath);
    const parsed = this.parser.parse(scanned);
    const dependencies = this.dependencyAnalyzer.analyze(scanned);
    const patternResult = this.patternDetector.detect({ parsed, project: scanned });

    const topLevelFolders = Array.from(
      new Set(
        scanned.folders.map((folder) => folder.split('/')[0]).filter((segment) => Boolean(segment)),
      ),
    ).sort((left, right) => left.localeCompare(right));

    return this.builder.build({
      parsed,
      dependencies,
      detectedPattern: patternResult.detectedPattern,
      supportedPatterns: patternResult.supportedPatterns,
      projectStructure: topLevelFolders,
    });
  }

  public async analyzeAsJson(projectRootPath: string): Promise<string> {
    const structure = await this.analyze(projectRootPath);
    return toProjectStructureJson(structure);
  }
}
