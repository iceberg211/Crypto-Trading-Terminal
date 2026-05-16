import { describe, expect, it, vi } from 'vitest';
import { createLogger } from './logger';

describe('logger', () => {
  it('生产模式不输出调试日志', () => {
    const debug = vi.fn();
    const logger = createLogger({ verbose: false, consoleLike: { debug } });

    logger.debug('message');

    expect(debug).not.toHaveBeenCalled();
  });

  it('开发模式输出调试日志', () => {
    const debug = vi.fn();
    const logger = createLogger({ verbose: true, consoleLike: { debug } });

    logger.debug('message');

    expect(debug).toHaveBeenCalledWith('message');
  });

  it('error 始终输出', () => {
    const error = vi.fn();
    const logger = createLogger({ verbose: false, consoleLike: { error } });

    logger.error('message');

    expect(error).toHaveBeenCalledWith('message');
  });
});
