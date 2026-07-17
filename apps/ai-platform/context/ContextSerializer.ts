import type { ProjectContext } from '../context/ProjectContext.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('ContextSerializer');

/**
 * ContextSerializer
 *
 * Converts ProjectContext to various serialization formats:
 * - JSON (default)
 * - Compact JSON
 * - Human-readable format
 */
export class ContextSerializer {
  public toJSON(context: ProjectContext, pretty: boolean = true): string {
    logger.debug('Serializing context to JSON', { pretty });

    try {
      const json = pretty ? JSON.stringify(context, null, 2) : JSON.stringify(context);
      logger.debug('Context serialization completed', { bytes: json.length });
      return json;
    } catch (error) {
      logger.error('Failed to serialize context', error as Error);
      throw error;
    }
  }

  public toCompactJSON(context: ProjectContext): string {
    logger.debug('Serializing context to compact JSON');

    const compact = {
      framework: context.framework,
      architecture: context.architecture,
      artifacts: {
        pages: context.pages.length,
        tasks: context.tasks.length,
        interactions: context.interactions.length,
        questions: context.questions.length,
        components: context.components.length,
        utilities: context.utilities.length,
      },
      style: context.codingStyle,
      conventions: {
        pages: context.namingConventions.pages.pattern,
        tasks: context.namingConventions.tasks.pattern,
        files: context.namingConventions.files.pattern,
      },
      dependencies: context.topDependencies.length,
      patterns: context.commonPatterns,
      metadata: context.metadata,
    };

    try {
      const json = JSON.stringify(compact);
      logger.debug('Compact context serialization completed', { bytes: json.length });
      return json;
    } catch (error) {
      logger.error('Failed to serialize compact context', error as Error);
      throw error;
    }
  }

  public toMarkdown(context: ProjectContext): string {
    logger.debug('Serializing context to Markdown');

    const lines: string[] = [
      '# Project Context',
      '',
      `## Framework`,
      `- **Name**: ${context.framework}`,
      `- **Version**: ${context.frameworkVersion || 'unknown'}`,
      `- **TypeScript**: ${context.codingStyle.typeScriptUsage ? 'Yes' : 'No'}`,
      '',
      `## Architecture`,
      `- **Primary**: ${context.architecture}`,
      `- **Supported**: ${context.supportedArchitectures.join(', ')}`,
      '',
      `## Artifacts`,
      `- **Pages**: ${context.pages.length}`,
      `- **Tasks**: ${context.tasks.length}`,
      `- **Interactions**: ${context.interactions.length}`,
      `- **Questions**: ${context.questions.length}`,
      `- **Components**: ${context.components.length}`,
      `- **Fixtures**: ${context.fixtures.length}`,
      `- **Utilities**: ${context.utilities.length}`,
      '',
      `## Coding Style`,
      `- **Async/Await**: ${context.codingStyle.asyncAwait ? 'Yes' : 'No'}`,
      `- **Module Syntax**: ${context.codingStyle.moduleSyntax}`,
      `- **Import Style**: ${context.codingStyle.importStyle}`,
      `- **Assertion Library**: ${context.codingStyle.assertionLibrary || 'unknown'}`,
      `- **Locator Style**: ${context.codingStyle.locatorStyle || 'unknown'}`,
      '',
      `## Naming Conventions`,
      `- **Pages**: ${context.namingConventions.pages.pattern}`,
      `- **Tasks**: ${context.namingConventions.tasks.pattern}`,
      `- **Tests**: ${context.namingConventions.tests.pattern}`,
      `- **Files**: ${context.namingConventions.files.pattern}`,
      '',
      `## Common Patterns`,
      ...context.commonPatterns.map((p) => `- ${p}`),
      '',
      `## Dependencies`,
      `Total: ${context.topDependencies.length}`,
      ...context.topDependencies.slice(0, 10).map((d) => {
        const purpose = d.purpose ? ` - ${d.purpose}` : '';
        return `- **${d.name}**: ${d.version}${purpose}`;
      }),
      '',
      `## Metadata`,
      `- **Built**: ${context.metadata.builtAt}`,
      `- **Total Artifacts**: ${context.metadata.totalArtifacts}`,
      `- **Total Dependencies**: ${context.metadata.totalDependencies}`,
    ];

    const markdown = lines.join('\n');
    logger.debug('Markdown context serialization completed', { lines: lines.length });
    return markdown;
  }
}
