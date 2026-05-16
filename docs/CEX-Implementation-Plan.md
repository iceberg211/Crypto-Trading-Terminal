# CEX 现货交易页完善计划

> **目标**: 将当前"行情展示 + 模拟交易"的前端原型升级为**高拟真的中心化交易所现货交易页面**
> 
> **范围**: 纯前端实现，使用本地模拟撮合引擎，不依赖真实后端

---

## 0. 任务分层原则（新增）

### 0.1 两类任务定义

| 类型 | 定义 | 本项目交付方式 |
|------|------|---------------|
| **真实执行** | 需要后端权威状态、服务端安全边界和基础设施支撑的能力 | 只定义接口契约与流程，不在前端直接执行 |
| **可解释模拟** | 前端可本地确定性复现、可观察、可回放的业务能力 | 在前端完整实现（状态机 + 事件流 + 可视化） |

### 0.2 模块归类（按本项目目标）

| 模块 | 真实执行 | 可解释模拟 | 本期目标 | 状态 |
|------|---------|-----------|---------|---------|
| 订单生命周期（下单→风控→撮合→成交→清算→账务） | 服务端风控、清算与账本入库 | 本地状态机 + 生命周期时间线 + 分录事件 | ✅ 可解释模拟完整落地 | ✅ 已完成 |
| 账户体系（经典模式） | 账户系统与授信管理 | free/locked 余额管理 + 冻结/解冻/交易 | ✅ 可解释模拟落地 | ✅ 已完成 |
| 订单簿与撮合逻辑 | 高性能撮合集群 | 本地撮合 + 订单簿协议一致性 + Worker 接入 | ✅ 可解释模拟落地 | ✅ 已完成 |
| 费率与费用计算 | 费率后台配置与结算入账 | 费率引擎（maker/taker/VIP/折扣） | ✅ 可解释模拟落地 | ✅ 已完成 |
| 风控规则引擎 | 全局风控策略引擎 | 可扩展规则引擎 + 可解释拒单 | ✅ 可解释模拟落地 | ✅ 已完成 |
| 现货杠杆 | 借贷资产池、利息结算、强平执行 | **前端 UI 面板**：借币面板 + 风险率展示（不做引擎） | 🟡 只做 UI 面板 | ❌ 未开始 |
| 合约（简化版） | 保证金引擎、资金费率、强平撮合 | **前端 UI 面板**：仓位面板 + 未实现盈亏展示（不做引擎） | ⚪ 只做 UI 面板 | ❌ 未开始 |
| 账户双模式（统一/经典切换） | 账户系统 | 两套数据结构 + UI 适配 | ⚪ 理解即可，不实现 | ⏭️ 跳过 |

### 0.3 实施约束（必须遵守）

1. 所有“真实执行”能力必须先抽象为领域接口，前端仅实现 `MockAdapter`。
2. 所有“可解释模拟”能力必须具备三件套：状态机、事件日志、UI 可视化。
3. 不在前端引入 API Key、签名和真实资产逻辑。

### 0.4 前端聚焦清单（本次更新）

#### 必须做（前端实现）
1. 行情链路稳定性：单 WS、快照+增量一致性、Gap 恢复、性能优化。
2. 交易交互可靠性：下单前校验、错误提示、状态反馈、撤单与成交展示。
3. 可解释能力：生命周期时间线、账务分录、拒单原因、费率明细。
4. 观测与调试：关键状态可视化、审计面板、最小测试集。

#### 只做 UI 面板（不做引擎）
1. ~~统一账户 vs 经典账户~~ → 跳过，理解即可。
2. 现货杠杆：Tab 切换 + 借币面板 + 风险率展示（不做借贷引擎）。
3. 合约：Tab 切换 + 仓位面板 + 盈亏展示 + 资金费率（不做保证金/强平引擎）。
4. KYC/钱包/出入金：流程与边界理解，不实现真实流程。

#### 明确不做（避免伪后端）
1. 真实撮合服务端化与多用户撮合一致性。
2. 真实清算总账、借贷资产池、强平执行。
3. 钱包、多签、链上出入金与审核系统。
4. 鉴权签名、API Key 托管。

**契约优先示例**:

