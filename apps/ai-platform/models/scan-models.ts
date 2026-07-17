export interface ScannedFile {
  path: string;
  name: string;
  extension: string;
  content?: string;
}

export interface ScannedProject {
  rootPath: string;
  folders: string[];
  files: ScannedFile[];
}

export interface ParsedProjectArtifacts {
  folders: Record<string, string[]>;
  pages: string[];
  components: string[];
  tasks: string[];
  interactions: string[];
  questions: string[];
  fixtures: string[];
  tests: string[];
  utilities: string[];
  configurations: string[];
}

export interface PackageJsonModel {
  name?: string;
  version?: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}
