import type { ProjectContext, ArtifactRef } from '../context/ProjectContext.js';
import type { Logger } from '../logger/Logger.js';

export interface SelectedContext {
  pages: ArtifactRef[];
  tasks: ArtifactRef[];
  questions: ArtifactRef[];
  interactions: ArtifactRef[];
  namingConventions: Record<string, unknown>;
  codingStyle: Record<string, unknown>;
}

export class ContextSelector {
  constructor(private readonly logger: Logger) {}

  selectRelevantContext(projectContext: ProjectContext, userRequest: string): SelectedContext {
    this.logger.debug('Selecting relevant context', { userRequest });

    const keywords = this.extractKeywords(userRequest);

    const selectedPages = this.selectArtifacts(projectContext.pages, keywords);
    const selectedTasks = this.selectArtifacts(projectContext.tasks, keywords);
    const selectedQuestions = this.selectArtifacts(projectContext.questions, keywords);
    const selectedInteractions = this.selectArtifacts(projectContext.interactions, keywords);

    if (selectedPages.length === 0) {
      selectedPages.push(...this.getEssentialComponents(projectContext.pages));
    }

    return {
      pages: selectedPages,
      tasks: selectedTasks,
      questions: selectedQuestions,
      interactions: selectedInteractions,
      namingConventions: projectContext.namingConventions as unknown as Record<string, unknown>,
      codingStyle: projectContext.codingStyle as unknown as Record<string, unknown>,
    };
  }

  private extractKeywords(userRequest: string): string[] {
    return userRequest
      .toLowerCase()
      .split(/[\s,.:;!?]+/)
      .filter((word) => word.length > 3)
      .slice(0, 10);
  }

  private selectArtifacts(artifacts: ArtifactRef[], keywords: string[]): ArtifactRef[] {
    return artifacts.filter((artifact) => {
      const lowerName = artifact.name.toLowerCase();
      return keywords.some((keyword) => lowerName.includes(keyword));
    });
  }

  private getEssentialComponents(pages: ArtifactRef[]): ArtifactRef[] {
    return pages.filter((p) => {
      const name = p.name.toLowerCase();
      return name.includes('header') || name.includes('navigation') || name.includes('base');
    });
  }
}
