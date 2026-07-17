import { BrowseTheWeb } from '@automation/abilities/browse-the-web.js';
import type { Actor, Question } from '@automation/actors/actor.js';

export class CurrentUrl implements Question<string> {
  async answeredBy(actor: Actor): Promise<string> {
    return actor.abilityTo<BrowseTheWeb>('BrowseTheWeb').page.url();
  }
}
