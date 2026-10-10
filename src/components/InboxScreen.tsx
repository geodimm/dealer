import type { InboxItem } from '../lib/types';
import { isoDay, addDays } from '../lib/offers';
import { Icon } from './Icon';

const dayLabel = (at: number) => {
  const day = isoDay(new Date(at));
  const today = isoDay();
  if (day === today) return 'Днес';
  if (day === addDays(today, -1)) return 'Вчера';
  return new Date(at).toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long' });
};
const time = (at: number) => new Date(at).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });

export function InboxScreen({
  items,
  onOpen,
  onMarkAllRead,
}: {
  items: InboxItem[];
  onOpen: (it: InboxItem) => void;
  onMarkAllRead: () => void;
}) {
  const days: { label: string; items: InboxItem[] }[] = [];
  for (const it of items) {
    const label = dayLabel(it.at);
    const last = days[days.length - 1];
    if (last?.label === label) last.items.push(it);
    else days.push({ label, items: [it] });
  }
  const unread = items.some((i) => !i.read);

  return (
    <>
      <main class="content stack">
        {unread ? (
          <div class="row" style={{ justifyContent: 'flex-end', marginTop: '-6px' }}>
            <button class="textbtn" onClick={onMarkAllRead}>
              Маркирай прочетени
            </button>
          </div>
        ) : null}
        {items.length === 0 ? (
          <div class="empty">
            <strong>Още няма известия</strong>
            Следи продукт и тук ще виждаш всяка нова оферта, която съвпада.
          </div>
        ) : (
          days.map((d) => (
            <section class="stack" style={{ gap: '8px' }} key={d.label}>
              <h2 class="label" style={{ margin: '6px 0 2px' }}>
                {d.label}
              </h2>
              {d.items.map((it) => (
                <button class={`notice${it.read ? '' : ' unread'}`} key={it.id} onClick={() => onOpen(it)}>
                  <span class="nicon">
                    <Icon name="bell" size={20} />
                  </span>
                  <span class="grow">
                    <span class="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <strong>„{it.term}“ е в промоция</strong>
                      <span class="muted small">{time(it.at)}</span>
                    </span>
                    <span class="nbody">{it.body}</span>
                  </span>
                  {it.read ? null : <span class="ndot" aria-label="непрочетено" />}
                </button>
              ))}
            </section>
          ))
        )}
        <p class="hint">Известията идват при отваряне на приложението и при проверка във фонов режим.</p>
      </main>
    </>
  );
}
