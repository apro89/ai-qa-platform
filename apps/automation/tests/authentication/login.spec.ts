import { Ensure } from '@automation/utils/ensure.js';
import { Navigate } from '@automation/interactions/navigate.js';
import { CurrentUrl } from '@automation/questions/current-url.js';
import { ToastMessage } from '@automation/questions/toast-message.js';
import { Login } from '@automation/tasks/login.js';
import { Logout } from '@automation/tasks/logout.js';
import { users } from '@automation/data/users.js';
import { expect, test } from '@automation/fixtures/actor.fixture.js';

test.describe('Authentication', () => {
  test('@smoke @regression a standard user can log in and log out', async ({ actor, page }) => {
    await actor.attemptsTo(Navigate.to(), Login.with(users.standard));
    await expect(page).toHaveURL(/inventory.html/);

    await actor.attemptsTo(Logout);
    await actor.attemptsTo(Ensure.that(new CurrentUrl()).is(`${new URL('/', page.url()).origin}/`));
  });

  test('@smoke @regression invalid credentials are rejected', async ({ actor }) => {
    await actor.attemptsTo(
      Navigate.to(),
      Login.with({ username: 'invalid_user', password: 'invalid_password' }),
    );
    await actor.attemptsTo(
      Ensure.that(ToastMessage()).is(
        'Epic sadface: Username and password do not match any user in this service',
      ),
    );
  });

  test('@smoke @regression a locked user cannot log in', async ({ actor }) => {
    await actor.attemptsTo(Navigate.to(), Login.with(users.locked));
    await actor.attemptsTo(
      Ensure.that(ToastMessage()).is('Epic sadface: Sorry, this user has been locked out.'),
    );
  });

  test('@smoke @regression a performance glitch user can log in', async ({ actor, page }) => {
    await actor.attemptsTo(Navigate.to(), Login.with(users.performanceGlitch));
    await expect(page).toHaveURL(/inventory.html/);
  });
});
