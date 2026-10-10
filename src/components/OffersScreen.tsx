import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { DataFile, Filters, GroupKey, Offer, SortKey } from '../lib/types';
import { filterOffers, groupOffers, sortOffers } from '../lib/offers';
import { activeFilterCount } from '../lib/prefs';
import { OfferCard } from './OfferCard';
import { FilterSheet } from './FilterSheet';
import { SortMenu, SORTS } from './SortMenu';
import { Icon } from './Icon';

const PAGE = 48;

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function OffersScreen({
  data,
  today,
  filters,
  setFilters,
  sort,
  setSort,
  group,
  setGroup,
  isWatched,
  onOpen,
  onWatch,
  onMenu,
}: {
  data: DataFile;
  today: string;
  filters: Filters;
  setFilters: (f: Filters) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  group: GroupKey;
  setGroup: (g: GroupKey) => void;
  isWatched: (o: Offer) => boolean;
  onOpen: (o: Offer) => void;
  onWatch: (o: Offer) => void;
  onMenu: (o: Offer) => void;
}) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const q = useDebounced(query, 150);

  const results = useMemo(
    () => sortOffers(filterOffers(data.offers, q, filters, today), sort),
    [data, q, filters, sort, today],
  );
  const groups = useMemo(() => groupOffers(results, group, data.stores, data.categories, today), [results, group, data, today]);
  const catCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of data.offers) c[o.cat] = (c[o.cat] ?? 0) + 1;
    return c;
  }, [data]);

  // Endless list: render a page at a time, add more when the sentinel scrolls into view.
  useEffect(() => setLimit(PAGE), [q, filters, sort, group]);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && setLimit((l) => l + PAGE), {
      rootMargin: '1200px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [results.length, limit]);

  const nFilters = activeFilterCount(filters);
  const sortLabel = SORTS.find(([k]) => k === sort)?.[1];
  const sortChanged = sort !== 'pct' || group !== 'none';

  let budget = limit;
  return (
    <>
      <header class="top">
        <div class="searchrow">
          <label class="search">
            <Icon name="search" size={16} />
            <input
              type="search"
              value={query}
              placeholder="Търси…"
              aria-label="Търсене"
              enterKeyHint="search"
              onInput={(e) => setQuery(e.currentTarget.value)}
            />
            {query ? (
              <button class="iconbtn ghost" aria-label="Изчисти търсенето" onClick={() => setQuery('')}>
                <Icon name="close" size={16} />
              </button>
            ) : null}
          </label>
          <div class="sortwrap">
            <button
              class={`iconbtn round${sortChanged ? ' changed' : ''}`}
              aria-label={`Подреди: ${sortLabel}${group !== 'none' ? ', с групиране' : ''}`}
              aria-haspopup="menu"
              aria-expanded={showSort}
              onClick={() => setShowSort(true)}
            >
              <Icon name="sort" size={18} stroke={2.2} />
            </button>
            {showSort ? (
              <SortMenu sort={sort} group={group} onSort={setSort} onGroup={setGroup} onClose={() => setShowSort(false)} />
            ) : null}
          </div>
          <button class="filterbtn" aria-label={`Филтри${nFilters ? `, ${nFilters} активни` : ''}`} onClick={() => setShowFilters(true)}>
            <Icon name="filter" size={18} stroke={2.2} />
            {nFilters ? <span class="count">{nFilters}</span> : null}
          </button>
        </div>
        <p class="sr-only" aria-live="polite">
          {results.length} {results.length === 1 ? 'оферта' : 'оферти'}
        </p>
      </header>

      <main class="content">
        {results.length === 0 ? (
          <div class="empty">
            <strong>Няма оферти</strong>
            {q || nFilters ? 'Опитай с друга дума или по-малко филтри.' : 'Данните още не са заредени.'}
          </div>
        ) : (
          groups.map((g) => {
            if (budget <= 0) return null;
            const items = g.items.slice(0, budget);
            budget -= items.length;
            return (
              <section class="group" key={g.key}>
                {g.title ? (
                  <div class="grouphead">
                    {g.color ? <span class="dot" style={{ background: g.key === 'lidl' ? 'var(--lidl)' : g.color }} /> : null}
                    <span class="name">{g.title}</span>
                    <span class="n">{g.items.length}</span>
                    <span class="rule" />
                  </div>
                ) : null}
                <div class="grid">
                  {items.map((o) => (
                    <OfferCard
                      key={o.id}
                      offer={o}
                      store={data.stores.find((s) => s.id === o.store)}
                      today={today}
                      watched={isWatched(o)}
                      onOpen={onOpen}
                      onWatch={onWatch}
                      onMenu={onMenu}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
        {limit < results.length ? <div class="sentinel" ref={sentinel} /> : null}
      </main>

      {showFilters ? (
        <FilterSheet
          initial={filters}
          stores={data.stores}
          cats={data.categories}
          catCounts={catCounts}
          onApply={(f) => {
            setFilters(f);
            setShowFilters(false);
            window.scrollTo({ top: 0 });
          }}
          onClose={() => setShowFilters(false)}
        />
      ) : null}
    </>
  );
}
