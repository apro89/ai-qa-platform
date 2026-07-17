import { BrowseTheWeb } from '@automation/abilities/browse-the-web.js';
import type { Actor, Performable } from '@automation/actors/actor.js';
import type { Target } from '@automation/pages/target.js';

export class Select implements Performable {
  private constructor(
    private readonly value: string,
    private readonly target: Target,
  ) {}

  static option(value: string): { from: (target: Target) => Select } {
    return { from: (target) => new Select(value, target) };
  }

  async performAs(actor: Actor): Promise<void> {
    const { page } = actor.abilityTo<BrowseTheWeb>('BrowseTheWeb');
    await this.target.locatedOn(page).selectOption(this.value);
  }
}
