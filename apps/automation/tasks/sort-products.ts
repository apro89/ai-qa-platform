import { InventoryPage } from '@automation/pages/inventory.page.js';
import { Select } from '@automation/interactions/select.js';
import { Task } from '@automation/tasks/task.js';

export type ProductSort = 'az' | 'za' | 'lohi' | 'hilo';

export const SortProducts = {
  by: (order: ProductSort): Task =>
    Task.where(`sort products by ${order}`, Select.option(order).from(InventoryPage.sort)),
} as const;
