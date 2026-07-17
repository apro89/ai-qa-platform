import type { ProjectStructure } from '../models/project-structure.js';
import { ProjectAnalyzer } from '../analyzers/project-analyzer.js';

export class ProjectIntelligenceService {
  public constructor(private readonly analyzer: ProjectAnalyzer) {}

  public async getProjectStructure(projectRootPath: string): Promise<ProjectStructure> {
    return this.analyzer.analyze(projectRootPath);
  }

  public async getProjectStructureJson(projectRootPath: string): Promise<string> {
    return this.analyzer.analyzeAsJson(projectRootPath);
  }
}
