import type { ProjectStructure } from '../models/project-structure.js';
import type { ParsedProjectArtifacts } from '../models/scan-models.js';
import { safeArtifactName } from '../utils/path-utils.js';
import type { DependencyAnalysisResult } from './dependency-analyzer.js';
import type { PatternType } from '../models/project-structure.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('ProjectStructureBuilder');

export class ProjectStructureBuilder {
  public build(input: {
    parsed: ParsedProjectArtifacts;
    dependencies: DependencyAnalysisResult;
    detectedPattern: PatternType;
    supportedPatterns: PatternType[];
    projectStructure: string[];
  }): ProjectStructure {
    logger.debug('Building project structure', {
      pattern: input.detectedPattern,
      supportedPatterns: input.supportedPatterns,
      topLevelFolders: input.projectStructure.length,
    });

    const structure: ProjectStructure = {
      framework: {
        name: 'playwright',
        version: input.dependencies.playwrightVersion,
        typescriptVersion: input.dependencies.typescriptVersion,
        detectedPattern: input.detectedPattern,
        supportedPatterns: input.supportedPatterns,
        projectStructure: input.projectStructure,
      },
      folders: input.parsed.folders,
      pages: this.toArtifactRefs(input.parsed.pages),
      components: this.toArtifactRefs(input.parsed.components),
      tasks: this.toArtifactRefs(input.parsed.tasks),
      interactions: this.toArtifactRefs(input.parsed.interactions),
      questions: this.toArtifactRefs(input.parsed.questions),
      fixtures: this.toArtifactRefs(input.parsed.fixtures),
      tests: this.toArtifactRefs(input.parsed.tests),
      utilities: this.toArtifactRefs(input.parsed.utilities),
      configurations: this.toArtifactRefs(input.parsed.configurations),
      dependencies: input.dependencies.dependencies,
      playwrightConfig: input.dependencies.playwrightConfig,
      packageInfo: input.dependencies.packageInfo,
    };

    logger.info('Project structure built', {
      pages: structure.pages.length,
      tasks: structure.tasks.length,
      tests: structure.tests.length,
      components: structure.components.length,
      dependencies: structure.dependencies.length,
      playwrightVersion: input.dependencies.playwrightVersion,
    });

    logger.trace('Framework details', {
      framework: structure.framework,
    });

    return structure;
  }

  private toArtifactRefs(paths: string[]): Array<{ name: string; path: string }> {
    return paths.map((artifactPath) => ({
      name: safeArtifactName(artifactPath),
      path: artifactPath,
    }));
  }
}
