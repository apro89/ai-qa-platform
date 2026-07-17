export { ProjectAnalyzer } from './analyzers/project-analyzer.js';
export { ProjectScanner } from './analyzers/project-scanner.js';
export { ProjectParser } from './analyzers/project-parser.js';
export { ProjectStructureBuilder } from './analyzers/project-structure-builder.js';
export { PatternDetector } from './analyzers/pattern-detector.js';
export { DependencyAnalyzer } from './analyzers/dependency-analyzer.js';
export { FilesystemService } from './services/filesystem-service.js';
export { createProjectAnalyzer } from './services/project-analyzer-factory.js';
export { ProjectIntelligenceService } from './services/project-intelligence-service.js';
export { ProjectIntelligenceAgent } from './agents/project-intelligence-agent.js';
export { FilesystemMcpClient } from './mcp/filesystem-mcp-client.js';
export type {
  ArtifactRef,
  FrameworkInfo,
  PackageDependency,
  PackageInfo,
  PatternType,
  PlaywrightConfigInfo,
  ProjectStructure,
} from './models/project-structure.js';
export { toProjectStructureJson } from './models/project-structure.js';
export type { IProjectAnalyzer } from './interfaces/project-analyzer.js';
export type { DirectoryEntry, IFilesystemMcpClient } from './interfaces/filesystem-mcp-client.js';
