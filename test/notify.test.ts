import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, unknown>();
vi.mock('../src/lib/idb', () => ({
  idbGet: async (k: string) => store.get(k),
  idbSet: async (k: string, v: unknown) => void store.set(k, v),
}));

const { refresh, saveWatches } = await import('../src/lib/watch');
import type { DataFile, Offer, Watch } from '../src/lib/types';

const watch: Watch = { id: 'w1', term: 'dolce gusto', maxPrice: null, minPct: null, maxUnit: null, exclude: [], createdAt: 0 };
const dg = { id: 'K-1', store: 'kaufland', brand: 'Nescafe', name: 'Кафе капсули Dolce Gusto', desc: '', pack: '30 бр.', price: 8.69, old: 12.79, pct: 32, unit: null, unitOf: null, from: '2026-10-12', to: '2026-10-18', image: null, url: null, cat: 'coffee' } as Offer;
const data = (offers: Offer[]): DataFile => ({ version: 1, generatedAt: '', stores: [{ id: 'kaufland', name: 'Kaufland', color: '' }] as DataFile['stores'], categories: [], attribution: [], offers });

async function run(day: string, offers: Offer[]) {
  vi.setSystemTime(new Date(`${day}T09:00:00`));
  vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => data(offers) }));
  const sent: string[] = [];
  await refresh('x', (title) => void sent.push(title));
  return sent;
}

describe('watch notifications', () => {
  beforeEach(() => {
    store.clear();
    vi.useFakeTimers();
  });

  it('pings when an offer is announced and again on the day it starts', async () => {
    store.set('watches', [watch]);
    expect(await run('2026-10-09', [dg])).toEqual(['„dolce gusto“ е в промоция']);
    expect(await run('2026-10-10', [dg])).toEqual([]);
    expect(await run('2026-10-12', [dg])).toEqual(['„dolce gusto“ – промоцията започна']);
    expect(await run('2026-10-13', [dg])).toEqual([]);
  });

  it('pings once for an offer first seen already running', async () => {
    store.set('watches', [watch]);
    expect(await run('2026-10-13', [dg])).toEqual(['„dolce gusto“ е в промоция']);
    expect(await run('2026-10-14', [dg])).toEqual([]);
  });

  it('after following an announced offer, pings when it starts', async () => {
    vi.setSystemTime(new Date('2026-10-10T09:00:00'));
    store.set('data', data([dg]));
    await saveWatches([watch]);
    expect(await run('2026-10-11', [dg])).toEqual([]);
    expect(await run('2026-10-12', [dg])).toEqual(['„dolce gusto“ – промоцията започна']);
  });

  it('treats keys saved before stages as the announcement', async () => {
    store.set('watches', [watch]);
    store.set('notified', ['w1|K-1']);
    expect(await run('2026-10-12', [dg])).toEqual(['„dolce gusto“ – промоцията започна']);
  });
});
