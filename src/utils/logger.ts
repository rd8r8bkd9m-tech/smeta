/**
 * Simple logging utility for the application
 */

export const logger = {
  info: (message: string, ...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.log(`ℹ️ ${message}`, ...args);
  },

  success: (message: string, ...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.log(`✅ ${message}`, ...args);
  },

  warn: (message: string, ...args: unknown[]): void => {
    console.warn(`⚠️ ${message}`, ...args);
  },

  error: (message: string, ...args: unknown[]): void => {
    console.error(`❌ ${message}`, ...args);
  },

  debug: (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`🐛 ${message}`, ...args);
    }
  },
};