```typescript
// 真实执行契约（后续可接后端）
export interface RiskService {
  evaluate(order: NewOrderRequest, account: AccountSnapshot): RiskDecision;
}

// 可解释模拟实现（当前项目）
export class MockRiskService implements RiskService {
  evaluate(order: NewOrderRequest, account: AccountSnapshot): RiskDecision {
    // 返回命中规则、风险等级、拒单原因
    return { allow: true, rules: [], level: 'LOW' };
  }
}
```

---

## 一、项目现状分析

### 1.1 已完成功能

| 模块 | 文件 | 状态 |
|------|------|------|
| K 线图表 | `useKlineData.ts`, `ChartContainer.tsx` | ✅ 完成 |
| 订单簿 | `useOrderBook.ts`, `OrderBook.tsx` | ✅ 完成（快照+增量+Gap检测+Worker） |
| 最近成交 | `RecentTrades.tsx` | ✅ 完成（含历史数据加载） |
| 24h Ticker | `useTicker.ts`, `TickerBar.tsx` | ✅ 完成 |
| WebSocket 管理 | `MarketDataHub.ts` | ✅ 完成（统一订阅层） |
| 交易表单 | `TradeForm.tsx`, `tradeAtom.ts` | ✅ 本地模拟完成 |
| 订单管理 | `useOrders.ts` | ✅ 本地模拟完成 |
| 资产面板 | `AssetPanel.tsx`, `balanceAtom.ts` | ✅ 本地模拟完成 |
| 订单簿 Worker | `orderbook.worker.ts`, `useOrderBookEngine.ts` | ✅ 已接入 |
| 深度图 | `DepthChart.tsx` | ✅ 完成（Canvas 渲染） |
| 价格闪动动画 | `PriceFlash.tsx` | ✅ 完成 |
| 撮合引擎 | `MatchingEngine.ts` | ✅ 完成（市价/限价/止损） |
| 订单状态机 | `OrderStateMachine.ts` | ✅ 完成 |
| 生命周期时间线 | `lifecycleAtom.ts` | ✅ 完成 |
| 账务分录 | `ledgerAtom.ts` | ✅ 完成 |
| 风控引擎 | `RiskEngine.ts` | ✅ 完成（可扩展规则） |
| 费率引擎 | `FeeEngine.ts` | ✅ 完成（maker/taker/VIP/BNB折扣） |
| ExchangeInfo | `exchangeInfo.ts` | ✅ 完成 |

### 1.2 待解决问题

1. ~~**WS 连接分散**~~ → ✅ 已通过 MarketDataHub 解决
2. ~~**交易规则硬编码**~~ → ✅ 已接入 exchangeInfo
3. ~~**订单状态简陋**~~ → ✅ 已实现完整状态机
4. ~~**Worker 未接入**~~ → ✅ 已接入 OrderBook Worker
5. ~~**RecentTrades 无首屏历史**~~ → ✅ 已实现历史数据加载
6. **性能优化未做**: 订单簿/成交列表未用虚拟列表，高频更新未做 RAF 节流
7. **杠杆/合约 UI 未做**: Tab 切换框架和对应 UI 面板待实现

---

## 二、CEX 交易页核心技术难点

### 2.1 订单簿一致性（已基本解决）
- 快照 + 增量的序列校验
- Gap 恢复机制
- 乱序处理
- 限频与回补

### 2.2 订单状态一致性（需重点强化）
- 下单后的 **乐观 UI vs 服务端权威状态** 冲突
- 撤单/成交并发更新
- 完整状态机：`NEW → PARTIAL_FILLED → FILLED | CANCELED | EXPIRED | REJECTED`

### 2.3 高频实时与性能
- 订单簿/成交/行情多源高频刷新
- 渲染节流、虚拟列表、Worker 合并
- requestAnimationFrame 批量更新

### 2.4 多源数据一致性
- ticker、trade、orderbook、kline 的时间戳与价格对齐
- 避免 UI "跳价"

### 2.5 交易规则与精度
- tick size / step size / min notional
- 手续费计算
- 精度截断（使用 decimal.js）

---

## 三、目标架构设计

### 3.1 五层架构

