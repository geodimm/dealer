import type { DataFile, ListItem } from '../lib/types';
import { euro } from '../lib/offers';
import { storeColor } from './OfferCard';
import { Icon } from './Icon';

export function ListScreen({
  data,
  items,
  setItems,
}: {
  data: DataFile | undefined;
  items: ListItem[];
  setItems: (fn: (prev: ListItem[]) => ListItem[]) => void;
}) {
  const stores = data?.stores ?? [];
  const byStore = new Map<string, ListItem[]>();
  for (const it of items) byStore.set(it.store, [...(byStore.get(it.store) ?? []), it]);
  const total = items.filter((i) => !i.done).reduce((s, i) => s + i.price, 0);

  const share = async () => {
    const lines = [...byStore.entries()].flatMap(([store, list]) => [
      `${stores.find((s) => s.id === store)?.name ?? store}:`,
      ...list.map((i) => `${i.done ? '✓' : '•'} ${i.name}${i.pack ? ` (${i.pack})` : ''} – ${euro(i.price)}`),
    ]);
    const text = lines.join('\n');
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
    } catch {}
  };

  return (
    <>
      <header class="top">
        <div class="brandrow">
          <h1 class="title">Списък</h1>
          {items.length ? (
            <button class="iconbtn" aria-label="Сподели списъка" onClick={share}>
              <Icon name="share" size={18} />
            </button>
          ) : null}
        </div>
      </header>
      <main class="content stack">
        {items.length === 0 ? (
          <div class="empty">
            <strong>Списъкът е празен</strong>
            Отвори оферта и натисни „Към списъка“.
          </div>
        ) : (
          <>
            {[...byStore.entries()].map(([storeId, list]) => {
              const store = stores.find((s) => s.id === storeId);
              return (
                <section class="panel" key={storeId}>
                  <div class="row">
                    <span class="dot" style={{ background: storeColor(store) }} />
                    <strong class="grow">{store?.name ?? storeId}</strong>
                    <span class="muted small">{list.length}</span>
                  </div>
                  <div>
                    {list.map((it) => (
                      <label class={`listrow${it.done ? ' done' : ''}`} key={it.id}>
                        <input
                          type="checkbox"
                          checked={it.done}
                          onChange={() => setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)))}
                        />
                        <span class="grow">
                          <span class="lname">{it.name}</span>
                          {it.pack ? <span class="muted small"> · {it.pack}</span> : null}
                        </span>
                        <strong>{euro(it.price)}</strong>
                      </label>
                    ))}
                  </div>
                </section>
              );
            })}
            <div class="row" style={{ justifyContent: 'space-between' }}>
              <span class="muted">Остава: <strong style={{ color: 'var(--text)' }}>{euro(total)}</strong></span>
              <div class="row">
                <button class="secondary" onClick={() => setItems((prev) => prev.filter((i) => !i.done))}>
                  Махни отметнатите
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
