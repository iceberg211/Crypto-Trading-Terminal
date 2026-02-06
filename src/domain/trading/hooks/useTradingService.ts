/**
 * 交易服务 Hook
 * 统一管理下单、取消、查询等交易操作
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import Decimal from 'decimal.js';
import { orderBookAtom } from '@/features/orderbook/atoms/orderBookAtom';
import { symbolConfigAtom } from '@/features/symbol/atoms/symbolAtom';
import { tickerAtom } from '@/features/ticker/atoms/tickerAtom';
import { matchingEngine } from '@/domain/trading/engine';
import {
  lockBalanceAtom,
  unlockBalanceAtom,
  executeTradeAtom,
  availableBalancesAtom,
} from '@/domain/account';
import {
  appendLifecycleEventAtom,
  appendLedgerJournalAtom,
  buildFeeJournal,
  buildLockJournal,
  buildTradeSettleJournal,
  buildUnlockJournal,
} from '@/domain/exchange';
import type { NewOrderRequest, Order, OrderResponse, OrderSide, OrderType } from '@/domain/trading/types';
import type { LifecycleStage } from '@/domain/exchange';

interface TradingServiceReturn {
  submitOrder: (params: SubmitOrderParams) => OrderResponse;
  cancelOrder: (orderId: number) => OrderResponse;
  getActiveOrders: () => Order[];
  getOrderHistory: () => Order[];
  availableBalances: Record<string, string>;
  currentSymbol: string;
  baseAsset: string;
  quoteAsset: string;
  currentPrice: string;
}

interface SubmitOrderParams {
  side: OrderSide;
  type: OrderType;
  quantity: string;
  price?: string;
  stopPrice?: string;
}

function createFlowId(orderIdHint: number): string {
  return `flow_${orderIdHint}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useTradingService(): TradingServiceReturn {
  const orderBook = useAtomValue(orderBookAtom);
  const symbolConfig = useAtomValue(symbolConfigAtom);
  const ticker = useAtomValue(tickerAtom);
  const availableBalances = useAtomValue(availableBalancesAtom);

  const lockBalance = useSetAtom(lockBalanceAtom);
  const unlockBalance = useSetAtom(unlockBalanceAtom);
  const executeTrade = useSetAtom(executeTradeAtom);

  const appendLifecycleEvent = useSetAtom(appendLifecycleEventAtom);
  const appendLedgerJournal = useSetAtom(appendLedgerJournalAtom);

  const currentPrice = ticker?.lastPrice || '0';

  const flowByOrderIdRef = useRef<Map<number, string>>(new Map());
  const processedTradeIdsRef = useRef<Set<number>>(new Set());
  const lastCheckPriceRef = useRef<string>('');

  const ensureFlowId = useCallback((orderId: number, fallback?: string): string => {
    const existing = flowByOrderIdRef.current.get(orderId);
    if (existing) return existing;

    const next = fallback || createFlowId(orderId);
    flowByOrderIdRef.current.set(orderId, next);
    return next;
  }, []);

  const pushLifecycle = useCallback((params: {
    flowId: string;
    orderId: number;
    side: OrderSide;
    stage: LifecycleStage;
    payload?: Record<string, unknown>;
    symbol?: string;
  }) => {
    appendLifecycleEvent({
      flowId: params.flowId,
      orderId: params.orderId,
      symbol: params.symbol || symbolConfig.symbol,
      side: params.side,
      stage: params.stage,
      payload: params.payload,
    });
  }, [appendLifecycleEvent, symbolConfig.symbol]);

  const pushJournal = useCallback((journalBuilder: () => ReturnType<typeof buildLockJournal> | null) => {
    const journal = journalBuilder();
    if (!journal) return;

    try {
      appendLedgerJournal(journal);
    } catch (error) {
      console.error('[TradingService] Ledger journal rejected:', error);
    }
  }, [appendLedgerJournal]);

  const logOrderStatusStage = useCallback((order: Order, flowId: string) => {
    if (order.status === 'NEW') {
      pushLifecycle({ flowId, orderId: order.orderId, side: order.side, stage: 'ORDER_ACCEPTED', symbol: order.symbol });
    } else if (order.status === 'PARTIALLY_FILLED') {
      pushLifecycle({ flowId, orderId: order.orderId, side: order.side, stage: 'ORDER_PARTIALLY_FILLED', symbol: order.symbol });
    } else if (order.status === 'FILLED') {
      pushLifecycle({ flowId, orderId: order.orderId, side: order.side, stage: 'ORDER_FILLED', symbol: order.symbol });
    } else if (order.status === 'CANCELED') {
      pushLifecycle({ flowId, orderId: order.orderId, side: order.side, stage: 'ORDER_CANCELED', symbol: order.symbol });
    } else if (order.status === 'REJECTED') {
      pushLifecycle({
        flowId,
        orderId: order.orderId,
        side: order.side,
        stage: 'ORDER_REJECTED',
        symbol: order.symbol,
        payload: { rejectReason: order.rejectReason || 'UNKNOWN' },
      });
    }
  }, [pushLifecycle]);

  const settleFill = useCallback((params: {
    flowId: string;
    order: Order;
    fill: Order['fills'][number];
  }) => {
    const { flowId, order, fill } = params;

    if (processedTradeIdsRef.current.has(fill.tradeId)) {
      return;
    }
    processedTradeIdsRef.current.add(fill.tradeId);

    const quoteAmount = new Decimal(fill.quantity).times(new Decimal(fill.price)).toFixed(8);

    executeTrade({
      baseAsset: symbolConfig.baseAsset,
      quoteAsset: symbolConfig.quoteAsset,
      side: order.side,
      baseAmount: fill.quantity,
      quoteAmount,
      commission: fill.commission,
      commissionAsset: fill.commissionAsset,
    });

    pushLifecycle({
      flowId,
      orderId: order.orderId,
      side: order.side,
      symbol: order.symbol,
      stage: 'TRADE_SETTLED',
      payload: {
        tradeId: fill.tradeId,
        price: fill.price,
        quantity: fill.quantity,
        commission: fill.commission,
        commissionAsset: fill.commissionAsset,
      },
    });

    pushJournal(() => buildTradeSettleJournal(
      {
        flowId,
        orderId: order.orderId,
        symbol: order.symbol,
        side: order.side,
      },
      {
        baseAsset: symbolConfig.baseAsset,
        quoteAsset: symbolConfig.quoteAsset,
        baseAmount: fill.quantity,
        quoteAmount,
        tradeId: fill.tradeId,
      }
    ));

    pushLifecycle({
      flowId,
      orderId: order.orderId,
      side: order.side,
      symbol: order.symbol,
      stage: 'LEDGER_POSTED',
      payload: {
        kind: 'TRADE_SETTLE',
        tradeId: fill.tradeId,
      },
    });

    const feeJournal = buildFeeJournal(
      {
        flowId,
        orderId: order.orderId,
        symbol: order.symbol,
        side: order.side,
      },
      {
        commissionAsset: fill.commissionAsset,
        commission: fill.commission,
        tradeId: fill.tradeId,
      }
    );

    if (feeJournal) {
      pushJournal(() => feeJournal);
      pushLifecycle({
        flowId,
        orderId: order.orderId,
        side: order.side,
        symbol: order.symbol,
        stage: 'LEDGER_POSTED',
        payload: {
          kind: 'FEE',
          tradeId: fill.tradeId,
        },
      });
    }
  }, [executeTrade, pushJournal, pushLifecycle, symbolConfig.baseAsset, symbolConfig.quoteAsset]);

  const unlockAndRecord = useCallback((params: {
    flowId: string;
    orderId: number;
    side: OrderSide;
    symbol: string;
    asset: string;
    amount: string;
  }) => {
    const unlockAmount = new Decimal(params.amount || '0');
    if (unlockAmount.lte(0)) return;

    unlockBalance({ asset: params.asset, amount: unlockAmount.toFixed(8) });

    pushLifecycle({
      flowId: params.flowId,
      orderId: params.orderId,
      side: params.side,
      symbol: params.symbol,
      stage: 'FUNDS_UNLOCKED',
      payload: { asset: params.asset, amount: unlockAmount.toFixed(8) },
    });

    pushJournal(() => buildUnlockJournal(
      {
        flowId: params.flowId,
        orderId: params.orderId,
        symbol: params.symbol,
        side: params.side,
      },
      {
        asset: params.asset,
        amount: unlockAmount.toFixed(8),
      }
    ));

    pushLifecycle({
      flowId: params.flowId,
      orderId: params.orderId,
      side: params.side,
      symbol: params.symbol,
      stage: 'LEDGER_POSTED',
      payload: {
        kind: 'UNLOCK',
        asset: params.asset,
        amount: unlockAmount.toFixed(8),
      },
    });
  }, [pushJournal, pushLifecycle, unlockBalance]);

  useEffect(() => {
    if (!currentPrice || currentPrice === '0') return;
    if (currentPrice === lastCheckPriceRef.current) return;
    lastCheckPriceRef.current = currentPrice;

    const orderBookData = {
      bids: orderBook.bids,
      asks: orderBook.asks,
    };

    const triggeredOrders = matchingEngine.checkStopOrders(currentPrice, orderBookData);
    if (triggeredOrders.length > 0) {
      for (const order of triggeredOrders) {
        const flowId = ensureFlowId(order.orderId);
        pushLifecycle({
          flowId,
          orderId: order.orderId,
          side: order.side,
          symbol: order.symbol,
          stage: 'ORDER_TRIGGERED',
          payload: { currentPrice },
        });

        for (const fill of order.fills) {
          settleFill({ flowId, order, fill });
        }

        logOrderStatusStage(order, flowId);
      }
    }

    const matchedLimitOrders = matchingEngine.checkLimitOrders(orderBookData);
    if (matchedLimitOrders.length > 0) {
      for (const { order, newFills } of matchedLimitOrders) {
        const flowId = ensureFlowId(order.orderId);

        for (const fill of newFills) {
          settleFill({ flowId, order, fill });
        }

        logOrderStatusStage(order, flowId);

        if (order.status === 'FILLED') {
          let lockAsset: string;
          let initialLockAmount: Decimal;

          if (order.side === 'BUY') {
            lockAsset = symbolConfig.quoteAsset;
            initialLockAmount = new Decimal(order.origQty).times(order.price).times(1.001);
          } else {
            lockAsset = symbolConfig.baseAsset;
            initialLockAmount = new Decimal(order.origQty);
          }

          const usedAmount = order.side === 'BUY'
            ? new Decimal(order.cummulativeQuoteQty)
            : new Decimal(order.executedQty);
          const remainingLock = initialLockAmount.minus(usedAmount);

          unlockAndRecord({
            flowId,
            orderId: order.orderId,
            side: order.side,
            symbol: order.symbol,
            asset: lockAsset,
            amount: remainingLock.toFixed(8),
          });
        }
      }
    }
  }, [
    currentPrice,
    ensureFlowId,
    logOrderStatusStage,
    orderBook,
    settleFill,
    symbolConfig.baseAsset,
    symbolConfig.quoteAsset,
    unlockAndRecord,
    pushLifecycle,
  ]);

  const submitOrder = useCallback((params: SubmitOrderParams): OrderResponse => {
    const { side, type, quantity, price, stopPrice } = params;

    const predictedOrderId = matchingEngine.peekNextOrderId();
    const flowId = createFlowId(predictedOrderId);

    pushLifecycle({
      flowId,
      orderId: predictedOrderId,
      side,
      symbol: symbolConfig.symbol,
      stage: 'ORDER_SUBMIT_REQUESTED',
      payload: {
        type,
        quantity,
        price: price || null,
        stopPrice: stopPrice || null,
      },
    });

    const request: NewOrderRequest = {
      symbol: symbolConfig.symbol,
      side,
      type,
      quantity,
      price,
      stopPrice,
      timeInForce: type === 'MARKET' ? 'IOC' : 'GTC',
    };

    let lockAsset: string;
    let lockAmount: string;

    if (side === 'BUY') {
      lockAsset = symbolConfig.quoteAsset;
      const qty = new Decimal(quantity);
      const orderPrice = price ? new Decimal(price) : new Decimal(currentPrice || '0');
      lockAmount = qty.times(orderPrice).times(1.001).toFixed(8);
    } else {
      lockAsset = symbolConfig.baseAsset;
      lockAmount = quantity;
    }

    const currentBalance = availableBalances[lockAsset] || '0';
    if (new Decimal(lockAmount).gt(new Decimal(currentBalance))) {
      pushLifecycle({
        flowId,
        orderId: predictedOrderId,
        side,
        symbol: symbolConfig.symbol,
        stage: 'ORDER_REJECTED',
        payload: {
          code: 'INSUFFICIENT_BALANCE',
          message: `${lockAsset} 余额不足`,
        },
      });

      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: `${lockAsset} 余额不足`,
          reason: 'INSUFFICIENT_BALANCE',
        },
      };
    }

    const lockOk = lockBalance({ asset: lockAsset, amount: lockAmount });
    if (!lockOk) {
      pushLifecycle({
        flowId,
        orderId: predictedOrderId,
        side,
        symbol: symbolConfig.symbol,
        stage: 'ORDER_REJECTED',
        payload: {
          code: 'LOCK_FAILED',
          message: `${lockAsset} 冻结失败`,
        },
      });

      return {
        success: false,
        error: {
          code: 'LOCK_FAILED',
          message: `${lockAsset} 冻结失败`,
          reason: 'INSUFFICIENT_BALANCE',
        },
      };
    }

    pushLifecycle({
      flowId,
      orderId: predictedOrderId,
      side,
      symbol: symbolConfig.symbol,
      stage: 'FUNDS_LOCKED',
      payload: { asset: lockAsset, amount: lockAmount },
    });

    pushJournal(() => buildLockJournal(
      {
        flowId,
        orderId: predictedOrderId,
        symbol: symbolConfig.symbol,
        side,
      },
      {
        asset: lockAsset,
        amount: lockAmount,
      }
    ));

    pushLifecycle({
      flowId,
      orderId: predictedOrderId,
      side,
      symbol: symbolConfig.symbol,
      stage: 'LEDGER_POSTED',
      payload: {
        kind: 'LOCK',
        asset: lockAsset,
        amount: lockAmount,
      },
    });

    const orderBookData = {
      bids: orderBook.bids,
      asks: orderBook.asks,
    };

    const response = matchingEngine.submitOrder(request, orderBookData, currentBalance);

    if (!response.success || !response.order) {
      pushLifecycle({
        flowId,
        orderId: predictedOrderId,
        side,
        symbol: symbolConfig.symbol,
        stage: 'ORDER_REJECTED',
        payload: {
          code: response.error?.code || 'VALIDATION_FAILED',
          message: response.error?.message || '订单校验失败',
          reason: response.error?.reason || 'UNKNOWN',
        },
      });

      unlockAndRecord({
        flowId,
        orderId: predictedOrderId,
        side,
        symbol: symbolConfig.symbol,
        asset: lockAsset,
        amount: lockAmount,
      });

      return response;
    }

    const order = response.order;
    ensureFlowId(order.orderId, flowId);

    pushLifecycle({
      flowId,
      orderId: order.orderId,
      side,
      symbol: order.symbol,
      stage: 'ORDER_VALIDATED',
    });

    logOrderStatusStage(order, flowId);

    for (const fill of order.fills) {
      settleFill({ flowId, order, fill });
    }

    if (order.status === 'FILLED' || order.status === 'REJECTED' || order.status === 'CANCELED') {
      const usedAmount = side === 'BUY'
        ? new Decimal(order.cummulativeQuoteQty)
        : new Decimal(order.executedQty);
      const remainingLock = new Decimal(lockAmount).minus(usedAmount);

      unlockAndRecord({
        flowId,
        orderId: order.orderId,
        side,
        symbol: order.symbol,
        asset: lockAsset,
        amount: remainingLock.toFixed(8),
      });
    }

    return response;
  }, [
    availableBalances,
    currentPrice,
    ensureFlowId,
    lockBalance,
    logOrderStatusStage,
    orderBook.asks,
    orderBook.bids,
    pushJournal,
    pushLifecycle,
    settleFill,
    symbolConfig.baseAsset,
    symbolConfig.quoteAsset,
    symbolConfig.symbol,
    unlockAndRecord,
  ]);

  const cancelOrder = useCallback((orderId: number): OrderResponse => {
    const order = matchingEngine.getOrder(orderId);
    if (!order) {
      return {
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: `订单 ${orderId} 不存在`,
        },
      };
    }

    const flowId = ensureFlowId(orderId);
    const response = matchingEngine.cancelOrder(orderId);

    if (response.success && response.order) {
      pushLifecycle({
        flowId,
        orderId,
        side: order.side,
        symbol: order.symbol,
        stage: 'ORDER_CANCELED',
      });

      const remainingQty = new Decimal(order.origQty).minus(new Decimal(order.executedQty));
      if (remainingQty.gt(0)) {
        const refundAmount = order.side === 'BUY'
          ? remainingQty.times(new Decimal(order.price)).toFixed(8)
          : remainingQty.toFixed(8);
        const refundAsset = order.side === 'BUY' ? symbolConfig.quoteAsset : symbolConfig.baseAsset;

        unlockAndRecord({
          flowId,
          orderId,
          side: order.side,
          symbol: order.symbol,
          asset: refundAsset,
          amount: refundAmount,
        });
      }
    }

    return response;
  }, [ensureFlowId, symbolConfig.baseAsset, symbolConfig.quoteAsset, unlockAndRecord, pushLifecycle]);

  const getActiveOrders = useCallback(() => matchingEngine.getActiveOrders(), []);
  const getOrderHistory = useCallback(() => matchingEngine.getOrderHistory(), []);

  return {
    submitOrder,
    cancelOrder,
    getActiveOrders,
    getOrderHistory,
    availableBalances,
    currentSymbol: symbolConfig.symbol,
    baseAsset: symbolConfig.baseAsset,
    quoteAsset: symbolConfig.quoteAsset,
    currentPrice,
  };
}
