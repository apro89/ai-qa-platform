import { BrowseTheWeb } from '../abilities/browse-the-web.js';
import type { Actor, Performable } from '../actors/actor.js';
import type { Target } from '../targets/target.js';

export class Enter implements Performable {
  private constructor(private readonly value: string, private readonly target: Target) {}

  static the(value: string): { into: (target: Target) => Enter } {
    return { into: (target) => new Enter(value, target) };
  }

  async performAs(actor: Actor): Promise<void> {
    const { page } = actor.abilityTo<BrowseTheWeb>('BrowseTheWeb');
    await this.target.locatedOn(page).fill(this.value);
  }
}