```
┌─────────────────────────────────────────────────────────────┐
│                       UI Layer                               │
│  (ChartContainer, OrderBook, TradeForm, OrderPanel, etc.)   │
│  只消费领域状态，不直接碰网络与复杂业务逻辑                      │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                    Domain State Layer                        │
│  marketData: kline, orderbook, trades, ticker               │
│  trading: orders, fills                                     │
│  account: balance, positions (模拟)                         │
│  (Jotai Atoms + 派生选择器)                                  │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                 Computation & Performance Layer              │
│  - OrderBook Worker (增量合并)                               │
│  - Batch Renderer (RAF 节流)                                │
│  - History Loader (分页回补)                                │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                    Normalization Layer                       │
│  - 数据格式标准化                                            │
│  - 时间戳同步                                                │
│  - 精度规则应用 (decimal.js)                                 │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                    Data Gateway Layer                        │
│  MarketDataHub: 统一 WS 订阅管理                             │
│  REST Client: 快照/历史数据获取                              │
│  (重连、节流、缓存)                                          │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 目录结构调整

```
src/
├── core/                          # [新增] 核心基础设施
│   ├── gateway/
│   │   ├── MarketDataHub.ts       # 统一行情订阅层
│   │   ├── SubscriptionManager.ts # 订阅管理
│   │   └── types.ts
│   ├── normalizer/
│   │   ├── TradeNormalizer.ts
│   │   ├── OrderBookNormalizer.ts
│   │   └── KlineNormalizer.ts
│   └── config/
│       ├── ExchangeInfo.ts        # 交易对元数据
│       └── SymbolRegistry.ts      # 符号注册表
│
├── domain/                        # [新增] 领域状态
│   ├── market/
│   │   ├── atoms/
│   │   │   ├── orderBookAtom.ts
│   │   │   ├── tradesAtom.ts
│   │   │   ├── klineAtom.ts
│   │   │   └── tickerAtom.ts
│   │   └── selectors/
│   ├── trading/
│   │   ├── atoms/
│   │   │   ├── ordersAtom.ts
│   │   │   └── fillsAtom.ts
│   │   ├── engine/
│   │   │   ├── MatchingEngine.ts  # 本地撮合引擎
│   │   │   ├── OrderStateMachine.ts
│   │   │   └── types.ts
│   │   └── hooks/
│   └── account/
│       ├── atoms/
│       │   ├── balanceAtom.ts
│       │   └── positionsAtom.ts
│       └── hooks/
│
├── workers/                       # [强化] Worker 层
│   ├── orderbook.worker.ts        # 已有，需接入
│   └── matching.worker.ts         # [新增] 撮合引擎 Worker
│
├── features/                      # 现有功能模块（保留，逐步迁移）
├── components/                    # UI 组件
└── services/                      # 现有服务层（逐步迁移到 core/）
```

---

## 四、实现计划

### Phase 1: 基础设施层 (预计 3-4 天)

#### 1.1 MarketDataHub 统一订阅层

**目标**: 合并所有 WS 连接，统一管理订阅

**WS 策略选择**: 
- ✅ **方案 A: 单连接 + 动态订阅** (`wss://stream.binance.com:9443/ws` + `SUBSCRIBE/UNSUBSCRIBE`)
- ❌ ~~方案 B: 组合流~~ (切换交易对需重连，不符合目标)

**文件变更**:
- [NEW] `src/core/gateway/MarketDataHub.ts`
- [NEW] `src/core/gateway/SubscriptionManager.ts`
- [MODIFY] `src/features/*/hooks/use*.ts` - 改为调用 MarketDataHub

**核心功能**:
```typescript
interface MarketDataHub {
  // 订阅管理（动态订阅）
  subscribe(channel: 'kline' | 'depth' | 'trade' | 'ticker', symbol: string, interval?: string): () => void;
  
  // 数据分发
  onMessage(channel: string, handler: (data: any) => void): void;
  
  // 连接状态
  getStatus(): 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
}

// 动态订阅示例
class MarketDataHub {
  private requestId = 1;
  
  subscribe(channel: string, symbol: string, interval?: string) {
    const stream = this.buildStreamName(channel, symbol, interval);
    
    // 发送 SUBSCRIBE 消息
    this.ws.send(JSON.stringify({
      method: 'SUBSCRIBE',
      params: [stream],
      id: this.requestId++
    }));
    
    // 返回取消订阅函数
    return () => {
      this.ws.send(JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: [stream],
        id: this.requestId++
      }));
    };
  }
}
```

