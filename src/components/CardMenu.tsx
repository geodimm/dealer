import { useMemo, useState } from 'preact/hooks';
import type { Offer, Store } from '../lib/types';
import { euro, searchKey } from '../lib/offers';
import { fold } from '../lib/text';
import { Sheet } from './Sheet';
import { Icon, type IconName } from './Icon';

/** Quick actions for a long-pressed card. */
export function CardMenu({
  offer: o,
  store,
  inList,
  onHide,
  onWatch,
  onToggleList,
  onOpen,
  onShare,
  onClose,
}: {
  offer: Offer;
  store: Store | undefined;
  inList: boolean;
  onHide: () => void;
  onWatch: () => void;
  onToggleList: () => void;
  onOpen: () => void;
  onShare: () => void;
  onClose: () => void;
}) {
  const items: [IconName, string, () => void][] = [
    ['eyeoff', 'Скрий подобни оферти', onHide],
    ['bell', 'Следи подобни оферти', onWatch],
    [inList ? 'check' : 'list', inList ? 'Махни от списъка' : 'Добави в списъка', onToggleList],
    ['share', 'Сподели офертата', onShare],
    ['tag', 'Виж офертата', onOpen],
  ];
  return (
    <Sheet title={o.brand ? `${o.brand} ${o.name}` : o.name} onClose={onClose}>
      <p class="hint" style={{ marginTop: '-8px' }}>
        {store?.name ?? o.store} · {euro(o.price)}
        {o.pack ? ` · ${o.pack}` : ''}
      </p>
      <div class="menulist">
        {items.map(([icon, label, act]) => (
          <button class="menuitem" onClick={act}>
            <Icon name={icon} size={20} />
            {label}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/** Words worth offering as one-tap exclusions ("моторно", "Ziaja"…). */
function wordsOf(o: Offer): string[] {
  const words = `${o.name} ${o.brand}`
    .split(/[\s,.;:()/“”„"'+]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !/^\d/.test(w) && !/^(различни|избрани|видове|вкусове|или|със|без|от|за|на)$/i.test(w));
  return [...new Set(words.map((w) => w.toLowerCase()))].slice(0, 8);
}

/** Pick the text to hide; prefilled with the product name and editable. */
export function HideSheet({
  offer: o,
  offers,
  onHide,
  onClose,
}: {
  offer: Offer;
  offers: Offer[];
  onHide: (term: string) => void;
  onClose: () => void;
}) {
  const [term, setTerm] = useState(o.name.toLowerCase());
  const words = wordsOf(o);
  const f = fold(term);
  const count = useMemo(() => (f ? offers.filter((x) => searchKey(x).includes(f)).length : 0), [offers, f]);

  return (
    <Sheet
      title="Скрий подобни оферти"
      onClose={onClose}
      footer={
        <button class="primary" disabled={!term.trim()} onClick={() => onHide(term.trim())}>
          {term.trim() ? `Скрий ${count} ${count === 1 ? 'оферта' : 'оферти'}` : 'Въведи дума'}
        </button>
      }
    >
      <label class="field">
        <span class="label">Скрий оферти, които съдържат</span>
        <input value={term} onInput={(e) => setTerm(e.currentTarget.value)} enterKeyHint="done" autoFocus />
      </label>
      {words.length > 1 ? (
        <div class="section">
          <span class="label">Или само една дума</span>
          <div class="chips">
            {words.map((w) => (
              <button class="chip" aria-pressed={fold(w) === f} onClick={() => setTerm(w)}>
                {w}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <p class="hint">Добавя се към „Скрий думи“ във Филтри – оттам можеш да го махнеш по всяко време.</p>
    </Sheet>
  );
}
