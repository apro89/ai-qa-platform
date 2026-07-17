import { Ensure } from '@automation/utils/ensure.js';
import { CheckoutDataBuilder } from '@automation/data/checkout-data-builder.js';
import { products } from '@automation/data/products.js';
import { users } from '@automation/data/users.js';
import { CheckoutPage } from '@automation/pages/checkout.page.js';
import { expect, test } from '@automation/fixtures/actor.fixture.js';
import { Navigate } from '@automation/interactions/navigate.js';
import { CartBadge } from '@automation/questions/cart-badge.js';
import { Login } from '@automation/tasks/login.js';
import { Purchase } from '@automation/tasks/checkout.js';

test('@smoke @regression a shopper can complete a purchase', async ({ actor, page }) => {
  await actor.attemptsTo(Navigate.to(), Login.with(users.standard));
  await actor.attemptsTo(Purchase.product(products.backpack, new CheckoutDataBuilder().build()));

  await expect(CheckoutPage.completeMessage.locatedOn(page)).toBeVisible();
  await actor.attemptsTo(Ensure.that(new CartBadge()).is(''));
});