**验证**:
- 浏览器 DevTools Network 面板只有 **1 个 WS 连接**
- 切换交易对时，**无需重连**，只发送 SUBSCRIBE/UNSUBSCRIBE 消息
- 控制台打印订阅/取消订阅日志，确认流名称正确

---

#### 1.2 ExchangeInfo 交易规则集成

**目标**: 从 Binance `/api/v3/exchangeInfo` 获取交易对元数据

**文件变更**:
- [NEW] `src/core/config/ExchangeInfo.ts`
- [NEW] `src/core/config/SymbolRegistry.ts`
- [MODIFY] `src/features/symbol/symbolAtom.ts` - 保留 `POPULAR_SYMBOLS` 作为 fallback

**核心数据结构**:
```typescript
interface SymbolConfig {
  symbol: string;           // BTCUSDT
  baseAsset: string;        // BTC
  quoteAsset: string;       // USDT
  pricePrecision: number;   // 价格小数位
  quantityPrecision: number;// 数量小数位
  tickSize: string;         // 最小价格变动
  stepSize: string;         // 最小数量变动
  minNotional: string;      // 最小交易金额
  minQty: string;           // 最小交易数量
}
```

**缓存策略**:
```typescript
class ExchangeInfoManager {
  private static CACHE_KEY = 'binance_exchange_info';
  private static CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小时
  
  async loadExchangeInfo() {
    // 1. 尝试从 localStorage 读取
    const cached = this.loadFromCache();
    if (cached && !this.isCacheExpired(cached)) {
      return cached.data;
    }
    
    // 2. 请求 REST API
    const data = await fetch('/api/v3/exchangeInfo').then(r => r.json());
    
    // 3. 保存到缓存（内存 + localStorage）
    this.saveToCache(data);
    
    return data;
  }
  
  // 支持搜索和分页
  searchSymbols(query: string, page = 0, pageSize = 50) {
    const filtered = this.symbols.filter(s => 
      s.symbol.toLowerCase().includes(query.toLowerCase())
    );
    return filtered.slice(page * pageSize, (page + 1) * pageSize);
  }
}
```

**热门列表 Fallback**:
- 保留 `POPULAR_SYMBOLS` 常量作为加载失败时的备选
- 首屏优先显示热门交易对，避免空白

**验证**:
- 控制台打印加载的交易对数量（预期 2000+）
- 第二次刷新页面时，从缓存加载（无网络请求）
- 搜索 "BTC" 可以快速过滤相关交易对
- 下单表单根据规则自动校验（如最小金额）

---

#### 1.3 接入 OrderBook Worker

**目标**: 将订单簿增量合并移到 Worker，避免阻塞主线程

**文件变更**:
- [MODIFY] `src/workers/orderbook.worker.ts` - 增强合并逻辑
- [MODIFY] `src/features/orderbook/hooks/useOrderBook.ts` - 切换到 Worker

**精度一致性要求**:
```typescript
// ❌ 错误：主线程用 decimal.js，Worker 用 parseFloat
// 主线程
const sorted = bids.sort((a, b) => new Decimal(b[0]).cmp(a[0]));

// Worker
const sorted = bids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
// 可能导致排序结果不一致！

// ✅ 正确：统一使用 decimal.js
// 方案 1: Worker 也引入 decimal.js
import Decimal from 'decimal.js';
const sorted = bids.sort((a, b) => new Decimal(b[0]).cmp(a[0]));

// 方案 2: 或者主线程和 Worker 都用字符串比较（需要保证格式一致）
const sorted = bids.sort((a, b) => b[0].localeCompare(a[0], undefined, { numeric: true }));
```

**验证**:
- Chrome Performance 面板无长帧
- 高频更新时 FPS 保持 60
- 订单簿排序与主线程一致（对比前 10 档价格）

---

### Phase 2: 交易核心层 (预计 4-5 天)

#### 2.1 订单状态机

**目标**: 实现完整的订单生命周期管理

**文件变更**:
- [NEW] `src/domain/trading/engine/OrderStateMachine.ts`
- [NEW] `src/domain/trading/engine/types.ts`
- [MODIFY] `src/features/orders/atoms/ordersAtom.ts`

