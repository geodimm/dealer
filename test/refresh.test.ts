import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataFile } from '../src/lib/types';

const kv = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../src/lib/idb', () => ({
  idbGet: async (key: string) => kv.get(key),
  idbSet: async (key: string, value: unknown) => void kv.set(key, value),
}));

import { refresh } from '../src/lib/watch';

describe('refresh', () => {
  const cached = { generatedAt: '2026-10-10T18:00:00Z', offers: [] } as unknown as DataFile;
  beforeEach(() => {
    kv.clear();
    kv.set('data', cached);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('falls back to the cached data and says the download failed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect(await refresh('data/offers.json', null)).toEqual({ data: cached, fetched: false });
  });

  it('returns and caches the downloaded data', async () => {
    const latest = { generatedAt: '2026-10-11T07:15:00Z', offers: [] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(latest))));
    expect(await refresh('data/offers.json', null)).toEqual({ data: latest, fetched: true });
    expect(kv.get('data')).toEqual(latest);
  });
});
