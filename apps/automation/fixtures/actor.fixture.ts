import { test as base } from '@playwright/test';
import { Actor } from '../actors/actor.js';
import { BrowseTheWeb } from '../abilities/browse-the-web.js';

type ScreenplayFixtures = { actor: Actor };

export const test = base.extend<ScreenplayFixtures>({
  actor: async ({ page }, use, testInfo) => {
    const actor = Actor.named(testInfo.title).whoCan(BrowseTheWeb.using(page));
    await use(actor);
  },
});

export { expect } from '@playwright/test';
