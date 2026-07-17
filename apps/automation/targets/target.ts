import type { Locator, Page } from '@playwright/test';

/** A named, reusable UI element. Keep selectors owned by the feature. */
export class Target {
  private constructor(
    readonly description: string,
    private readonly resolve: (page: Page) => Locator,
  ) {}

  static the(description: string): { located: (resolver: (page: Page) => Locator) => Target } {
    return { located: (resolver) => new Target(description, resolver) };
  }

  locatedOn(page: Page): Locator {
    return this.resolve(page);
  }
}