**状态定义**:
```typescript
type OrderStatus = 
  | 'NEW'           // 已提交
  | 'PARTIAL_FILLED'// 部分成交
  | 'FILLED'        // 完全成交
  | 'CANCELED'      // 已撤销
  | 'EXPIRED'       // 已过期
  | 'REJECTED';     // 被拒绝

// 拒绝原因枚举
type RejectReason =
  | 'INSUFFICIENT_BALANCE'  // 余额不足
  | 'INVALID_PRICE'         // 价格不符合 tick size
  | 'INVALID_QUANTITY'      // 数量不符合 step size
  | 'MIN_NOTIONAL'          // 低于最小交易金额
  | 'PRICE_OUT_OF_RANGE'    // 价格偏离市场价过大
  | 'SYMBOL_NOT_FOUND';     // 交易对不存在

interface Order {
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  price: string;          // 原始价格
  origQty: string;        // 原始数量
  executedQty: string;    // 已成交数量
  status: OrderStatus;
  rejectReason?: RejectReason;  // [新增] 拒绝原因
  timeInForce: 'GTC' | 'IOC' | 'FOK';
  createTime: number;
  updateTime: number;
}
```

**状态转换规则**:
```
NEW ──────→ PARTIAL_FILLED ──→ FILLED
 │                │
 ├─→ CANCELED     ├─→ CANCELED
 │                │
 └─→ REJECTED     └─→ EXPIRED
    (带原因)
```

**规则校验**:
```typescript
class OrderValidator {
  validate(order: NewOrderRequest, symbolConfig: SymbolConfig, balance: Balance): ValidationResult {
    // 1. 价格精度校验
    if (!this.isValidTickSize(order.price, symbolConfig.tickSize)) {
      return { valid: false, reason: 'INVALID_PRICE' };
    }
    
    // 2. 数量精度校验
    if (!this.isValidStepSize(order.quantity, symbolConfig.stepSize)) {
      return { valid: false, reason: 'INVALID_QUANTITY' };
    }
    
    // 3. 最小金额校验
    const notional = Decimal.mul(order.price, order.quantity);
    if (notional.lt(symbolConfig.minNotional)) {
      return { valid: false, reason: 'MIN_NOTIONAL' };
    }
    
    // 4. 余额校验
    if (order.side === 'BUY') {
      const required = notional;
      if (balance.quote.lt(required)) {
        return { valid: false, reason: 'INSUFFICIENT_BALANCE' };
      }
    } else {
      if (balance.base.lt(order.quantity)) {
        return { valid: false, reason: 'INSUFFICIENT_BALANCE' };
      }
    }
    
    return { valid: true };
  }
}
```

---

#### 2.2 本地撮合引擎

**目标**: 根据订单簿模拟订单成交

**文件变更**:
- [NEW] `src/domain/trading/engine/MatchingEngine.ts`
- [NEW] `src/workers/matching.worker.ts`

**撮合策略**:

**MVP 版本（快速验证）**:
- 市价买单：以卖一价全部成交
- 市价卖单：以买一价全部成交
- 限价买单：价格 >= 卖一 立即成交，否则挂单
- 限价卖单：价格 <= 买一 立即成交，否则挂单

**增强版本（高拟真，可选）**:
```typescript
class MatchingEngine {
  // 逐档吃单 + 部分成交 + 滑点
  matchMarketOrder(order: Order, orderBook: OrderBook): MatchResult {
    const side = order.side === 'BUY' ? orderBook.asks : orderBook.bids;
    let remainingQty = new Decimal(order.origQty);
    const fills: Fill[] = [];
    
    // 逐档吃单
    for (const [price, qty] of side) {
      if (remainingQty.lte(0)) break;
      
      const fillQty = Decimal.min(remainingQty, new Decimal(qty));
      fills.push({
        price,
        quantity: fillQty.toString(),
        time: Date.now()
      });
      
      remainingQty = remainingQty.sub(fillQty);
    }
    
    // 计算加权平均价
    const totalValue = fills.reduce((sum, fill) => 
      sum.add(Decimal.mul(fill.price, fill.quantity)), new Decimal(0)
    );
    const totalQty = fills.reduce((sum, fill) => 
      sum.add(fill.quantity), new Decimal(0)
    );
    const avgPrice = totalValue.div(totalQty);
    
    return {
      fills,
      avgPrice: avgPrice.toString(),
      executedQty: totalQty.toString(),
      status: remainingQty.gt(0) ? 'PARTIAL_FILLED' : 'FILLED'
    };
  }
  
  // 用户挂单叠加到盘口
  addPendingOrder(order: Order, orderBook: OrderBook) {
    const side = order.side === 'BUY' ? orderBook.bids : orderBook.asks;
    // 插入到对应价格档位，保持价格排序
    this.insertOrder(side, order);
  }
}
```

