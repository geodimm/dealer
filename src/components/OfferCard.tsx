import { memo } from 'preact/compat';
import { useState } from 'preact/hooks';
import type { Offer, Store } from '../lib/types';
import { euro, unitLabel, whenLabel } from '../lib/offers';
import { Icon } from './Icon';

export function storeColor(store: Store | undefined) {
  if (!store) return '#888';
  return store.id === 'lidl' ? 'var(--lidl)' : store.color;
}

export function OfferImage({ offer, class: cls }: { offer: Offer; class: string }) {
  const [broken, setBroken] = useState(false);
  if (!offer.image || broken)
    return (
      <div class={`${cls} noimg`}>
        <Icon name="bag" size={36} stroke={1.5} />
      </div>
    );
  return (
    <div class={cls}>
      <img src={offer.image} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onError={() => setBroken(true)} />
    </div>
  );
}

interface Props {
  offer: Offer;
  store: Store | undefined;
  today: string;
  watched: boolean;
  onOpen: (o: Offer) => void;
  onWatch: (o: Offer) => void;
}

export const OfferCard = memo(function OfferCard({ offer: o, store, today, watched, onOpen, onWatch }: Props) {
  const when = whenLabel(o, today);
  const unit = unitLabel(o);
  return (
    <article class="card">
      <button class="open" aria-label={`${o.brand} ${o.name}, ${euro(o.price)}`} onClick={() => onOpen(o)} />
      <div style={{ position: 'relative' }}>
        <OfferImage offer={o} class="media" />
        {o.pct ? <span class="badge">−{o.pct}%</span> : null}
        <span class="storepill">
          <span class="dot" style={{ background: storeColor(store) }} />
          {store?.name ?? o.store}
        </span>
        <button
          class={`watchbtn${watched ? ' on' : ''}`}
          aria-label={watched ? 'Вече следите подобен продукт' : 'Следи този продукт'}
          onClick={() => onWatch(o)}
        >
          <Icon name="heart" size={17} />
        </button>
      </div>
      <div class="body">
        <div class="brand">{o.brand}</div>
        <div class="name">{o.name}</div>
        <div class="pack">{o.pack}</div>
        <div class="prices">
          <span class="price">{euro(o.price)}</span>
          {o.old ? <span class="old">{euro(o.old)}</span> : null}
        </div>
        <div class="meta">
          <span class="unit">{unit}</span>
          {when ? <span class={`when tone-${when.tone}`}>{when.text}</span> : null}
        </div>
      </div>
    </article>
  );
});
