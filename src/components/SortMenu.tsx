import { useEffect } from 'preact/hooks';
import type { GroupKey, SortKey } from '../lib/types';
import { Icon } from './Icon';

export const SORTS: [SortKey, string][] = [
  ['relevance', 'Релевантност'],
  ['pct', 'Най-голяма отстъпка'],
  ['price', 'Най-ниска цена'],
  ['unit', 'Цена за единица'],
  ['ending', 'Изтичат скоро'],
  ['newest', 'Най-нови'],
];

export const GROUPS: [GroupKey, string][] = [
  ['none', 'Без'],
  ['store', 'Магазин'],
  ['cat', 'Категория'],
  ['validity', 'Валидност'],
];

export function SortMenu({
  sort,
  group,
  onSort,
  onGroup,
  onEditOrder,
  onClose,
}: {
  sort: SortKey;
  group: GroupKey;
  onSort: (s: SortKey) => void;
  onGroup: (g: GroupKey) => void;
  onEditOrder: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <>
      <div class="menu-scrim" onClick={onClose} />
      <div class="menu" role="menu" aria-label="Подреди и групирай">
        <div class="label">Подреди по</div>
        {SORTS.map(([k, label]) => (
          <div class="optrow" key={k}>
            <button
              class="opt"
              role="menuitemradio"
              aria-checked={sort === k}
              onClick={() => {
                onSort(k);
                onClose();
              }}
            >
              {label}
              {sort === k ? <Icon name="check" size={18} stroke={2.6} /> : null}
            </button>
            {k === 'relevance' ? (
              <button
                class="iconbtn ghost optcog"
                aria-label="Подреди категориите за „Релевантност“"
                onClick={() => {
                  onClose();
                  onEditOrder();
                }}
              >
                <Icon name="gear" size={18} />
              </button>
            ) : null}
          </div>
        ))}
        <hr />
        <div class="label">Групирай по</div>
        <div class="groups">
          {GROUPS.map(([k, label]) => (
            <button
              class="chip"
              role="menuitemradio"
              aria-checked={group === k}
              aria-pressed={group === k}
              onClick={() => {
                onGroup(k);
                onClose();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
