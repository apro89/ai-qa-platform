import type { ScannedProject } from '../models/scan-models.js';
import type { ImportPattern } from '../context/ProjectContext.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('ImportAnalyzer');

/**
 * ImportAnalyzer
 *
 * Analyzes import patterns across the project:
 * - Which modules are imported where
 * - Import frequencies
 * - Common import chains
 */
export class ImportAnalyzer {
  public analyzeImportPatterns(project: ScannedProject): ImportPattern[] {
    logger.debug('Analyzing import patterns', { totalFiles: project.files.length });

    const imports: Map<string, Set<string>> = new Map();
    const importCounts: Map<string, number> = new Map();

    for (const file of project.files) {
      const content = file.content ?? '';
      const importMatches = content.matchAll(
        /import\s+(?:{[^}]*}|[^from]*?)\s+from\s+['"]([^'"]+)['"]/g,
      );

      for (const match of importMatches) {
        const source = match[1];

        if (!imports.has(source)) {
          imports.set(source, new Set());
        }

        imports.get(source)?.add(file.path);
        importCounts.set(source, (importCounts.get(source) ?? 0) + 1);
      }
    }

    const totalImports = Array.from(importCounts.values()).reduce((a, b) => a + b, 0);

    const patterns: ImportPattern[] = Array.from(imports.entries())
      .map(([source, targets]) => ({
        source,
        targets: Array.from(targets),
        frequency: importCounts.get(source) ?? 0,
        percentage: totalImports > 0 ? ((importCounts.get(source) ?? 0) / totalImports) * 100 : 0,
      }))
      .filter((p) => p.frequency > 1)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);

    logger.info('Import pattern analysis completed', {
      uniqueSources: imports.size,
      totalImports,
      topPatterns: patterns.length,
    });

    logger.trace('Top import sources', {
      sources: patterns.slice(0, 5).map((p) => ({ source: p.source, count: p.frequency })),
    });

    return patterns;
  }

  public detectInternalImports(project: ScannedProject): ImportPattern[] {
    logger.debug('Analyzing internal import patterns');

    const patterns = this.analyzeImportPatterns(project);
    const internalPatterns = patterns.filter((p) => {
      const isInternal =
        p.source.startsWith('.') ||
        p.source.startsWith('@qa') ||
        p.source.startsWith('@automation');
      return isInternal && p.frequency > 1;
    });

    logger.debug('Internal import analysis completed', { count: internalPatterns.length });
    logger.trace('Internal imports', {
      patterns: internalPatterns.slice(0, 5),
    });

    return internalPatterns;
  }

  public detectExternalImports(project: ScannedProject): ImportPattern[] {
    logger.debug('Analyzing external import patterns');

    const patterns = this.analyzeImportPatterns(project);
    const externalPatterns = patterns.filter((p) => {
      const isExternal = !p.source.startsWith('.') && !p.source.startsWith('@qa');
      return isExternal && p.frequency > 1;
    });

    logger.debug('External import analysis completed', { count: externalPatterns.length });
    logger.trace('External imports', {
      patterns: externalPatterns.slice(0, 5),
    });

    return externalPatterns;
  }
}
