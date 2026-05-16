import { atom } from 'jotai';

export type AuditTab = 'lifecycle' | 'ledger';

export const auditDrawerOpenAtom = atom(false);
export const auditDrawerTabAtom = atom<AuditTab>('lifecycle');
export const auditSelectedOrderIdAtom = atom<number | null>(null);
