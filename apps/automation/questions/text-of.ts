import { BrowseTheWeb } from '@automation/abilities/browse-the-web.js';
import type { Actor, Question } from '@automation/actors/actor.js';
import type { Target } from '@automation/pages/target.js';

export class TextOf implements Question<string> {
  private constructor(private readonly target: Target) {}

  static the(target: Target): TextOf {
    return new TextOf(target);
  }

  async answeredBy(actor: Actor): Promise<string> {
    const { page } = actor.abilityTo<BrowseTheWeb>('BrowseTheWeb');
    return (await this.target.locatedOn(page).textContent()) ?? '';
  }
}
