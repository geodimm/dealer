import { useMemo } from 'preact/hooks';
import type { DataFile, Offer, Watch } from '../lib/types';
import { watchMatches } from '../lib/watch';
import { euro, whenLabel } from '../lib/offers';
import { storeColor } from './OfferCard';
import { Icon } from './Icon';

const SHOW = 4;

export function rulesText(w: Watch): string[] {
  const r: string[] = [];
  if (w.maxPrice != null) r.push(`цена ≤ ${euro(w.maxPrice)}`);
  if (w.minPct != null) r.push(`${r.length ? 'или ' : ''}отстъпка ≥ ${w.minPct}%`);
  if (w.maxUnit != null) r.push(`${r.length ? 'или ' : ''}≤ ${euro(w.maxUnit)}/кг·л`);
  if (!r.length) r.push('всяка цена');
  if (w.exclude.length) r.push(`без „${w.exclude.join('“, „')}“`);
  return r;
}

export function WatchScreen({
  data,
  watches,
  today,
  alertsOn,
  onEnableAlerts,
  onNew,
  onEdit,
  onOpen,
}: {
  data: DataFile | undefined;
  watches: Watch[];
  today: string;
  alertsOn: boolean;
  onEnableAlerts: () => void;
  onNew: () => void;
  onEdit: (w: Watch) => void;
  onOpen: (o: Offer) => void;
}) {
  const hits = useMemo(() => {
    const m = new Map<string, Offer[]>();
    for (const w of watches)
      m.set(w.id, (data?.offers ?? []).filter((o) => watchMatches(w, o, today)).sort((a, b) => a.price - b.price));
    return m;
  }, [data, watches, today]);

  return (
    <>
      <header class="top">
        <div class="brandrow">
          <h1 class="title">Следя</h1>
          <button class="filterbtn" onClick={onNew} style={{ height: '40px', padding: '0 14px' }}>
            <Icon name="plus" size={16} stroke={2.6} /> Нов продукт
          </button>
        </div>
      </header>
      {!alertsOn ? (
        <div class="banner">
          <Icon name="bell" />
          <span class="grow">Включи известията, за да разбираш за нови оферти, без да отваряш приложението.</span>
          <button class="textbtn" onClick={onEnableAlerts}>
            Включи
          </button>
        </div>
      ) : null}
      <main class="content stack">
        {watches.length === 0 ? (
          <div class="empty">
            <strong>Още не следиш нищо</strong>
            Добави продукт (напр. „Dolce Gusto“) или натисни сърцето на някоя оферта.
          </div>
        ) : null}
        {watches.map((w) => {
          const list = hits.get(w.id) ?? [];
          return (
            <article class="panel" key={w.id}>
              <div class="row" style={{ alignItems: 'flex-start' }}>
                <div class="grow stack" style={{ gap: '6px' }}>
                  <span class="wterm">„{w.term}“</span>
                  <div class="rules">
                    {rulesText(w).map((r) => (
                      <span class="rule-chip">{r}</span>
                    ))}
                  </div>
                </div>
                <button class="iconbtn" aria-label={`Промени „${w.term}“`} onClick={() => onEdit(w)}>
                  <Icon name="edit" size={16} />
                </button>
              </div>
              <div class="hits">
                {list.length === 0 ? <p class="hint" style={{ paddingTop: '10px' }}>Няма оферти в момента.</p> : null}
                {list.slice(0, SHOW).map((o) => {
                  const store = data?.stores.find((s) => s.id === o.store);
                  const when = whenLabel(o, today);
                  return (
                    <button class="hit" onClick={() => onOpen(o)}>
                      <span class="dot" style={{ background: storeColor(store) }} />
                      <span class="grow" style={{ display: 'flex', flexDirection: 'column' }}>
                        <span class="hname">
                          {o.brand ? `${o.brand} ` : ''}
                          {o.name}
                          {o.pack ? `, ${o.pack}` : ''}
                        </span>
                        <span class={`hsub tone-${when?.tone ?? 'muted'}`}>
                          {store?.name}
                          {when ? ` · ${when.text}` : ''}
                        </span>
                      </span>
                      <span class="hprice">
                        <b>{euro(o.price)}</b>
                        {o.pct ? <small>−{o.pct}%</small> : null}
                      </span>
                    </button>
                  );
                })}
                {list.length > SHOW ? <p class="hint" style={{ paddingTop: '10px' }}>и още {list.length - SHOW}</p> : null}
              </div>
            </article>
          );
        })}
      </main>
    </>
  );
}
