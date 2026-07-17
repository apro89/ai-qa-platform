import type { SystemInstruction } from './AIRequest.js';
import type { Logger } from '../logger/Logger.js';

const AVERAGE_TOKENS_PER_WORD = 1.3;
const TOKEN_SAFETY_MARGIN = 0.8;

export interface TokenEstimate {
  instructions: number;
  context: number;
  userRequest: number;
  total: number;
  remaining: number;
  warningLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class TokenEstimator {
  private readonly tokenLimit: number;

  constructor(
    private readonly logger: Logger,
    tokenLimit: number = 128000,
  ) {
    this.tokenLimit = Math.floor(tokenLimit * TOKEN_SAFETY_MARGIN);
  }

  estimate(content: {
    instructions: SystemInstruction[];
    context: unknown;
    userRequest: string;
  }): number {
    const instructionTokens = this.estimateInstructions(content.instructions);
    const contextTokens = this.estimateJson(content.context);
    const requestTokens = this.estimateText(content.userRequest);

    const total = instructionTokens + contextTokens + requestTokens;
    const warningLevel = this.getWarningLevel(total);

    this.logEstimate({
      instructions: instructionTokens,
      context: contextTokens,
      userRequest: requestTokens,
      total,
      remaining: this.tokenLimit - total,
      warningLevel,
    });

    return total;
  }

  private estimateInstructions(instructions: SystemInstruction[]): number {
    return instructions.reduce((sum, instruction) => sum + this.estimateText(instruction.content), 0);
  }

  private estimateJson(obj: unknown): number {
    const json = JSON.stringify(obj, null, 2);
    return this.estimateText(json);
  }

  private estimateText(text: string): number {
    const words = text.split(/\s+/).length;
    return Math.ceil(words * AVERAGE_TOKENS_PER_WORD);
  }

  private getWarningLevel(tokenCount: number): 'low' | 'medium' | 'high' | 'critical' {
    const percentage = (tokenCount / this.tokenLimit) * 100;
    if (percentage < 50) return 'low';
    if (percentage < 75) return 'medium';
    if (percentage < 90) return 'high';
    return 'critical';
  }

  private logEstimate(estimate: TokenEstimate): void {
    const percentage = (estimate.total / this.tokenLimit) * 100;
    const message =
      estimate.warningLevel === 'critical'
        ? 'Request exceeds safe token limit'
        : estimate.warningLevel === 'high'
          ? 'Request approaching token limit'
          : 'Token estimation complete';

    const logFnKey = estimate.warningLevel === 'critical' ? 'error' : estimate.warningLevel === 'high' ? 'warn' : 'info';

    const logFn = this.logger[logFnKey as keyof Logger] as (msg: string, ctx?: unknown) => void;
    logFn.call(this.logger, message, {
      tokens: estimate.total,
      percentage: `${percentage.toFixed(1)}%`,
      remaining: estimate.remaining,
      breakdown: {
        instructions: estimate.instructions,
        context: estimate.context,
        userRequest: estimate.userRequest,
      },
    });
  }
}
