import { BrowseTheWeb } from '../abilities/browse-the-web.js';
import type { Actor, Performable } from '../actors/actor.js';
import type { Target } from '../targets/target.js';

export class Click implements Performable {
  private constructor(private readonly target: Target) {}

  static on(target: Target): Click {
    return new Click(target);
  }

  async performAs(actor: Actor): Promise<void> {
    const { page } = actor.abilityTo<BrowseTheWeb>('BrowseTheWeb');
    await this.target.locatedOn(page).click();
  }
}
