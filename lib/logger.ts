type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProduction = import.meta.env.PROD;

const shouldLog = (level: LogLevel) => !isProduction || level === 'warn' || level === 'error';

export const logger = {
  debug: (...args: unknown[]) => { if (shouldLog('debug')) console.debug('[AfriEstate]', ...args); },
  info: (...args: unknown[]) => { if (shouldLog('info')) console.info('[AfriEstate]', ...args); },
  warn: (...args: unknown[]) => { if (shouldLog('warn')) console.warn('[AfriEstate]', ...args); },
  error: (...args: unknown[]) => { if (shouldLog('error')) console.error('[AfriEstate]', ...args); },
};

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
