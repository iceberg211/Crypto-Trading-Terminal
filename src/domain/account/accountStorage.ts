import type { AccountInfo, AssetBalance } from './types';
import { logger } from '@/utils/logger';

export const ACCOUNT_STORAGE_KEY = 'TRADING_ACCOUNT_STATE_v1';

const DEFAULT_BALANCES: Record<string, AssetBalance> = {
  USDT: { asset: 'USDT', free: '10000', locked: '0' },
  BTC: { asset: 'BTC', free: '0.5', locked: '0' },
  ETH: { asset: 'ETH', free: '5', locked: '0' },
  BNB: { asset: 'BNB', free: '10', locked: '0' },
  SOL: { asset: 'SOL', free: '50', locked: '0' },
};

function cloneBalances(balances: Record<string, AssetBalance>): Record<string, AssetBalance> {
  return Object.fromEntries(
    Object.entries(balances).map(([asset, balance]) => [
      asset,
      { ...balance },
    ])
  );
}

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

function isAssetBalance(value: unknown): value is AssetBalance {
  if (!value || typeof value !== 'object') return false;

  const balance = value as Record<string, unknown>;
  return typeof balance.asset === 'string'
    && typeof balance.free === 'string'
    && typeof balance.locked === 'string';
}

function isAccountInfo(value: unknown): value is AccountInfo {
  if (!value || typeof value !== 'object') return false;

  const account = value as Record<string, unknown>;
  if (!account.balances || typeof account.balances !== 'object') return false;
  if (typeof account.updateTime !== 'number') return false;

  return Object.values(account.balances).every(isAssetBalance);
}

export function createInitialAccount(updateTime = Date.now()): AccountInfo {
  return {
    balances: cloneBalances(DEFAULT_BALANCES),
    updateTime,
  };
}

export function loadStoredAccount(): AccountInfo | null {
  try {
    if (!hasStorage()) return null;

    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!isAccountInfo(parsed)) return null;

    return {
      balances: cloneBalances(parsed.balances),
      updateTime: parsed.updateTime,
    };
  } catch (error) {
    logger.warn('[AccountStorage] 账户快照读取失败', error);
    return null;
  }
}

export function persistAccount(account: AccountInfo): void {
  try {
    if (!hasStorage()) return;
    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
  } catch (error) {
    logger.warn('[AccountStorage] 账户快照保存失败', error);
  }
}

export function clearStoredAccount(): void {
  try {
    if (!hasStorage()) return;
    localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  } catch (error) {
    logger.warn('[AccountStorage] 账户快照清理失败', error);
  }
}

export function getInitialAccount(): AccountInfo {
  return loadStoredAccount() || createInitialAccount();
}
