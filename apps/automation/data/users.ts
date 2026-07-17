import { environment } from '../config/environment.js';
import type { User } from '../models/user.js';

export const users = {
  standard: { username: environment.standardUsername, password: environment.password },
  locked: { username: environment.lockedUsername, password: environment.password },
  performanceGlitch: {
    username: environment.performanceGlitchUsername,
    password: environment.password,
  },
} as const satisfies Record<string, User>;
