import { describe, expect, it } from 'vitest';
// @ts-expect-error – plain JS module used by the data build
import { dedupe, normalizeBgpromo, unitPrice } from '../scripts/normalize.mjs';
// @ts-expect-error – plain JS module used by the data build
import { categorize } from '../scripts/categories.mjs';

describe('unitPrice', () => {
  it.each([
    [1.59, '250 г', { value: 6.36, unit: 'kg' }],
    [1.99, '4 х 95 г', { value: 5.24, unit: 'kg' }],
    [4.99, '0,75 л', { value: 6.65, unit: 'l' }],
    [8.16, '12 x 0.5 l', { value: 1.36, unit: 'l' }],
    [0.38, 'за kg', { value: 0.38, unit: 'kg' }],
    [5.6, '1 кг', { value: 5.6, unit: 'kg' }],
    [2.15, 'кг', { value: 2.15, unit: 'kg' }],
  ])('%s for "%s"', (price, pack, expected) => {
    expect(unitPrice(price, pack)).toEqual(expected);
  });

  it.each(['88 - 256 г', '10 бр.', '', '125 или 250 g', 'комплект'])('gives up on "%s"', (pack) => {
    expect(unitPrice(1, pack)).toBeNull();
  });
});

const raw = (over: object) => ({
  vendor: { name: 'Kaufland' },
  promoid: 'K-1',
  oldprice: 3.79,
  newprice: 1.59,
  image: 'x.png',
  percent: 58,
  brand: 'DEUTSCHE MARKENBUTTER',
  product: 'Краве масло',
  valid_from: '2026-10-05',
  valid_to: '2026-10-11',
  package: '250 г',
  ...over,
});

describe('normalizeBgpromo', () => {
  it('computes discount and unit price, links Kaufland', () => {
    const o = normalizeBgpromo(raw({}));
    expect(o).toMatchObject({ store: 'kaufland', name: 'Краве масло', pct: 58, unit: 6.36, unitOf: 'kg', cat: 'dairy' });
    expect(o.url).toContain('so_id=1');
  });

  it('un-swaps Kaufland brand and product', () => {
    const o = normalizeBgpromo(raw({ brand: 'Краве масло', product: 'DEUTSCHE MARKENBUTTER' }));
    expect(o).toMatchObject({ brand: 'DEUTSCHE MARKENBUTTER', name: 'Краве масло' });
  });

  it('joins a Kaufland name that continues the brand field', () => {
    const o = normalizeBgpromo(raw({ brand: 'Кроасан', product: 'с крем брюле и масло' }));
    expect(o).toMatchObject({ brand: '', name: 'Кроасан с крем брюле и масло' });
  });

  it('uses Billa’s title field as the name', () => {
    const o = normalizeBgpromo(
      raw({ vendor: { name: 'Billa' }, brand: 'MONARCH Френско краве масло', product: 'Френско краве масло, мултипак' }),
    );
    expect(o).toMatchObject({ store: 'billa', brand: '', name: 'MONARCH Френско краве масло', desc: 'Френско краве масло, мултипак' });
  });

  it('drops a fake "old" price that is not higher', () => {
    const o = normalizeBgpromo(raw({ oldprice: 4.99, newprice: 5.89 }));
    expect(o).toMatchObject({ old: null, pct: null });
  });

  it('dedupes and drops expired offers', () => {
    const a = normalizeBgpromo(raw({}));
    const b = normalizeBgpromo(raw({ promoid: 'K-2' }));
    const c = normalizeBgpromo(raw({ promoid: 'K-3', valid_to: '2026-10-01' }));
    expect(dedupe([a, b, c], '2026-10-10')).toHaveLength(1);
  });
});

describe('categorize', () => {
  it.each([
    ['Моторно масло 15W40', 'nonfood'],
    ['Маслиново масло екстра върджин', 'sauces'],
    ['Слънчогледово масло', 'sauces'],
    ['Ирландско масло', 'dairy'],
    ['Бира', 'alcohol'],
    ['Капсули Dolce Gusto', 'coffee'],
    ['Кренвирши', 'deli'],
    ['Свинско месо', 'meat'],
    ['Риба тон в олио', 'canned'],
    ['Сьомга филе', 'fish'],
    ['Лютеница', 'canned'],
    ['Спагети', 'pantry'],
    ['Nutella крем за мазане', 'breakfast'],
    ['Паста за зъби', 'cosmetics'],
    ['Пресни яйца', 'dairy'],
  ])('%s → %s', (name, cat) => expect(categorize({ name })).toBe(cat));

  it('handles brands of Lidl non-food lines', () => {
    expect(categorize({ brand: 'LIVARNO', name: 'Кош за отпадъци' })).toBe('nonfood');
  });
});

describe('categorize: aisle collisions', () => {
  it.each([
    ['Саламурено сирене', 'dairy'],
    ['Аржентински рибай стек', 'meat'],
    ['Свинско месо в собствен сос', 'meat'],
    ['Сос Бешамел', 'sauces'],
    ['Морски дарове в сос', 'fish'],
    ['Капсули за пране 4 в 1', 'household'],
    ['Таблетки за съдомиялна All in One лимон', 'household'],
    ['Мицеларна вода', 'cosmetics'],
    ['Вода за уста Coolmint', 'cosmetics'],
    ['Чиния за основно, маслинено зелен цвят', 'nonfood'],
    ['BILLA ГРАДИНИ Пиперки зелени', 'produce'],
    ['Хумус различни видове', 'breakfast'],
    ['Хляб със семена', 'bakery'],
    ['Джинджифил', 'produce'],
    ['Джин', 'alcohol'],
    ['Бира Столично', 'alcohol'],
    ['Лютеница в буркан', 'canned'],
  ])('%s → %s', (name, cat) => expect(categorize({ name })).toBe(cat));
});

describe('pieceCount', () => {
  // @ts-expect-error – plain JS module
  const load = () => import('../scripts/normalize.mjs');
  it.each([
    [{ pack: '30 бр.', name: 'Кафе капсули' }, { n: 30, est: false }],
    [{ pack: '16 бр.', name: 'Кафе капсули 16 бр.' }, { n: 16, est: false }],
    [{ pack: '36 x 21 g', name: 'Капсули за пране 5 в 1' }, { n: 36, est: false }],
    [{ pack: '', name: 'Тоалетна хартия 20+4 ролки' }, { n: 24, est: false }],
    [{ pack: '60 пранета', name: 'Гел за пране' }, { n: 60, est: false }],
    [{ pack: '56 г', name: 'Кафе капсули различни видове', brand: 'Dallmayr' }, { n: 10, est: true }],
    [{ pack: '112 г', name: 'Кафе капсули Dolce Gusto', brand: 'Nescafe' }, { n: 16, est: true }],
  ])('%o → %o', async (input, expected) => {
    const { pieceCount } = await load();
    expect(pieceCount(input)).toEqual(expected);
  });
  it.each([
    { pack: '168 - 210 г', name: 'Кафе капсули Dolce Gusto', brand: 'NESCAFE' },
    { pack: '1 бр.', name: 'Тиган' },
    { pack: '250 г', name: 'Краве масло' },
    { pack: '10-12 бр.', name: 'Яйца' },
  ])('no count for %o', async (input) => {
    const { pieceCount } = await load();
    expect(pieceCount(input)).toBeNull();
  });
});
