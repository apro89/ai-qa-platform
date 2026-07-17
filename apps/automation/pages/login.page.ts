import { Target } from '@automation/pages/target.js';

export const LoginPage = {
  username: Target.the('username input').located((page) => page.getByPlaceholder('Username')),
  password: Target.the('password input').located((page) => page.getByPlaceholder('Password')),
  loginButton: Target.the('login button').located((page) =>
    page.getByRole('button', { name: 'Login' }),
  ),
  errorMessage: Target.the('login error message').located((page) =>
    page.locator('[data-test="error"]'),
  ),
} as const;