**验证**:
- **MVP**: 市价单立即成交，限价单挂单后价格触及时成交
- **增强版**: 大单部分成交，显示加权平均价和滑点

---

#### 2.3 模拟账户系统

**目标**: 实现余额管理和资产变动

**文件变更**:
- [NEW] `src/domain/account/atoms/balanceAtom.ts`
- [MODIFY] `src/components/trading/AssetPanel.tsx`

**核心功能**:
- 初始化模拟资产（如 10000 USDT, 1 BTC）
- 下单时冻结资产
- 成交后扣减/增加资产
- 撤单后解冻资产

---

### Phase 3: 数据增强层 (预计 2-3 天)

#### 3.1 历史数据加载

**目标**: 完善首屏数据和分页加载

**文件变更**:
- [MODIFY] `src/components/trading/RecentTrades.tsx` - 首屏拉取 REST 历史
- [MODIFY] `src/features/chart/hooks/useKlineData.ts` - 支持左侧翻页

**验证**:
- RecentTrades 首屏显示历史成交
- 图表向左拖动时自动加载更多 K 线

---

#### 3.2 精度处理封装

**目标**: 使用 decimal.js 处理所有金额计算

**文件变更**:
- [NEW] `src/utils/decimal.ts`
- [MODIFY] 所有涉及金额计算的文件

**验证**:
- `0.1 + 0.2` 不再出现精度问题

---

### Phase 4: 性能优化层 (预计 2 天)

#### 4.1 虚拟列表

**目标**: 订单簿和成交列表使用虚拟滚动

**文件变更**:
- [MODIFY] `src/features/orderbook/components/OrderBook.tsx`
- [MODIFY] `src/components/trading/RecentTrades.tsx`

**技术选型**: `react-window`

---

#### 4.2 渲染节流

**目标**: 高频更新时批量合并渲染

**实现方式**:
- requestAnimationFrame 节流
- 16ms 内多次更新只渲染一次

---

### Phase 5: 前端产品化收敛（新增，预计 3-4 天）

#### 5.1 生命周期 + 账务分录（前端核心）

**目标**: 把“下单→成交→资金变化”做成可回放、可解释、可调试。

**文件变更**:
- [NEW] `src/domain/exchange/lifecycle/*`
- [NEW] `src/domain/exchange/ledger/*`
- [NEW] `src/features/exchange/components/*`
- [MODIFY] `src/domain/trading/hooks/useTradingService.ts`

**核心要求**:
- 每笔订单有完整事件链路。
- 关键资金动作有分录记录（用于解释，不替代真实总账）。
- UI 支持按订单查看事件与分录。

---

#### 5.2 风控提示与拒单解释（前端核心）

**目标**: 强化“防错体验”，不是实现真实风控引擎。

**文件变更**:
- [MODIFY] `src/domain/trading/engine/OrderValidator.ts`
- [MODIFY] `src/features/trade/components/TradeForm.tsx`
- [MODIFY] `src/features/orders/components/*`

**范围**:
- 下单前预校验提示（价格/数量/最小金额/余额）。
- 拒单原因 UI 明确展示。
- 风险提示文案标准化。

---

#### 5.3 费率可解释化（前端核心）

**目标**: 让用户知道“手续费怎么算”，不做后台费率系统。

**文件变更**:
- [MODIFY] `src/domain/trading/engine/MatchingEngine.ts`
- [MODIFY] `src/features/orders/components/TradeHistory.tsx`

**范围**:
- maker/taker 基础费率展示。
- 单笔成交费率来源说明。
- 手续费计算过程可见。

---

#### 5.4 交易页 Tab 框架 + 杠杆/合约 UI 面板

> ⚠️ **不实现**：借贷引擎、利息计算、仓位引擎、保证金引擎、强平执行。只做 UI 面板展示，数据用 Mock。

