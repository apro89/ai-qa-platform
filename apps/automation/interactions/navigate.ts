import { BrowseTheWeb } from '@automation/abilities/browse-the-web.js';
import type { Actor, Performable } from '@automation/actors/actor.js';

export class Navigate implements Performable {
  private constructor(private readonly path: string) {}

  static to(path = '/'): Navigate {
    return new Navigate(path);
  }

  async performAs(actor: Actor): Promise<void> {
    const { page } = actor.abilityTo<BrowseTheWeb>('BrowseTheWeb');
    await page.goto(this.path);
  }
}
