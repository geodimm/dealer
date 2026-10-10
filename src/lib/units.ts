// Price per piece / kg / litre. Piece counts come from (in order) what the
// user typed in for that offer, the pack text, or an estimate from weight.

import type { Counts, Offer } from './types';

export type UnitKind = 'pc' | 'kg' | 'l';
export interface UnitPrice {
  value: number;
  kind: UnitKind;
  /** Estimated piece count (e.g. capsules from the box weight). */
  est: boolean;
  /** Piece count used, when kind is "pc". */
  count?: number;
  /** The count was typed in by the user. */
  user?: boolean;
}

export function piecePrice(o: Offer, counts: Counts = {}): UnitPrice | null {
  const mine = counts[o.id];
  if (mine && mine > 0) return { value: o.price / mine, kind: 'pc', est: false, count: mine, user: true };
  if (o.pcs && o.pcs > 1) return { value: o.price / o.pcs, kind: 'pc', est: !!o.pcsEst, count: o.pcs };
  return null;
}

export function weightPrice(o: Offer): UnitPrice | null {
  return o.unit != null && o.unitOf ? { value: o.unit, kind: o.unitOf, est: false } : null;
}

/** The most useful unit price to show: per piece when known, else per kg/l. */
export const bestUnit = (o: Offer, counts: Counts = {}) => piecePrice(o, counts) ?? weightPrice(o);

export function unitPriceIn(o: Offer, kind: UnitKind, counts: Counts = {}): UnitPrice | null {
  if (kind === 'pc') return piecePrice(o, counts);
  const w = weightPrice(o);
  return w && w.kind === kind ? w : null;
}

const SUFFIX: Record<UnitKind, string> = { pc: 'бр.', kg: 'кг', l: 'л' };
export const unitName = (k: UnitKind) => SUFFIX[k];

export function unitText(u: UnitPrice | null): string {
  if (!u) return '';
  const digits = u.kind === 'pc' && u.value < 1 ? 3 : 2;
  return `${u.est ? '≈' : ''}€${u.value.toFixed(digits)}/${SUFFIX[u.kind]}`;
}
