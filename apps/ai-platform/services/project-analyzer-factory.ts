import { ProjectAnalyzer } from '../analyzers/project-analyzer.js';
import { DependencyAnalyzer } from '../analyzers/dependency-analyzer.js';
import { PatternDetector } from '../analyzers/pattern-detector.js';
import { ProjectParser } from '../analyzers/project-parser.js';
import { ProjectScanner } from '../analyzers/project-scanner.js';
import { ProjectStructureBuilder } from '../analyzers/project-structure-builder.js';
import type { IFilesystemMcpClient } from '../interfaces/filesystem-mcp-client.js';
import { FilesystemService } from './filesystem-service.js';

export function createProjectAnalyzer(filesystemMcpClient: IFilesystemMcpClient): ProjectAnalyzer {
  const filesystemService = new FilesystemService(filesystemMcpClient);
  const scanner = new ProjectScanner(filesystemService);
  const parser = new ProjectParser();
  const builder = new ProjectStructureBuilder();
  const dependencyAnalyzer = new DependencyAnalyzer();
  const patternDetector = new PatternDetector();

  return new ProjectAnalyzer(scanner, parser, builder, dependencyAnalyzer, patternDetector);
}
