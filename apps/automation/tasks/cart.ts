import { Click } from '@automation/interactions/click.js';
import { CartPage } from '@automation/pages/cart.page.js';
import { InventoryPage } from '@automation/pages/inventory.page.js';
import type { Product } from '@automation/models/product.js';
import { Task } from '@automation/tasks/task.js';

export const AddProductToCart = {
  named: (product: Product): Task =>
    Task.where(`add ${product.name} to the cart`, Click.on(InventoryPage.addProduct(product.name))),
} as const;

export const RemoveProductFromCart = {
  named: (product: Product): Task =>
    Task.where(
      `remove ${product.name} from the cart`,
      Click.on(CartPage.removeProduct(product.name)),
    ),
} as const;

export const ViewCart = Task.where('view the shopping cart', Click.on(CartPage.link));
