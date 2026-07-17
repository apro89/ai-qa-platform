import type { ParsedProjectArtifacts, ScannedProject } from '../models/scan-models.js';

const CATEGORY_PATTERNS: Record<Exclude<keyof ParsedProjectArtifacts, 'folders'>, RegExp[]> = {
  pages: [/^pages\//, /\.page\.(ts|tsx|js|mjs|cjs)$/],
  components: [/^components\//],
  tasks: [/^tasks\//],
  interactions: [/^interactions\//],
  questions: [/^questions\//],
  fixtures: [/^fixtures\//],
  tests: [/^tests\//, /\.spec\.(ts|tsx|js|mjs|cjs)$/],
  utilities: [/^utils\//, /-util\.(ts|tsx|js|mjs|cjs)$/],
  configurations: [/^config\//, /playwright\.config\.(ts|js|mjs|cjs)$/, /tsconfig\.json$/],
};

export class ProjectParser {
  public parse(project: ScannedProject): ParsedProjectArtifacts {
    const parsed: ParsedProjectArtifacts = {
      folders: this.toFolderMap(project.folders),
      pages: [],
      components: [],
      tasks: [],
      interactions: [],
      questions: [],
      fixtures: [],
      tests: [],
      utilities: [],
      configurations: [],
    };

    for (const file of project.files) {
      this.classifyFile(file.path, parsed);
    }

    return parsed;
  }

  private classifyFile(filePath: string, parsed: ParsedProjectArtifacts): void {
    const keys = Object.keys(CATEGORY_PATTERNS) as Array<
      Exclude<keyof ParsedProjectArtifacts, 'folders'>
    >;

    for (const key of keys) {
      const patterns = CATEGORY_PATTERNS[key];
      if (patterns.some((pattern) => pattern.test(filePath))) {
        parsed[key].push(filePath);
      }
    }
  }

  private toFolderMap(folders: string[]): Record<string, string[]> {
    const map: Record<string, string[]> = {};

    for (const folder of folders) {
      const segments = folder.split('/').filter((segment) => segment.length > 0);
      if (segments.length === 0) {
        continue;
      }

      const parent = segments.length === 1 ? '.' : segments.slice(0, -1).join('/');
      const child = segments[segments.length - 1];

      if (!map[parent]) {
        map[parent] = [];
      }

      if (!map[parent].includes(child)) {
        map[parent].push(child);
      }
    }

    for (const key of Object.keys(map)) {
      map[key] = map[key].sort((left, right) => left.localeCompare(right));
    }

    return map;
  }
}
