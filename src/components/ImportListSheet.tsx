import { useState } from 'preact/hooks';
import { StoreBadge } from './StoreBadge';
import type { ListItem, Store } from '../lib/types';
import { euro } from '../lib/offers';
import { Sheet } from './Sheet';

/** A shopping list someone shared: pick which items to add to your own list. */
export function ImportListSheet({
  items,
  mine,
  stores,
  onAdd,
  onClose,
}: {
  items: ListItem[];
  mine: ListItem[];
  stores: Store[];
  onAdd: (items: ListItem[]) => void;
  onClose: () => void;
}) {
  const have = new Set(mine.map((i) => i.id));
  const [picked, setPicked] = useState(() => new Set(items.filter((i) => !have.has(i.id)).map((i) => i.id)));
  const byStore = new Map<string, ListItem[]>();
  for (const it of items) byStore.set(it.store, [...(byStore.get(it.store) ?? []), it]);
  const n = picked.size;

  return (
    <Sheet
      title="Споделен списък"
      onClose={onClose}
      footer={
        <button class="primary" disabled={!n} onClick={() => onAdd(items.filter((i) => picked.has(i.id)))}>
          {n ? `Добави ${n} в моя списък` : 'Нищо не е избрано'}
        </button>
      }
    >
      <p class="hint" style={{ marginTop: '-8px' }}>
        Някой сподели с теб {items.length} {items.length === 1 ? 'продукт' : 'продукта'}. Избери кои да добавиш към твоя списък.
      </p>
      {[...byStore.entries()].map(([storeId, list]) => {
        const store = stores.find((s) => s.id === storeId);
        return (
          <section key={storeId}>
            <div class="row" style={{ marginBottom: '4px' }}>
              <StoreBadge store={store} id={storeId} />
              <strong>{store?.name ?? storeId}</strong>
            </div>
            {list.map((it) => {
              const already = have.has(it.id);
              return (
                <label class="listrow" key={it.id}>
                  <input
                    type="checkbox"
                    checked={picked.has(it.id)}
                    disabled={already}
                    onChange={() =>
                      setPicked((prev) => {
                        const next = new Set(prev);
                        next.has(it.id) ? next.delete(it.id) : next.add(it.id);
                        return next;
                      })
                    }
                  />
                  <span class="grow">
                    <span class="lname">{it.name}</span>
                    {it.pack ? <span class="muted small"> · {it.pack}</span> : null}
                    {already ? <span class="muted small"> · вече е в списъка</span> : null}
                  </span>
                  <strong>{euro(it.price)}</strong>
                </label>
              );
            })}
          </section>
        );
      })}
    </Sheet>
  );
}
