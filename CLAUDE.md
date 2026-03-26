# CLAUDE.md — 项目快速上手指南

> 本文件供 Claude Code 在新会话开始时自动加载，提供项目背景、架构速览和协作规范。

## 项目是什么

**高仿真 CEX 现货交易页面原型**，纯前端实现：

- 接入 Binance 实时行情（WebSocket + REST）
- 本地模拟撮合引擎（非真实下单）
- 完整 CEX 领域模型：订单生命周期、账本审计、费率引擎、风控规则

**技术栈**：React 18 + TypeScript + Jotai + Vite + Tailwind CSS + Lightweight Charts

## 目录结构速览

```text
src/
├── app/          应用入口（App.tsx、main.tsx）
├── core/         基础设施（API 客户端、WebSocket 管理、运行时配置）
├── domain/       业务领域（撮合引擎、风控、费率、账本、生命周期）
├── features/     特性模块（每个业务域一个目录，含 components/hooks/atoms）
├── components/   共享 UI 组件（ui/ 纯样式，layout/ 布局）
├── workers/      Web Worker（订单簿增量合并引擎）
├── types/        全局类型声明
└── utils/        工具函数（decimal.ts 精度计算）
```

详细结构见 [AGENTS.md](./AGENTS.md)。

## 常用命令

```bash
pnpm dev          # 开发服务器（端口 3000）
pnpm build        # 生产构建（tsc + vite build）
pnpm test         # 单元测试（Vitest）
pnpm lint         # ESLint 检查
```

## 当前开发进度（test 分支）

已完成的 P0 任务（待合并到 main）：

- 订单生命周期事件流 → `domain/exchange/lifecycle/`
- 账务分录（账本审计）→ `domain/exchange/ledger/`
- 费率引擎（maker/taker/VIP）→ `domain/fee/`
- 风控规则引擎 → `domain/risk/`
- 审计 UI（ExchangeAuditDrawer、时间线、账本列表）→ `features/exchange/`

下一步待做（按优先级）：

1. **P0** 账户体系双模式（统一账户 vs 经典账户）
2. **P1** MarketDataHub 单连接验证（仅 1 个 WS 连接）
3. **P1** ExchangeInfo 动态交易规则集成
4. **P1** 现货杠杆最小闭环（借币/还币/利息）

详细计划见 [docs/CEX-Implementation-Plan.md](./docs/CEX-Implementation-Plan.md)。

## 架构约束（必须遵守）

1. **WebSocket 不直接 new**：所有实时数据订阅走 `marketDataHub`（`@/core/gateway`）
2. **API 调用走 `core/api/`**：不要在组件或 hooks 里直接 `fetch` Binance 接口（除非特殊场景）
3. **特性组件放 `features/X/components/`**：不要放回 `components/trading/`（已删除）
4. **真实执行能力只定义接口**：前端实现 MockAdapter，不引入 API Key 或签名逻辑
5. **测试文件命名 `*.test.ts`**：与源文件同目录，已从生产构建排除

## 重要文件索引

| 文件 | 作用 |
| --- | --- |
| `src/core/gateway/MarketDataHub.ts` | 统一 WS 订阅层入口 |
| `src/core/api/binance.ts` | Binance REST API 封装 |
| `src/domain/trading/hooks/useTradingService.ts` | 下单主流程（集成风控+费率+撮合） |
| `src/domain/exchange/lifecycle/lifecycleAtom.ts` | 订单生命周期事件流 |
| `src/domain/exchange/ledger/ledgerAtom.ts` | 账务分录 |
| `src/domain/fee/FeeEngine.ts` | 费率计算引擎 |
| `src/domain/risk/RiskEngine.ts` | 风控规则引擎 |
| `src/workers/orderbook.worker.ts` | 订单簿 Worker（增量合并） |
| `src/workers/types.ts` | Worker 消息类型定义 |
| `src/components/layout/TradingLayout.tsx` | 页面整体布局 |

## 数据代理配置

本地开发时 `/api` 代理到 `https://data-api.binance.vision`，无需处理 CORS。见 `vite.config.ts`。

## 默认语言

中文回复，除非用户明确要求英文。
