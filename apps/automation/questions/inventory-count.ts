import { BrowseTheWeb } from '@automation/abilities/browse-the-web.js';
import type { Actor, Question } from '@automation/actors/actor.js';
import { InventoryPage } from '@automation/pages/inventory.page.js';

export class InventoryCount implements Question<number> {
  async answeredBy(actor: Actor): Promise<number> {
    const { page } = actor.abilityTo<BrowseTheWeb>('BrowseTheWeb');
    return InventoryPage.products.locatedOn(page).count();
  }
}
