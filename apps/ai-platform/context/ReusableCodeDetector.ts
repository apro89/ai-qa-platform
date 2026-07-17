import type { ProjectStructure } from '../models/project-structure.js';
import type { ReusableObject } from '../context/ProjectContext.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('ReusableCodeDetector');

/**
 * ReusableCodeDetector
 *
 * Identifies reusable components in the project:
 * - Pages that are used by multiple tasks
 * - Interactions that are reused
 * - Utilities that are commonly imported
 */
export class ReusableCodeDetector {
  public detectReusableObjects(structure: ProjectStructure): ReusableObject[] {
    logger.debug('Detecting reusable objects');

    const reusable: ReusableObject[] = [];

    // Detect reusable pages
    for (const page of structure.pages) {
      const obj: ReusableObject = {
        type: 'page',
        name: page.name,
        path: page.path,
        description: `Page object for ${page.name}`,
        relatedObjects: this.findRelatedPages(structure, page.name),
        usageCount: null,
      };
      reusable.push(obj);
    }

    // Detect reusable tasks
    for (const task of structure.tasks) {
      const obj: ReusableObject = {
        type: 'task',
        name: task.name,
        path: task.path,
        description: `Task for ${task.name}`,
        relatedObjects: this.findRelatedTasks(structure, task.name),
        usageCount: null,
      };
      reusable.push(obj);
    }

    // Detect reusable interactions
    for (const interaction of structure.interactions) {
      const obj: ReusableObject = {
        type: 'interaction',
        name: interaction.name,
        path: interaction.path,
        description: `Atomic interaction: ${interaction.name}`,
        relatedObjects: [],
        usageCount: null,
      };
      reusable.push(obj);
    }

    // Detect reusable utilities
    for (const utility of structure.utilities) {
      const obj: ReusableObject = {
        type: 'utility',
        name: utility.name,
        path: utility.path,
        description: `Utility function or helper`,
        relatedObjects: [],
        usageCount: null,
      };
      reusable.push(obj);
    }

    logger.info('Reusable objects detection completed', {
      total: reusable.length,
      pages: structure.pages.length,
      tasks: structure.tasks.length,
      interactions: structure.interactions.length,
      utilities: structure.utilities.length,
    });

    logger.trace('Detected reusable objects', {
      objects: reusable.slice(0, 5),
    });

    return reusable;
  }

  public detectCommonPatterns(structure: ProjectStructure): string[] {
    logger.debug('Detecting common patterns');

    const patterns: Set<string> = new Set();

    // Detect Screenplay Pattern
    if (
      structure.tasks.length > 0 &&
      structure.interactions.length > 0 &&
      structure.questions.length > 0
    ) {
      patterns.add('Screenplay Pattern');
    }

    // Detect Page Object Model
    if (structure.pages.length > 0) {
      patterns.add('Page Object Model');
    }

    // Detect Test Fixtures
    if (structure.fixtures.length > 0) {
      patterns.add('Test Fixtures');
    }

    // Detect Data Builders
    const hasDataBuilders = structure.utilities.some((u) => u.name.includes('Builder'));
    if (hasDataBuilders) {
      patterns.add('Data Builder Pattern');
    }

    // Detect Page Components
    const hasPageComponents = structure.components.length > 0;
    if (hasPageComponents) {
      patterns.add('Page Components');
    }

    // Detect Reusable Interactions
    if (structure.interactions.length > 3) {
      patterns.add('Reusable Atomic Interactions');
    }

    // Detect Question-based assertions
    if (structure.questions.length > 0) {
      patterns.add('State Verification Questions');
    }

    const patternList = Array.from(patterns);
    logger.info('Common patterns detected', { patterns: patternList });

    return patternList;
  }

  private findRelatedPages(structure: ProjectStructure, pageName: string): string[] {
    const related: string[] = [];

    for (const task of structure.tasks) {
      if (task.name.toLowerCase().includes(pageName.toLowerCase())) {
        related.push(task.name);
      }
    }

    return related.slice(0, 5);
  }

  private findRelatedTasks(structure: ProjectStructure, taskName: string): string[] {
    const related: string[] = [];

    for (const test of structure.tests) {
      if (test.name.toLowerCase().includes(taskName.toLowerCase())) {
        related.push(test.name);
      }
    }

    return related.slice(0, 5);
  }
}
