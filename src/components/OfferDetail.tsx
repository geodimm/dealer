import type { Category, Offer, Store } from '../lib/types';
import { euro, unitLabel, whenLabel } from '../lib/offers';
import { Sheet } from './Sheet';
import { OfferImage, storeColor } from './OfferCard';
import { Icon } from './Icon';

const dmy = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;

export function OfferDetail({
  offer: o,
  store,
  category,
  today,
  inList,
  onWatch,
  onToggleList,
  onShare,
  onClose,
}: {
  offer: Offer;
  store: Store | undefined;
  category: Category | undefined;
  today: string;
  inList: boolean;
  onWatch: () => void;
  onToggleList: () => void;
  onShare: () => void;
  onClose: () => void;
}) {
  const when = whenLabel(o, today);
  const validity =
    o.from && o.to ? `${dmy(o.from)} – ${dmy(o.to)}` : o.from ? `от ${dmy(o.from)}` : o.to ? `до ${dmy(o.to)}` : 'не е посочена';
  return (
    <Sheet title={store?.name ?? o.store} onClose={onClose} action={
      <button class="iconbtn ghost" aria-label="Затвори" onClick={onClose}>
        <Icon name="close" />
      </button>
    }>
      <div class="detail stack">
        <div style={{ position: 'relative' }}>
          <OfferImage offer={o} class="detail-media" />
          {o.pct ? <span class="badge" style={{ fontSize: '18px' }}>−{o.pct}%</span> : null}
        </div>
        <div class="stack" style={{ gap: '4px' }}>
          {o.brand ? <div class="brand">{o.brand}</div> : null}
          <h2>{o.name}</h2>
          {o.desc ? <p class="desc">{o.desc}</p> : null}
        </div>
        <div class="bigprice">
          <span class="price">{euro(o.price)}</span>
          {o.old ? <span class="old" style={{ fontSize: '16px' }}>{euro(o.old)}</span> : null}
          {when ? <span class={`tone-${when.tone}`} style={{ fontSize: '14px' }}>{when.text}</span> : null}
        </div>
        <dl class="facts">
          <dt>Магазин</dt>
          <dd class="row" style={{ gap: '6px' }}>
            <span class="dot" style={{ background: storeColor(store) }} />
            {store?.name ?? o.store}
          </dd>
          {o.pack ? (
            <>
              <dt>Разфасовка</dt>
              <dd>{o.pack}</dd>
            </>
          ) : null}
          {unitLabel(o) ? (
            <>
              <dt>Цена за {o.unitOf === 'kg' ? 'кг' : 'л'}</dt>
              <dd>{unitLabel(o)}</dd>
            </>
          ) : null}
          <dt>Валидност</dt>
          <dd>{validity}</dd>
          {category ? (
            <>
              <dt>Категория</dt>
              <dd>{category.label}</dd>
            </>
          ) : null}
        </dl>
        <div class="actions">
          <button class="action full" onClick={onWatch}>
            <Icon name="bell" size={18} /> Следи подобни оферти
          </button>
          <button class="action" onClick={onToggleList}>
            <Icon name={inList ? 'check' : 'list'} size={18} /> {inList ? 'В списъка' : 'Към списъка'}
          </button>
          <button class="action" onClick={onShare}>
            <Icon name="share" size={18} /> Сподели
          </button>
          {o.url ? (
            <a class="action wide" href={o.url} target="_blank" rel="noopener">
              <Icon name="external" size={18} /> Виж в сайта на {store?.name ?? 'магазина'}
            </a>
          ) : null}
        </div>
      </div>
    </Sheet>
  );
}
