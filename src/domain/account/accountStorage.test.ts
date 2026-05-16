import { afterEach, describe, expect, it } from 'vitest';
import {
  ACCOUNT_STORAGE_KEY,
  clearStoredAccount,
  createInitialAccount,
  loadStoredAccount,
  persistAccount,
} from './accountStorage';

describe('accountStorage', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('持久化并恢复账户余额快照', () => {
    const account = createInitialAccount(1000);
    account.balances.USDT.free = '9000.00000000';
    account.balances.SOL.locked = '5.00000000';

    persistAccount(account);

    expect(loadStoredAccount()).toEqual(account);
  });

  it('遇到无效快照时返回 null', () => {
    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify({
      balances: {
        USDT: { asset: 'USDT', free: 100, locked: '0' },
      },
    }));

    expect(loadStoredAccount()).toBeNull();
  });

  it('清理账户快照', () => {
    persistAccount(createInitialAccount(1000));
    clearStoredAccount();

    expect(localStorage.getItem(ACCOUNT_STORAGE_KEY)).toBeNull();
  });
});
