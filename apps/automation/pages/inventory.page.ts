import { Target } from '@automation/pages/target.js';

export const InventoryPage = {
  pageTitle: Target.the('inventory page title').located((page) =>
    page.getByText('Products', { exact: true }),
  ),
  products: Target.the('inventory products').located((page) =>
    page.locator('[data-test="inventory-item"]'),
  ),
  sort: Target.the('product sorting control').located((page) =>
    page.locator('[data-test="product-sort-container"]'),
  ),
  addProduct: (name: string) =>
    Target.the(`add ${name} to cart button`).located((page) =>
      page
        .locator('[data-test="inventory-item"]', { hasText: name })
        .getByRole('button', { name: 'Add to cart' }),
    ),
  removeProduct: (name: string) =>
    Target.the(`remove ${name} from cart button`).located((page) =>
      page
        .locator('[data-test="inventory-item"]', { hasText: name })
        .getByRole('button', { name: 'Remove' }),
    ),
  productNames: Target.the('product names').located((page) =>
    page.locator('[data-test="inventory-item-name"]'),
  ),
} as const;
