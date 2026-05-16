type LogMethod = (...args: unknown[]) => void;

interface ConsoleLike {
  debug?: LogMethod;
  info?: LogMethod;
  warn?: LogMethod;
  error?: LogMethod;
}

interface CreateLoggerOptions {
  verbose: boolean;
  consoleLike: ConsoleLike;
}

export function createLogger(options: CreateLoggerOptions) {
  const { verbose, consoleLike } = options;

  return {
    debug: (...args: unknown[]) => {
      if (verbose) consoleLike.debug?.(...args);
    },
    info: (...args: unknown[]) => {
      if (verbose) consoleLike.info?.(...args);
    },
    warn: (...args: unknown[]) => {
      consoleLike.warn?.(...args);
    },
    error: (...args: unknown[]) => {
      consoleLike.error?.(...args);
    },
  };
}

export const logger = createLogger({
  verbose: import.meta.env.DEV,
  consoleLike: console,
});