**页面结构**: 不新建独立页面，在现有交易页内通过 **现货 / 杠杆 / 合约 Tab** 切换。
共享 K线图、订单簿、最近成交，只切换下方的交易表单区和面板区。

```
┌──────────────────────────────────────────────┐
│  [现货] [杠杆] [合约]    ← Tab 切换           │
├────────────────────┬─────────────────────────┤
│   K线图（共享）     │ 订单簿 + 深度图（共享）  │
├────────────────────┼─────────────────────────┤
│   交易表单          │ 最近成交（共享）         │
│  （按 Tab 不同）    │                         │
├────────────────────┴─────────────────────────┤
│  下方面板（按 Tab 不同）                       │
│  现货: 当前委托 / 历史订单 / 资产              │
│  杠杆: 当前委托 / 借贷信息 / 风险率            │
│  合约: 当前仓位 / 当前委托 / 资金费率           │
└──────────────────────────────────────────────┘
```

**杠杆 Tab 新增 UI**:
- 交易表单：新增杠杆倍数选择器（3x/5x/10x）+ 可借额度提示
- 借币面板：资产选择、借入数量、利率、预估利息（Mock 数据）
- 风险指标面板：保证金率、风险等级、预估强平价（静态计算展示）

**合约 Tab 新增 UI**:
- 交易表单：开多/开空方向选择、杠杆倍数滑块、全仓/逐仓切换
- 仓位面板：持仓列表 + 未实现盈亏（可用实时价格做简单计算）
- 资金费率展示：当前费率 + 下次结算倒计时

**前端学习价值**:
- 仓位面板"未实现盈亏随价格闪动" → 高频 UI 更新模式
- 杠杆倍数滑块 → 输入控件交互设计
- Tab 切换共享布局 → 组件复用与状态隔离

**文件变更**:
- [NEW] `src/features/trading/components/TradingModeTabs.tsx`
- [NEW] `src/features/margin/components/MarginTradeForm.tsx`
- [NEW] `src/features/margin/components/BorrowPanel.tsx`
- [NEW] `src/features/futures/components/FuturesTradeForm.tsx`
- [NEW] `src/features/futures/components/PositionPanel.tsx`
- [NEW] `src/features/futures/components/FundingRateBar.tsx`

---

## 五、验证计划

### 自动化验证
> ⚠️ 当前项目未配置测试框架，建议后续补充 Vitest

### 手动验证 Checklist

#### Phase 1 验证
- [ ] 浏览器 Network 面板只有 1 个 WS 连接
- [ ] 切换交易对后，订阅正确更新（无残留订阅）
- [ ] 交易对搜索可用，显示 tick/step 信息
- [ ] 订单簿高频更新时无卡顿（Chrome Performance）

#### Phase 2 验证
- [ ] 市价买单以卖一价立即成交
- [ ] 限价买单高于卖一价立即成交
- [ ] 限价买单低于卖一价进入挂单列表
- [ ] 撤单后订单状态变为 CANCELED，资产解冻
- [ ] 成交后余额正确变动

#### Phase 3 验证
- [ ] RecentTrades 首屏有历史数据
- [ ] K线图向左拖动可加载更多数据
- [ ] 金额计算无精度问题（如 0.1 + 0.2 = 0.3）

#### Phase 4 验证
- [ ] 订单簿 1000 条数据滚动流畅
- [ ] 高频更新时 FPS >= 55

#### Phase 5 验证
- [x] 每笔订单都有完整生命周期事件链路（可追溯）
- [x] 每次资产变动都能在账务分录中定位来源
- [x] 风控拒单可解释（规则命中 + 原因）
- [x] 费率计算可解释（maker/taker 与手续费来源）
- [ ] 杠杆 Tab：杠杆倍数选择器 + 借币面板 + 风险率展示可用
- [ ] 合约 Tab：开多/开空表单 + 仓位面板 + 资金费率展示可用
- [ ] Tab 切换时共享组件（K线/订单簿/成交）状态不丢失

---

## 六、优先级排序

