import { useRef, useState } from 'preact/hooks';
import type { Category } from '../lib/types';
import { Sheet } from './Sheet';
import { Icon } from './Icon';

/**
 * Reorder categories like the aisles of your usual supermarket. Drag a row by
 * its handle, or use the arrow buttons (also the keyboard/screen-reader path).
 */
export function CategoryOrderSheet({
  categories,
  defaults,
  counts,
  onSave,
  onClose,
}: {
  categories: Category[];
  defaults: Category[];
  counts: Record<string, number>;
  onSave: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [list, setList] = useState(categories);
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null);
  const dragState = useRef<{ id: string; lastY: number; rowH: number } | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const move = (from: number, to: number) =>
    setList((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = prev.slice();
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });

  const onDown = (e: PointerEvent, id: string) => {
    const row = (e.currentTarget as HTMLElement).closest('li');
    if (!row) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { id, lastY: e.clientY, rowH: row.getBoundingClientRect().height };
    setDrag({ id, offset: 0 });
  };
  const onMove = (e: PointerEvent) => {
    const st = dragState.current;
    if (!st) return;
    let offset = e.clientY - st.lastY;
    // Each time the row travels a full row height, swap it with its neighbour.
    setList((prev) => {
      let i = prev.findIndex((c) => c.id === st.id);
      const next = prev.slice();
      while (offset > st.rowH / 2 && i < next.length - 1) {
        [next[i], next[i + 1]] = [next[i + 1], next[i]];
        i++;
        offset -= st.rowH;
        st.lastY += st.rowH;
      }
      while (offset < -st.rowH / 2 && i > 0) {
        [next[i], next[i - 1]] = [next[i - 1], next[i]];
        i--;
        offset += st.rowH;
        st.lastY -= st.rowH;
      }
      return next;
    });
    setDrag({ id: st.id, offset });
  };
  const onUp = () => {
    dragState.current = null;
    setDrag(null);
  };

  return (
    <Sheet
      title="Ред на категориите"
      onClose={onClose}
      action={
        <button class="textbtn" onClick={() => setList(defaults)}>
          Нулирай
        </button>
      }
      footer={
        <button class="primary" onClick={() => onSave(list.map((c) => c.id))}>
          Запази реда
        </button>
      }
    >
      <p class="hint" style={{ marginTop: '-8px' }}>
        Подреди ги като щандовете в магазина, в който пазаруваш. При „Релевантност“ офертите се показват в този ред, а във всяка
        категория – първо най-голямата отстъпка.
      </p>
      <ol class="reorder" ref={listRef}>
        {list.map((c, i) => (
          <li
            key={c.id}
            class={drag?.id === c.id ? 'dragging' : ''}
            style={drag?.id === c.id ? { transform: `translateY(${drag.offset}px)` } : undefined}
          >
            <span
              class="handle-grip"
              aria-hidden="true"
              onPointerDown={(e) => onDown(e, c.id)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.6" />
                <circle cx="15" cy="6" r="1.6" />
                <circle cx="9" cy="12" r="1.6" />
                <circle cx="15" cy="12" r="1.6" />
                <circle cx="9" cy="18" r="1.6" />
                <circle cx="15" cy="18" r="1.6" />
              </svg>
            </span>
            <span class="pos">{i + 1}</span>
            <span class="grow cname">
              {c.label}
              <span class="muted small"> · {counts[c.id] ?? 0}</span>
            </span>
            <button class="iconbtn ghost" aria-label={`${c.label}: нагоре`} disabled={i === 0} onClick={() => move(i, i - 1)}>
              <span style={{ display: 'flex', transform: 'rotate(180deg)' }}>
                <Icon name="chevron" size={18} />
              </span>
            </button>
            <button
              class="iconbtn ghost"
              aria-label={`${c.label}: надолу`}
              disabled={i === list.length - 1}
              onClick={() => move(i, i + 1)}
            >
              <Icon name="chevron" size={18} />
            </button>
          </li>
        ))}
      </ol>
    </Sheet>
  );
}
