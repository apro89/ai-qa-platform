import { Click } from '@automation/interactions/click.js';
import { HeaderPage } from '@automation/pages/header.page.js';
import { Task } from '@automation/tasks/task.js';

export const Logout = Task.where(
  'log out',
  Click.on(HeaderPage.menuButton),
  Click.on(HeaderPage.logoutLink),
);
