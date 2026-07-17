import { TextOf } from '@automation/questions/text-of.js';
import { LoginPage } from '@automation/pages/login.page.js';

/** SauceDemo exposes errors rather than transient toasts; this gives tests one message question API. */
export const ToastMessage = () => TextOf.the(LoginPage.errorMessage);
