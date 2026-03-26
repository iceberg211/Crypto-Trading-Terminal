# Repository Guidelines

## 项目概述

高仿真 CEX 现货交易页面原型，React + TypeScript + Jotai 构建，集成 Binance 实时行情数据，使用本地模拟撮合引擎。

## 项目结构与模块组织

```text
src/
├── core/                    # 基础设施层（无业务逻辑，无 React）
│   ├── api/                 # REST 客户端（binance.ts, client.ts）
│   ├── config/              # 运行时配置、ExchangeInfo
│   └── gateway/             # WebSocket 统一订阅层（MarketDataHub, WebSocketManager, useNetworkStatus）
│
├── domain/                  # 领域层（纯 TS 业务逻辑 + Jotai 原子）
│   ├── account/             # 账户余额状态
│   ├── exchange/            # 生命周期事件追踪 + 账本审计
│   │   ├── ledger/          # 账务分录（builders, validation）
│   │   └── lifecycle/       # 订单生命周期状态机
│   ├── fee/                 # 费率引擎（maker/taker/VIP）
│   ├── risk/                # 风控规则引擎（含三条内置规则）
│   └── trading/             # 撮合引擎、订单状态机、useTradingService
│       ├── engine/          # MatchingEngine, OrderStateMachine, OrderValidator
│       ├── hooks/           # useTradingService
│       └── types/
│
├── features/                # 特性层（React 组件 + 特性专属 hooks/atoms）
│   ├── account/             # 资产面板 AssetPanel
│   ├── chart/               # K 线图表、技术指标、画线工具
│   ├── exchange/            # 审计抽屉、账本列表、生命周期时间线
│   ├── orderbook/           # 订单簿组件、useOrderBook、useOrderBookEngine
│   ├── orders/              # 订单面板 OrderPanel、委托/历史/成交列表
│   ├── symbol/              # 交易对选择器 SymbolSelector
│   ├── ticker/              # TickerBar、useTicker
│   └── trade/               # TradeForm、RecentTrades、FeePreview、TradeConfirmationModal
│
├── components/              # 共享纯 UI 组件（无业务逻辑）
│   ├── layout/              # TradingLayout
│   └── ui/                  # Button, Card, Badge, Input, Panel, ConnectionStatus, DevPanel…
│
├── workers/                 # Web Workers
│   ├── orderbook.worker.ts  # 订单簿增量合并引擎
│   └── types.ts             # Worker 消息类型定义
│
├── types/                   # 全局第三方类型声明
│   ├── binance.ts           # Binance API 类型
│   └── tradingview.d.ts     # TradingView Widget 类型
│
├── utils/                   # 共享工具函数
│   └── decimal.ts           # 精度计算（基于 decimal.js）
│
└── styles/
    └── globals.css          # 全局样式
```

### 关键分层规则

| 层 | 职责 | 禁止 |
| --- | --- | --- |
| `core/` | 网络 I/O、WS 连接、HTTP 客户端 | 不引入 React、不含业务状态 |
| `domain/` | 业务逻辑、状态原子、引擎 | 不直接操作 DOM、不依赖 features/ |
| `features/` | UI + 特性 hooks | 不跨 feature 互相依赖（走 domain/ 共享） |
| `components/ui/` | 纯视觉组件 | 不引入任何 domain/ 或 features/ |

## 构建、测试与开发命令

- `pnpm install`：安装依赖（项目默认包管理器为 pnpm）
- `pnpm dev`：启动 Vite 开发服务器（端口 3000）
- `pnpm build`：先运行 `tsc` 再执行 Vite 打包
- `pnpm preview`：本地预览生产构建
- `pnpm test`：运行 Vitest 单元测试
- `pnpm lint`：运行 ESLint 静态检查

## 编码风格与命名规范

- TypeScript + React 18，组件为函数式写法
- 2 空格缩进、单引号、语句末尾分号
- 组件文件 `PascalCase.tsx`，Hooks `useXxx.ts`，业务引擎 `XxxEngine.ts`
- 路径别名 `@/` 指向 `src/`，所有跨目录导入必须使用 `@/`
- 特性内部可用相对路径（如 `'../hooks/useOrderBook'`）

## 开发与配置提示

- REST 请求走 `/api` 前缀，已代理到 `https://data-api.binance.vision`（避免 CORS）
- WebSocket 统一通过 `marketDataHub`（`@/core/gateway`）订阅，禁止在组件内直接 new WebSocket
- 新增数据源优先复用 `core/api/` 和 `core/gateway/` 的封装
- Worker 类型定义统一放在 `workers/types.ts`

## 测试指南

- 测试框架：Vitest + @testing-library/react
- 测试文件与源文件同目录，命名 `*.test.ts` / `*.test.tsx`
- 测试文件不参与生产构建（tsconfig.json 已排除）

## 提交与 Pull Request 指南

- 历史提交信息中英混用，保持简洁，使用 `feat:` / `fix:` / `chore:` 前缀
- PR 包含变更说明、关键路径影响（如行情/WS 逻辑），UI 改动附截图

## 安全与范围说明

- 本项目为前端原型，使用本地模拟撮合引擎
- 不在前端引入 API Key、签名或真实下单逻辑
- "真实执行"能力（清算、风控、账本）仅定义接口契约，前端实现 MockAdapter

## Agent 指引

- 默认使用中文回复，除非明确要求英文
- 新增特性组件放入对应 `features/X/components/`，不要放 `components/trading/`（已废弃）
- 新增基础设施放入 `core/`，业务状态放入 `domain/`
