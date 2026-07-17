import { expect } from '@playwright/test';
import type { Actor, Performable, Question } from '@automation/actors/actor.js';

export class Ensure<T> implements Performable {
  private constructor(
    private readonly question: Question<T>,
    private readonly expected: T,
  ) {}

  static that<T>(question: Question<T>): { is: (expected: T) => Ensure<T> } {
    return { is: (expected) => new Ensure(question, expected) };
  }

  async performAs(actor: Actor): Promise<void> {
    await expect(actor.asks(this.question)).resolves.toEqual(this.expected);
  }
}
