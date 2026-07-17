import { Ensure } from '@automation/utils/ensure.js';
import { BrowseTheWeb } from '@automation/abilities/browse-the-web.js';
import { products } from '@automation/data/products.js';
import { users } from '@automation/data/users.js';
import { InventoryPage } from '@automation/pages/inventory.page.js';
import { expect, test } from '@automation/fixtures/actor.fixture.js';
import { Navigate } from '@automation/interactions/navigate.js';
import { CartBadge } from '@automation/questions/cart-badge.js';
import { InventoryCount } from '@automation/questions/inventory-count.js';
import { AddProductToCart, RemoveProductFromCart, ViewCart } from '@automation/tasks/cart.js';
import { Login } from '@automation/tasks/login.js';
import { SortProducts } from '@automation/tasks/sort-products.js';

test.describe('Inventory and cart', () => {
  test.beforeEach(async ({ actor }) => {
    await actor.attemptsTo(Navigate.to(), Login.with(users.standard));
  });

  test('@smoke @regression inventory is displayed', async ({ actor }) => {
    await actor.attemptsTo(Ensure.that(new InventoryCount()).is(6));
  });

  test('@smoke @regression a product can be added and removed from the shopping cart', async ({
    actor,
  }) => {
    await actor.attemptsTo(AddProductToCart.named(products.backpack));
    await actor.attemptsTo(Ensure.that(new CartBadge()).is('1'));

    await actor.attemptsTo(ViewCart, RemoveProductFromCart.named(products.backpack));
    await expect(
      InventoryPage.products.locatedOn(actor.abilityTo<BrowseTheWeb>('BrowseTheWeb').page),
    ).toHaveCount(0);
  });

  test('@smoke @regression products can be sorted by price, low to high', async ({ actor }) => {
    await actor.attemptsTo(SortProducts.by('lohi'));
    await expect(
      InventoryPage.productNames
        .locatedOn(actor.abilityTo<BrowseTheWeb>('BrowseTheWeb').page)
        .first(),
    ).toHaveText('Sauce Labs Onesie');
  });
});
