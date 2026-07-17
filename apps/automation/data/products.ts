import type { Product } from '../models/product.js';

export const products = {
  backpack: { name: 'Sauce Labs Backpack', price: 29.99 },
  bikeLight: { name: 'Sauce Labs Bike Light', price: 9.99 },
} as const satisfies Record<string, Product>;
