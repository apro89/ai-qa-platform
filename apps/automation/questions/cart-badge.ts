import { BrowseTheWeb } from '@automation/abilities/browse-the-web.js';
import type { Actor, Question } from '@automation/actors/actor.js';
import { CartPage } from '@automation/pages/cart.page.js';

export class CartBadge implements Question<string> {
  async answeredBy(actor: Actor): Promise<string> {
    const { page } = actor.abilityTo<BrowseTheWeb>('BrowseTheWeb');
    const badge = CartPage.badge.locatedOn(page);
    return (await badge.count()) === 0 ? '' : ((await badge.textContent())?.trim() ?? '');
  }
}
