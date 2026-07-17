import type { CheckoutData } from '../models/checkout-data.js';

/** Test-data builder keeps generated tests explicit while offering safe defaults. */
export class CheckoutDataBuilder {
  private data: CheckoutData = { firstName: 'Taylor', lastName: 'Tester', postalCode: '10001' };

  withFirstName(firstName: string): this {
    this.data = { ...this.data, firstName };
    return this;
  }

  withLastName(lastName: string): this {
    this.data = { ...this.data, lastName };
    return this;
  }

  withPostalCode(postalCode: string): this {
    this.data = { ...this.data, postalCode };
    return this;
  }

  build(): CheckoutData {
    return { ...this.data };
  }
}
