import type { Page } from '@playwright/test';
import type { Ability } from './ability.js';

export class BrowseTheWeb implements Ability {
  readonly name = 'BrowseTheWeb';

  private constructor(readonly page: Page) {}

  static using(page: Page): BrowseTheWeb {
    return new BrowseTheWeb(page);
  }
}
