/**
 * ProjectContext
 *
 * A compact, AI-agent-friendly representation of a project.
 * Derived from ProjectStructure but optimized for consumption by AI agents.
 *
 * Contains:
 * - Framework and architecture metadata
 * - Naming conventions and patterns
 * - Coding style analysis
 * - Reusable components
 * - Import patterns
 * - Dependency overview
 */

export interface NamingConvention {
  pattern: string;
  examples: string[];
  description: string;
}

export interface NamingConventions {
  pages: NamingConvention;
  tasks: NamingConvention;
  interactions: NamingConvention;
  questions: NamingConvention;
  tests: NamingConvention;
  components: NamingConvention;
  files: NamingConvention;
}

export interface CodingStyle {
  asyncAwait: boolean;
  assertionLibrary: string | null;
  locatorStyle: string | null;
  importStyle: 'absolute' | 'relative' | 'mixed';
  moduleSyntax: 'esm' | 'cjs' | 'mixed';
  typeScriptUsage: boolean;
  decoratorsUsed: boolean;
}

export interface ArtifactRef {
  name: string;
  path: string;
}

export interface ImportPattern {
  source: string;
  targets: string[];
  frequency: number;
  percentage: number;
}

export interface DependencyInfo {
  name: string;
  version: string | null;
  scope: 'dependencies' | 'devDependencies';
  purpose: string | null;
}

export interface ReusableObject {
  type: 'page' | 'task' | 'question' | 'interaction' | 'component' | 'fixture' | 'utility';
  name: string;
  path: string;
  description: string | null;
  relatedObjects: string[];
  usageCount: number | null;
}

export interface ProjectContext {
  // Framework and architecture
  framework: string;
  frameworkVersion: string | null;
  typescriptVersion: string | null;
  architecture: string;
  supportedArchitectures: string[];

  // Project structure
  folderStructure: Record<string, string[]>;

  // Artifacts
  pages: ArtifactRef[];
  tasks: ArtifactRef[];
  interactions: ArtifactRef[];
  questions: ArtifactRef[];
  components: ArtifactRef[];
  fixtures: ArtifactRef[];
  utilities: ArtifactRef[];
  configurations: ArtifactRef[];

  // Conventions and style
  namingConventions: NamingConventions;
  codingStyle: CodingStyle;

  // Reusable patterns
  reusableObjects: ReusableObject[];
  commonPatterns: string[];

  // Imports and dependencies
  importPatterns: ImportPattern[];
  topDependencies: DependencyInfo[];

  // Metadata
  metadata: {
    builtAt: string;
    projectRoot: string;
    totalArtifacts: number;
    totalDependencies: number;
  };
}
