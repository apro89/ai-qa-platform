import type { ScannedProject } from '../models/scan-models.js';
import { FilesystemService } from '../services/filesystem-service.js';

export class ProjectScanner {
  public constructor(private readonly filesystemService: FilesystemService) {}

  public async scan(rootPath: string): Promise<ScannedProject> {
    return this.filesystemService.scanRecursively(rootPath);
  }
}
