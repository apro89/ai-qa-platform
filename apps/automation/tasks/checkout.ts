import { Click } from '@automation/interactions/click.js';
import { Enter } from '@automation/interactions/enter.js';
import { CartPage } from '@automation/pages/cart.page.js';
import { CheckoutPage } from '@automation/pages/checkout.page.js';
import type { CheckoutData } from '@automation/models/checkout-data.js';
import type { Product } from '@automation/models/product.js';
import { AddProductToCart, ViewCart } from '@automation/tasks/cart.js';
import { Task } from '@automation/tasks/task.js';

export const Checkout = {
  with: (data: CheckoutData): Task =>
    Task.where(
      'provide checkout information',
      Click.on(CartPage.checkoutButton),
      Enter.the(data.firstName).into(CheckoutPage.firstName),
      Enter.the(data.lastName).into(CheckoutPage.lastName),
      Enter.the(data.postalCode).into(CheckoutPage.postalCode),
      Click.on(CheckoutPage.continueButton),
    ),
};

export const CompletePurchase = Task.where(
  'complete the purchase',
  Click.on(CheckoutPage.finishButton),
);

export const Purchase = {
  product: (product: Product, withData: CheckoutData): Task =>
    Task.where(
      `purchase ${product.name}`,
      AddProductToCart.named(product),
      ViewCart,
      Checkout.with(withData),
      CompletePurchase,
    ),
} as const;
