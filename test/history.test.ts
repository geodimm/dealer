import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS build script
import { lows, productId, record } from '../scripts/history.mjs';

const offer = (p: Record<string, unknown>) => ({ id: 'K-1', store: 'kaufland', brand: 'Вълчев', name: 'Крема сирене', pack: '125 г', price: 0.85, old: 1.25, from: '2026-10-05', to: '2026-10-11', ...p });

describe('price history', () => {
  it('records each promo price once, with its offer id', () => {
    const h = { products: {}, months: {} as Record<string, unknown[]> };
    expect(record(h, [offer({})], '2026-10-05')).toBe(1);
    expect(record(h, [offer({})], '2026-10-06')).toBe(0);
    expect(record(h, [offer({ id: 'K-9', price: 0.79 })], '2026-10-06')).toBe(1);
    expect(h.months['2026-10']).toHaveLength(2);
    expect(h.months['2026-10'].map((r) => (r as unknown[])[7])).toEqual(['K-1', 'K-9']);
  });

  it('matches the same product despite case and punctuation', () => {
    expect(productId(offer({ name: 'КРЕМА СИРЕНЕ,' }))).toBe(productId(offer({})));
    expect(productId(offer({ pack: '200 г' }))).not.toBe(productId(offer({})));
  });

  it('finds the lowest earlier price per window, not counting the current promo', () => {
    const h = { products: {}, months: {} };
    record(h, [offer({ price: 0.69, from: '2026-03-02', to: '2026-03-08' })], '2026-03-02');
    record(h, [offer({ price: 0.79, from: '2026-08-03', to: '2026-08-09' })], '2026-08-03');
    record(h, [offer({ price: 0.99, from: '2026-09-07', to: '2026-09-13' })], '2026-09-07');
    const now = offer({ price: 0.75 });
    record(h, [now], '2026-10-05');
    const since = lows(h, [now], '2026-10-06');
    expect(since).toBe('2026-03-02');
    expect(now.low).toEqual({ m3: [0.79, '2026-08-03'], m6: [0.79, '2026-08-03'], m12: [0.69, '2026-03-02'] });
  });

  it('follows a renamed product through a reused offer id', () => {
    const h = { products: {}, months: {} };
    record(h, [offer({ price: 0.65, from: '2026-09-01', to: '2026-09-07' })], '2026-09-01');
    const renamed = offer({ name: 'Крема сирене натурално', price: 0.85 });
    lows(h, [renamed], '2026-10-06');
    expect(renamed.low?.m3).toEqual([0.65, '2026-09-01']);
  });
});

describe('vague names', () => {
  it('does not match a bare name without brand or pack', () => {
    const h = { products: {}, months: {} };
    const bare = { brand: '', pack: '', name: 'Топ комплект' };
    record(h, [offer({ ...bare, id: 'L-1', price: 5, from: '2026-09-01', to: '2026-09-07' })], '2026-09-01');
    const now = offer({ ...bare, id: 'L-2', price: 7 });
    lows(h, [now], '2026-10-06');
    expect(now.low).toBeUndefined();
  });
});
