import { atom } from 'jotai';
import {
  readLifecycleEvents,
  pruneLifecycleEvents,
  writeLifecycleEvents,
} from '../storage';
import type {
  AppendLifecycleEventInput,
  FlowSummary,
  LifecycleEvent,
  LifecycleStage,
} from './types';

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function isTerminalStage(stage: LifecycleStage): boolean {
  return stage === 'ORDER_FILLED' || stage === 'ORDER_CANCELED' || stage === 'ORDER_REJECTED';
}

const initialEvents = readLifecycleEvents();

export const lifecycleEventsAtom = atom<LifecycleEvent[]>(initialEvents);

export const appendLifecycleEventAtom = atom(
  null,
  (get, set, input: AppendLifecycleEventInput) => {
    const events = get(lifecycleEventsAtom);
    const event: LifecycleEvent = {
      eventId: input.eventId || createId('le'),
      timestamp: input.timestamp || Date.now(),
      ...input,
    };
    const next = pruneLifecycleEvents([...events, event]);
    set(lifecycleEventsAtom, next);
    writeLifecycleEvents(next);
  }
);

export const pruneLifecycleEventsAtom = atom(
  null,
  (get, set) => {
    const next = pruneLifecycleEvents(get(lifecycleEventsAtom));
    set(lifecycleEventsAtom, next);
    writeLifecycleEvents(next);
  }
);

export const clearLifecycleEventsAtom = atom(
  null,
  (_get, set) => {
    set(lifecycleEventsAtom, []);
    writeLifecycleEvents([]);
  }
);

export const getEventsByOrderAtom = atom(
  (get) => (orderId: number): LifecycleEvent[] =>
    get(lifecycleEventsAtom)
      .filter((event) => event.orderId === orderId)
      .sort((a, b) => a.timestamp - b.timestamp)
);

export const flowSummariesAtom = atom((get): FlowSummary[] => {
  const events = get(lifecycleEventsAtom).slice().sort((a, b) => a.timestamp - b.timestamp);
  const map = new Map<string, FlowSummary>();

  for (const event of events) {
    const current = map.get(event.flowId);
    if (!current) {
      map.set(event.flowId, {
        flowId: event.flowId,
        orderId: event.orderId,
        status: isTerminalStage(event.stage) ? 'COMPLETED' : 'OPEN',
        createdAt: event.timestamp,
        updatedAt: event.timestamp,
        latestStage: event.stage,
      });
      continue;
    }

    map.set(event.flowId, {
      ...current,
      updatedAt: event.timestamp,
      latestStage: event.stage,
      status: event.stage === 'ORDER_REJECTED'
        ? 'FAILED'
        : isTerminalStage(event.stage)
          ? 'COMPLETED'
          : current.status,
    });
  }

  return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
});

export const lifecycleOrderIdsAtom = atom((get): number[] => {
  const ids = new Set<number>();
  for (const event of get(lifecycleEventsAtom)) {
    ids.add(event.orderId);
  }
  return Array.from(ids).sort((a, b) => b - a);
});
