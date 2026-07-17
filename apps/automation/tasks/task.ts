import type { Actor, Performable } from '@automation/actors/actor.js';

/** A named composition of interactions that expresses a business intent. */
export class Task implements Performable {
  private constructor(
    private readonly description: string,
    private readonly activities: readonly Performable[],
  ) {}

  static where(description: string, ...activities: Performable[]): Task {
    return new Task(description, activities);
  }

  async performAs(actor: Actor): Promise<void> {
    await actor.attemptsTo(...this.activities);
  }

  toString(): string {
    return this.description;
  }
}
