import { Target } from '@automation/pages/target.js';

export const HeaderPage = {
  menuButton: Target.the('navigation menu button').located((page) =>
    page.getByRole('button', { name: 'Open Menu' }),
  ),
  logoutLink: Target.the('logout link').located((page) =>
    page.getByText('Logout', { exact: true }),
  ),
} as const;
