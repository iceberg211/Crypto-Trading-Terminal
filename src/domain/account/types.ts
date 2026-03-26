/**
 * 账户领域类型定义
 */

/**
 * 资产余额
 */
export interface AssetBalance {
  asset: string;
  free: string;      // 可用余额
  locked: string;    // 冻结余额（订单占用）
}

/**
 * 账户信息
 */
export interface AccountInfo {
  balances: Record<string, AssetBalance>;
  updateTime: number;
}
