export type TestStatus = 'draft' | 'generated' | 'reviewed' | 'approved' | 'failed';
export interface TestSpecification { id: string; title: string; steps: string[]; acceptanceCriteria: string[]; }
export interface GenerationRequest { correlationId: string; projectId: string; specification: TestSpecification; }
