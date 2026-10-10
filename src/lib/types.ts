export interface Offer {
  id: string;
  store: string;
  brand: string;
  name: string;
  desc: string;
  pack: string;
  price: number;
  old: number | null;
  pct: number | null;
  unit: number | null;
  unitOf: 'kg' | 'l' | null;
  from: string | null;
  to: string | null;
  image: string | null;
  url: string | null;
  cat: string;
}

export interface Store {
  id: string;
  name: string;
  color: string;
  count: number;
  ok: boolean;
  source: string;
  updatedAt: string | null;
}

export interface Category {
  id: string;
  label: string;
}

export interface DataFile {
  version: number;
  generatedAt: string;
  stores: Store[];
  categories: Category[];
  attribution: { name: string; link: string }[];
  offers: Offer[];
}

export type Validity = 'now' | 'upcoming' | 'all';
export type SortKey = 'relevance' | 'pct' | 'price' | 'unit' | 'ending' | 'newest';
export type GroupKey = 'none' | 'store' | 'cat' | 'validity';

export interface Filters {
  stores: string[]; // empty = all
  cats: string[]; // empty = all
  validity: Validity;
  minPct: number;
  hide: string[];
}

export interface Watch {
  id: string;
  term: string;
  maxPrice: number | null;
  minPct: number | null;
  maxUnit: number | null;
  exclude: string[];
  createdAt: number;
}

export interface ListItem {
  id: string;
  store: string;
  name: string;
  pack: string;
  price: number;
  to: string | null;
  done: boolean;
}

export interface InboxItem {
  id: string;
  watchId: string;
  term: string;
  body: string;
  at: number;
  read: boolean;
}
