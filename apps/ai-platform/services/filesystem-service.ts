import type { DirectoryEntry, IFilesystemMcpClient } from '../interfaces/filesystem-mcp-client.js';
import type { ScannedFile, ScannedProject } from '../models/scan-models.js';
import {
  getBaseName,
  getFileExtension,
  joinPath,
  normalizePath,
  relativeFromRoot,
} from '../utils/path-utils.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('FilesystemService');
const TEXT_EXTENSIONS = new Set(['ts', 'tsx', 'js', 'mjs', 'cjs', 'json', 'md', 'yaml', 'yml']);

export class FilesystemService {
  public constructor(private readonly client: IFilesystemMcpClient) {}

  public async scanRecursively(rootPath: string): Promise<ScannedProject> {
    logger.debug('Starting filesystem scan', { rootPath });
    const normalizedRoot = normalizePath(rootPath);
    const queue: string[] = [normalizedRoot];
    const visitedFolders = new Set<string>();
    const folders: string[] = [];
    const files: ScannedFile[] = [];
    let skippedCount = 0;

    logger.debug('Scanning directory recursively', { normalizedRoot });

    while (queue.length > 0) {
      const currentPath = queue.shift();
      if (!currentPath) {
        continue;
      }

      if (visitedFolders.has(currentPath)) {
        continue;
      }

      visitedFolders.add(currentPath);
      logger.trace('Reading directory', { path: currentPath });
      const entries = await this.client.listDirectory(currentPath);
      logger.trace('Directory entries found', { path: currentPath, count: entries.length });

      for (const entry of entries) {
        await this.collectEntry({
          entry,
          normalizedRoot,
          files,
          folders,
          queue,
          skippedCallback: () => {
            skippedCount++;
          },
        });
      }
    }

    const result = {
      rootPath: normalizedRoot,
      folders: folders.sort((left, right) => left.localeCompare(right)),
      files: files.sort((left, right) => left.path.localeCompare(right.path)),
    };

    logger.debug('Filesystem scan completed', {
      folders: result.folders.length,
      files: result.files.length,
      skipped: skippedCount,
    });

    return result;
  }

  private async collectEntry(input: {
    entry: DirectoryEntry;
    normalizedRoot: string;
    files: ScannedFile[];
    folders: string[];
    queue: string[];
    skippedCallback?: () => void;
  }): Promise<void> {
    const entryPath = normalizePath(
      input.entry.path || joinPath(input.normalizedRoot, input.entry.name),
    );

    if (this.isIgnoredPath(entryPath)) {
      logger.trace('Ignoring path', { path: entryPath });
      input.skippedCallback?.();
      return;
    }

    const relativePath = relativeFromRoot(input.normalizedRoot, entryPath);

    if (input.entry.isDirectory) {
      logger.trace('Found folder', { path: relativePath });
      input.folders.push(relativePath);
      input.queue.push(entryPath);
      return;
    }

    const extension = getFileExtension(relativePath);
    const shouldReadContent = TEXT_EXTENSIONS.has(extension);

    if (shouldReadContent) {
      logger.trace('Reading text file', { path: relativePath, extension });
    } else {
      logger.trace('Skipping binary file', { path: relativePath, extension });
    }

    const content = shouldReadContent ? await this.client.readTextFile(entryPath) : undefined;

    input.files.push({
      path: relativePath,
      name: getBaseName(relativePath),
      extension,
      content,
    });
  }

  private isIgnoredPath(pathValue: string): boolean {
    const ignoredTokens = [
      '/node_modules/',
      '/dist/',
      '/playwright-report/',
      '/test-results/',
      '/results/',
    ];
    const normalized = `/${normalizePath(pathValue)}/`;
    return ignoredTokens.some((token) => normalized.includes(token));
  }
}