| 优先级 | 任务 | 类型 | 预计时间 | 状态 |
|-------|------|------|---------|------|
| ~~P0~~ | ~~生命周期事件流 + 账务分录~~ | ~~可解释模拟~~ | ~~2 天~~ | ✅ 已完成 |
| ~~P0~~ | ~~风控规则引擎 + 可解释拒单~~ | ~~可解释模拟~~ | ~~1.5 天~~ | ✅ 已完成 |
| ~~P0~~ | ~~费率引擎（maker/taker/VIP/折扣）~~ | ~~可解释模拟~~ | ~~1 天~~ | ✅ 已完成 |
| ~~P1~~ | ~~MarketDataHub 统一订阅层~~ | ~~基础设施~~ | ~~2 天~~ | ✅ 已完成 |
| ~~P1~~ | ~~ExchangeInfo 集成~~ | ~~基础设施~~ | ~~1 天~~ | ✅ 已完成 |
| ~~P1~~ | ~~撮合引擎 + OrderBook Worker~~ | ~~可解释模拟~~ | ~~2 天~~ | ✅ 已完成 |
| P1 � | 虚拟列表 + RAF 渲染节流 | 性能优化 | 1.5 天 | ❌ 待做 |
| P2 🟢 | 交易页 Tab 切换框架（现货/杠杆/合约） | 前端架构 | 1 天 | ❌ 待做 |
| P2 🟢 | 杠杆 UI 面板（表单 + 借币 + 风险率） | 前端 UI | 2 天 | ❌ 待做 |
| P3 ⚪ | 合约 UI 面板（仓位 + 盈亏 + 资金费率） | 前端 UI | 2 天 | ❌ 待做 |
| ~~P3~~ | ~~账户双模式（统一/经典切换）~~ | ~~后端偏重~~ | — | ⏭️ 跳过 |

---

## 七、风险与注意事项

### 7.1 API 限流
Binance REST API 限流 1200 请求/分钟，需注意：
- exchangeInfo 缓存（启动时加载一次）
- 快照请求添加防抖

### 7.2 本地模拟器局限性
- 无法模拟网络延迟导致的乱序
- 深度不足导致的部分成交需要简化处理
- 建议添加开关，方便后期切换到真实后端

### 7.3 数据一致性
- ticker 价格与 orderbook 买一卖一可能有微小差异
- 建议 UI 上做容错处理（允许 0.1% 误差）

### 7.4 真实执行边界（新增）
以下能力仅做接口契约，不在前端执行：
- 真实签名下单与撤单（需要服务端密钥管理）
- 权威清算与总账入库（需要后端事务一致性）
- 真实风控策略引擎（需要全局账户与行为数据）
- 出入金、钱包、多签与审核流（需要链上与运营系统）
- 借贷资产池、利息引擎、强平执行与仓位引擎

**前端策略**:
- 通过 `Service Interface + MockAdapter` 先完成可解释模拟
- 后续接后端时只替换 Adapter，不改 UI 与领域模型

### 7.5 防跑偏原则（新增）
1. 新增功能必须先回答：是否提升用户理解与操作正确率。
2. 如果功能主要在“计算权威状态”，默认归后端，不在前端重建。
3. 前端优先做“展示、解释、预校验、流程引导”，而不是做完整引擎。

---

## 八、里程碑

| 里程碑 | 完成标志 | 预计时间 | 状态 |
|-------|---------|---------|---------|
| ~~M1~~ | ~~MarketDataHub 上线，单一 WS 连接~~ | ~~Day 2~~ | ✅ 已完成 |
| ~~M2~~ | ~~交易规则动态加载，下单校验完整~~ | ~~Day 3~~ | ✅ 已完成 |
| ~~M3~~ | ~~生命周期时间线 + 账务分录可追溯~~ | ~~Day 5~~ | ✅ 已完成 |
| ~~M4~~ | ~~风控可解释拒单 + 费率引擎上线~~ | ~~Day 7~~ | ✅ 已完成 |
| ~~M5~~ | ~~撮合引擎 + OrderBook Worker + 深度图~~ | ~~Day 8~~ | ✅ 已完成 |
| M6 | 虚拟列表 + RAF 节流 | Day 1-2 | ❌ 待做 |
| M7 | 交易页 Tab 框架 + 杠杆 UI 面板 | Day 3-5 | ❌ 待做 |
| M8 | 合约 UI 面板（可选） | Day 6-7 | ❌ 待做 |

---

**🚀 确认此计划后即可开始实施！**
