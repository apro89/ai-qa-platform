import { Enter } from '@automation/interactions/enter.js';
import { Click } from '@automation/interactions/click.js';
import type { User } from '@automation/models/user.js';
import { LoginPage } from '@automation/pages/login.page.js';
import { Task } from '@automation/tasks/task.js';

export const Login = {
  with: (user: User): Task =>
    Task.where(
      `log in as ${user.username}`,
      Enter.the(user.username).into(LoginPage.username),
      Enter.the(user.password).into(LoginPage.password),
      Click.on(LoginPage.loginButton),
    ),
} as const;
