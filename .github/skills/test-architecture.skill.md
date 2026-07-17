---
name: Test Architecture
description: Organize Playwright tests consistently using business domains, tags, and the Screenplay Pattern.
---

# Purpose

This skill defines how automated tests are organized.

These rules are mandatory.

---

# Test Organization

Tests are organized by **business domain**, never by execution type.

Correct

```
tests/
    authentication/
        login.spec.ts
        logout.spec.ts

    users/
        create-user.spec.ts
        delete-user.spec.ts

    orders/
        create-order.spec.ts
        cancel-order.spec.ts

    checkout/
        payment.spec.ts
```

Incorrect

```
tests/
    smoke/
    regression/
    api/
    ui/
    login/
```

Do not create new top-level folders without explicit approval.

---

# Test Execution

Execution type is defined by tags.

Allowed execution tags

- @smoke
- @regression

Optional tags

- @critical
- @api
- @ui
- @mobile
- @visual
- @accessibility
- @slow

Examples

```ts
test('@smoke @ui User can log in', async () => {});
```

```ts
test('@regression User cannot log in with invalid password', async () => {});
```

---

# Folder Selection

Always determine the correct business domain.

Authentication

```
tests/authentication/
```

Users

```
tests/users/
```

Orders

```
tests/orders/
```

Checkout

```
tests/checkout/
```

Products

```
tests/products/
```

Create new domains only when introducing a completely new business capability.

---

# Reuse Existing Tests

Before creating a new test

1. Search the repository.
2. Reuse existing scenarios.
3. Extend existing files when appropriate.
4. Avoid duplicate business scenarios.

---

# Screenplay Rules

Tests describe business behaviour only.

Business logic belongs inside

- Tasks
- Interactions
- Questions

Tests must not contain

- Playwright locators
- page.click()
- page.fill()
- XPath
- CSS selectors

Tests should read as business specifications.

---

# Naming

Use descriptive filenames.

Correct

```
login.spec.ts
forgot-password.spec.ts
cancel-order.spec.ts
```

Incorrect

```
test.spec.ts
example.spec.ts
auth.spec.ts
```

---

# Decision Process

Before generating a new test always determine

1. Which business domain owns this scenario?
2. Does an equivalent test already exist?
3. Can existing Tasks be reused?
4. Can existing Questions be reused?
5. Which execution tags should be applied?

Never create duplicate scenarios.

---

# Forbidden

Never organize tests by

- smoke
- regression
- ui
- api

Never create

```
tests/helpers/
tests/common/
tests/shared/
tests/temp/
tests/examples/
```

unless explicitly requested.

Business domains define the folder structure.
Execution tags define how tests are executed.
