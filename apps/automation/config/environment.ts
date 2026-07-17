export interface AutomationEnvironment {
  readonly baseUrl: string;
  readonly standardUsername: string;
  readonly lockedUsername: string;
  readonly performanceGlitchUsername: string;
  readonly password: string;
}

const value = (name: string, fallback: string): string => process.env[name] || fallback;

export const environment: AutomationEnvironment = {
  baseUrl: value('PLAYWRIGHT_BASE_URL', 'https://www.saucedemo.com'),
  standardUsername: value('TEST_STANDARD_USERNAME', 'standard_user'),
  lockedUsername: value('TEST_LOCKED_USERNAME', 'locked_out_user'),
  performanceGlitchUsername: value('TEST_PERFORMANCE_GLITCH_USERNAME', 'performance_glitch_user'),
  password: value('TEST_PASSWORD', 'secret_sauce'),
};
