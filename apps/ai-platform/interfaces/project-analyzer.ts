import type { ProjectStructure } from '../models/project-structure.js';

export interface IProjectAnalyzer {
  analyze(projectRootPath: string): Promise<ProjectStructure>;
  analyzeAsJson(projectRootPath: string): Promise<string>;
}
