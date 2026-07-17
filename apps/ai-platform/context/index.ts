/**
 * Project Context Module (Phase 2)
 *
 * Transforms ProjectStructure into ProjectContext for consumption by AI agents.
 */

export type {
  ProjectContext,
  NamingConvention,
  NamingConventions,
  CodingStyle,
  ArtifactRef,
  ImportPattern,
  DependencyInfo,
  ReusableObject,
} from './ProjectContext.js';

export { ContextBuilder } from './ContextBuilder.js';
export { ContextValidator } from './ContextValidator.js';
export { ContextSerializer } from './ContextSerializer.js';
export { NamingConventionService } from './NamingConventionService.js';
export { CodingStyleAnalyzer } from './CodingStyleAnalyzer.js';
export { ImportAnalyzer } from './ImportAnalyzer.js';
export { DependencyMapper } from './DependencyMapper.js';
export { ReusableCodeDetector } from './ReusableCodeDetector.js';
