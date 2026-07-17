import { ProjectIntelligenceService } from '../services/project-intelligence-service.js';

export class ProjectIntelligenceAgent {
  public constructor(private readonly intelligenceService: ProjectIntelligenceService) {}

  public async inspect(projectRootPath: string): Promise<string> {
    return this.intelligenceService.getProjectStructureJson(projectRootPath);
  }
}
