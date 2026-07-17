export type PatternType = 'screenplay' | 'page-object-model' | 'hybrid' | 'unknown';

export interface FrameworkInfo {
  name: 'playwright';
  version: string | null;
  typescriptVersion: string | null;
  detectedPattern: PatternType;
  supportedPatterns: PatternType[];
  projectStructure: string[];
}

export interface ArtifactRef {
  name: string;
  path: string;
}

export interface PackageDependency {
  name: string;
  version: string;
  scope: 'dependencies' | 'devDependencies';
}

export interface PlaywrightConfigInfo {
  path: string;
  format: 'ts' | 'js' | 'mjs' | 'cjs';
}

export interface PackageInfo {
  name: string | null;
  version: string | null;
  private: boolean | null;
}

export interface ProjectStructure {
  framework: FrameworkInfo;
  folders: Record<string, string[]>;
  pages: ArtifactRef[];
  components: ArtifactRef[];
  tasks: ArtifactRef[];
  interactions: ArtifactRef[];
  questions: ArtifactRef[];
  fixtures: ArtifactRef[];
  tests: ArtifactRef[];
  utilities: ArtifactRef[];
  configurations: ArtifactRef[];
  dependencies: PackageDependency[];
  playwrightConfig: PlaywrightConfigInfo | null;
  packageInfo: PackageInfo | null;
}

export function toProjectStructureJson(structure: ProjectStructure): string {
  return JSON.stringify(structure, null, 2);
}
