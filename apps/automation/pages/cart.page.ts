import { Target } from '@automation/pages/target.js';

export const CartPage = {
  badge: Target.the('shopping cart badge').located((page) =>
    page.locator('[data-test="shopping-cart-badge"]'),
  ),
  link: Target.the('shopping cart link').located((page) =>
    page.locator('[data-test="shopping-cart-link"]'),
  ),
  checkoutButton: Target.the('checkout button').located((page) =>
    page.getByRole('button', { name: 'Checkout' }),
  ),
  removeProduct: (name: string) =>
    Target.the(`remove ${name} from cart`).located((page) =>
      page
        .locator('[data-test="inventory-item"]', { hasText: name })
        .getByRole('button', { name: 'Remove' }),
    ),
} as const;
