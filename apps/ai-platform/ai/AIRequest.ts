/**
 * AIRequest
 *
 * Provider-agnostic request structure for any LLM.
 * Contains everything needed to send to OpenAI, Claude, Gemini, or future LLM providers.
 * This layer contains ZERO provider-specific logic.
 */

export interface SystemInstruction {
  role: 'system' | 'instruction';
  content: string;
  category: 'architecture' | 'convention' | 'reusable' | 'safety';
  priority: 'critical' | 'high' | 'normal' | 'low';
}

export interface ContextMetadata {
  selectedPages: number;
  selectedTasks: number;
  selectedQuestions: number;
  selectedInteractions: number;
  estimatedTokenCount: number;
  compressionRatio: number;
  timestamp: string;
}

export interface ExpectedOutput {
  format: 'JSON' | 'TypeScript' | 'Markdown' | 'PlainText';
  schema?: Record<string, unknown>;
  examples?: string[];
  constraints?: string[];
}

export interface ReusablePatterns {
  pages?: Array<{ name: string; path: string; summary: string }>;
  tasks?: Array<{ name: string; path: string; summary: string }>;
  questions?: Array<{ name: string; path: string; summary: string }>;
  interactions?: Array<{ name: string; path: string; summary: string }>;
}

export interface AIRequest {
  // Identifiers
  requestId: string;
  templateType:
    | 'GenerateAutomation'
    | 'GenerateTask'
    | 'GenerateQuestion'
    | 'GenerateInteraction'
    | 'RefactorAutomation'
    | 'ExplainCode'
    | string;

  // Core content
  objective: string;
  userRequest: string;

  // Context
  projectContext: {
    framework: string;
    frameworkVersion?: string | null;
    architecture: string;
    typescriptVersion?: string | null;
    namingConventions: Record<string, unknown>;
    codingStyle: Record<string, unknown>;
    folderStructure: Record<string, unknown>;
  };

  // Instructions & constraints
  systemInstructions: SystemInstruction[];

  // Reusable patterns from the project
  reusablePatterns: ReusablePatterns;

  // Output expectations
  expectedOutput: ExpectedOutput;

  // Metadata
  metadata: {
    contextMetadata: ContextMetadata;
    createdAt: string;
    createdBy: string;
    version: string;
  };
}
