import type { ScannedProject } from '../models/scan-models.js';
import { FilesystemService } from '../services/filesystem-service.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('ProjectScanner');

export class ProjectScanner {
  public constructor(private readonly filesystemService: FilesystemService) {}

  public async scan(rootPath: string): Promise<ScannedProject> {
    logger.startTimer('projectScan');
    logger.debug('Starting project scan', { rootPath });

    try {
      const result = await this.filesystemService.scanRecursively(rootPath);

      logger.endTimer('projectScan', {
        folders: result.folders.length,
        files: result.files.length,
      });

      logger.debug('Project scan completed', {
        folders: result.folders.length,
        files: result.files.length,
      });

      return result;
    } catch (error) {
      logger.error('Project scan failed', error as Error, { rootPath });
      throw error;
    }
  }
}
