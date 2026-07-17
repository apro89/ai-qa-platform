import { Target } from '@automation/pages/target.js';

export const CheckoutPage = {
  firstName: Target.the('first name input').located((page) => page.getByPlaceholder('First Name')),
  lastName: Target.the('last name input').located((page) => page.getByPlaceholder('Last Name')),
  postalCode: Target.the('postal code input').located((page) =>
    page.getByPlaceholder('Zip/Postal Code'),
  ),
  continueButton: Target.the('continue checkout button').located((page) =>
    page.getByRole('button', { name: 'Continue' }),
  ),
  finishButton: Target.the('finish checkout button').located((page) =>
    page.getByRole('button', { name: 'Finish' }),
  ),
  completeMessage: Target.the('purchase complete message').located((page) =>
    page.getByText('Thank you for your order!'),
  ),
} as const;
