import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { DataFile, InboxItem, Offer, Watch } from './lib/types';
import { isoDay, orderCategories } from './lib/offers';
import { idbGet } from './lib/idb';
import { getCachedData, getInbox, getWatches, refresh, saveInbox, saveWatches, watchMatches } from './lib/watch';
import { useApplyTheme, useCatOrder, useFilters, useGroup, useList, useSort, useStored, useTheme } from './lib/prefs';
import { backgroundStatus, disableBackground, enableAlerts, permission, showNotification, type Background } from './lib/alerts';
import { OffersScreen } from './components/OffersScreen';
import { OfferDetail } from './components/OfferDetail';
import { CardMenu, HideSheet } from './components/CardMenu';
import { CategoryOrderSheet } from './components/CategoryOrderSheet';
import { WatchEditor } from './components/WatchEditor';
import { WatchScreen } from './components/WatchScreen';
import { ListScreen } from './components/ListScreen';
import { InboxScreen } from './components/InboxScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { Icon, type IconName } from './components/Icon';
import { useInstall } from './lib/install';

type Route = 'offers' | 'watch' | 'inbox' | 'list' | 'settings';
const ROUTES: [Route, string, IconName][] = [
  ['offers', 'Оферти', 'tag'],
  ['watch', 'Следя', 'heart'],
  ['inbox', 'Известия', 'bell'],
  ['list', 'Списък', 'list'],
  ['settings', 'Настройки', 'gear'],
];
const routeFromHash = (): Route => {
  const r = location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.some(([k]) => k === r) ? r : 'offers';
};

const DATA_URL = new URL('data/offers.json', document.baseURI).href;

const newWatch = (term = ''): Watch => ({
  id: Math.random().toString(36).slice(2, 10),
  term,
  maxPrice: null,
  minPct: null,
  maxUnit: null,
  exclude: [],
  createdAt: Date.now(),
});

/** A sensible starting search term from an offer's name. */
const termFrom = (o: Offer) =>
  o.name
    .replace(/\s*(различни|избрани)\s+(видове|вкусове|цветове|модели)\.?$/i, '')
    .replace(/\s*\d+([.,]\d+)?\s*(г|кг|мл|л|g|kg|ml|l)\b.*$/i, '')
    .trim();

export function App() {
  const [route, setRoute] = useState<Route>(routeFromHash);
  const [data, setData] = useState<DataFile | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [detail, setDetail] = useState<Offer | null>(null);
  const [editing, setEditing] = useState<{ watch: Watch; isNew: boolean } | null>(null);
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const [menuFor, setMenuFor] = useState<Offer | null>(null);
  const [hideFor, setHideFor] = useState<Offer | null>(null);
  const [perm, setPerm] = useState(permission());
  const [background, setBackground] = useState<Background>('unsupported');

  const [theme, setTheme] = useTheme();
  const [filters, setFilters] = useFilters();
  const [sort, setSort] = useSort();
  const [group, setGroup] = useGroup();
  const [list, setList] = useList();
  const [catOrder, setCatOrder] = useCatOrder();
  const [orderOpen, setOrderOpen] = useState<null | 'sort' | 'settings'>(null);
  const [alertsWanted, setAlertsWanted] = useStored('alerts', false);
  const alertsOn = alertsWanted && perm === 'granted';
  useApplyTheme(theme);
  const app = useInstall();

  const today = isoDay();
  const categories = useMemo(() => (data ? orderCategories(data.categories, catOrder) : []), [data, catOrder]);
  const catCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of data?.offers ?? []) c[o.cat] = (c[o.cat] ?? 0) + 1;
    return c;
  }, [data]);

  const toastTimer = useRef<number>();
  const say = useCallback((msg: string, undo?: () => void) => {
    setToast({ msg, undo });
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), undo ? 5000 : 2600);
  }, []);

  const doRefresh = useCallback(
    async (manual = false) => {
      setRefreshing(true);
      const before = (await getCachedData())?.generatedAt;
      const fresh = await refresh(DATA_URL, alertsOn ? showNotification : null);
      if (fresh) setData(fresh);
      setInbox(await getInbox());
      setCheckedAt((await idbGet<number>('checkedAt')) ?? null);
      setRefreshing(false);
      setLoading(false);
      if (manual) say(!fresh ? 'Няма връзка – показвам запазените оферти' : fresh.generatedAt !== before ? 'Офертите са обновени' : 'Няма нови оферти');
    },
    [alertsOn, say],
  );

  // Show what's stored on the device straight away, then fetch fresh data.
  useEffect(() => {
    (async () => {
      const cached = await getCachedData();
      if (cached) {
        setData(cached);
        setLoading(false);
      }
      setWatches(await getWatches());
      setInbox(await getInbox());
      setCheckedAt((await idbGet<number>('checkedAt')) ?? null);
      setBackground(await backgroundStatus());
    })();
  }, []);
  const lastCheck = useRef(0);
  const refreshRef = useRef(doRefresh);
  refreshRef.current = doRefresh;
  useEffect(() => {
    lastCheck.current = Date.now();
    refreshRef.current();
    // Re-check when the app comes back to the foreground after a while.
    const onVis = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck.current > 30 * 60 * 1000) {
        lastCheck.current = Date.now();
        refreshRef.current();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => window.scrollTo({ top: 0 }), [route]);

  const updateWatches = async (next: Watch[]) => {
    setWatches(next);
    await saveWatches(next);
  };

  const turnOnAlerts = async () => {
    const res = await enableAlerts();
    setPerm(res.permission);
    setBackground(res.background);
    if (res.permission === 'granted') {
      setAlertsWanted(true);
      say(res.background === 'on' ? 'Известията са включени, вкл. във фонов режим' : 'Известията са включени');
    } else if (res.permission === 'denied') say('Известията са блокирани от браузъра');
    else if (res.permission === 'unsupported') say('Браузърът не поддържа известия');
  };
  const installApp = async () => {
    if (await app.install()) say('Готово – отвори dealer от началния екран');
  };
  const toggleAlerts = async (on: boolean) => {
    if (on) return turnOnAlerts();
    setAlertsWanted(false);
    await disableBackground();
    setBackground(await backgroundStatus());
  };

  const isWatched = useCallback((o: Offer) => watches.some((w) => watchMatches(w, o, today)), [watches, today]);

  const storeOf = (o: Offer) => data?.stores.find((s) => s.id === o.store);
  const inList = (o: Offer) => list.some((i) => i.id === o.id);
  const toggleList = (o: Offer) => {
    if (inList(o)) setList((prev) => prev.filter((i) => i.id !== o.id));
    else {
      setList((prev) => [...prev, { id: o.id, store: o.store, name: o.brand ? `${o.brand} ${o.name}` : o.name, pack: o.pack, price: o.price, to: o.to, done: false }]);
      say('Добавено в списъка');
    }
  };

  const badge = (key: Route) =>
    key === 'inbox' ? inbox.filter((i) => !i.read).length : key === 'list' ? list.filter((i) => !i.done).length : 0;

  const openWatchFor = (o: Offer) => {
    setDetail(null);
    setEditing({ watch: newWatch(termFrom(o)), isNew: true });
  };

  return (
    <div class="app">
      {route === 'offers' ? (
        data ? (
          <OffersScreen
            data={data}
            today={today}
            filters={filters}
            setFilters={setFilters}
            sort={sort}
            setSort={setSort}
            group={group}
            setGroup={setGroup}
            isWatched={isWatched}
            onOpen={setDetail}
            onWatch={openWatchFor}
            onMenu={setMenuFor}
            categories={categories}
            onEditOrder={() => setOrderOpen('sort')}
          />
        ) : (
          <div class="loading" style={{ paddingTop: '30vh' }}>
            {loading ? 'Зареждам офертите…' : 'Не успях да заредя офертите. Провери връзката и опитай пак.'}
            {!loading ? (
              <p>
                <button class="secondary" onClick={() => doRefresh(true)}>
                  Опитай пак
                </button>
              </p>
            ) : null}
          </div>
        )
      ) : null}
      {route === 'watch' ? (
        <WatchScreen
          data={data}
          watches={watches}
          today={today}
          alertsOn={alertsOn}
          onEnableAlerts={turnOnAlerts}
          installed={app.installed}
          canPrompt={app.canPrompt}
          onInstall={installApp}
          onNew={() => setEditing({ watch: newWatch(), isNew: true })}
          onEdit={(w) => setEditing({ watch: w, isNew: false })}
          onOpen={setDetail}
        />
      ) : null}
      {route === 'inbox' ? (
        <InboxScreen
          items={inbox}
          onOpen={async (it) => {
            const next = inbox.map((x) => (x.id === it.id ? { ...x, read: true } : x));
            setInbox(next);
            await saveInbox(next);
            location.hash = '#/watch';
          }}
          onMarkAllRead={async () => {
            const next = inbox.map((x) => ({ ...x, read: true }));
            setInbox(next);
            await saveInbox(next);
          }}
        />
      ) : null}
      {route === 'list' ? <ListScreen data={data} items={list} setItems={setList} /> : null}
      {route === 'settings' ? (
        <SettingsScreen
          data={data}
          theme={theme}
          setTheme={setTheme}
          alertsOn={alertsOn}
          perm={perm}
          background={background}
          onToggleAlerts={toggleAlerts}
          checkedAt={checkedAt}
          refreshing={refreshing}
          onRefresh={() => doRefresh(true)}
          installed={app.installed}
          canPrompt={app.canPrompt}
          onInstall={installApp}
          categories={categories}
          onEditOrder={() => setOrderOpen('settings')}
        />
      ) : null}

      <nav class="nav" aria-label="Основна навигация">
        {ROUTES.map(([key, label, icon]) => (
          <a href={`#/${key}`} aria-current={route === key ? 'page' : undefined}>
            <Icon name={icon} size={22} />
            {label}
            {badge(key) ? <span class="pip">{badge(key)}</span> : null}
          </a>
        ))}
      </nav>

      {detail && data ? (
        <OfferDetail
          offer={detail}
          store={storeOf(detail)}
          category={data.categories.find((c) => c.id === detail.cat)}
          today={today}
          inList={inList(detail)}
          onWatch={() => openWatchFor(detail)}
          onToggleList={() => toggleList(detail)}
          onClose={() => setDetail(null)}
        />
      ) : null}
      {orderOpen && data ? (
        <CategoryOrderSheet
          categories={categories}
          defaults={data.categories}
          counts={catCounts}
          onClose={() => setOrderOpen(null)}
          onSave={(ids) => {
            setCatOrder(ids);
            // Opened from the sort menu: the user wants to sort this way.
            if (orderOpen === 'sort') setSort('relevance');
            setOrderOpen(null);
            say('Редът на категориите е запазен');
          }}
        />
      ) : null}
      {menuFor ? (
        <CardMenu
          offer={menuFor}
          store={storeOf(menuFor)}
          inList={inList(menuFor)}
          onHide={() => {
            setMenuFor(null);
            setHideFor(menuFor);
          }}
          onWatch={() => {
            setMenuFor(null);
            openWatchFor(menuFor);
          }}
          onToggleList={() => {
            toggleList(menuFor);
            setMenuFor(null);
          }}
          onOpen={() => {
            setMenuFor(null);
            setDetail(menuFor);
          }}
          onClose={() => setMenuFor(null)}
        />
      ) : null}
      {hideFor && data ? (
        <HideSheet
          offer={hideFor}
          offers={data.offers}
          onClose={() => setHideFor(null)}
          onHide={(term) => {
            const before = filters;
            if (!filters.hide.some((h) => h.toLowerCase() === term.toLowerCase())) setFilters({ ...filters, hide: [...filters.hide, term] });
            setHideFor(null);
            say(`Скрито: „${term}“`, () => setFilters(before));
          }}
        />
      ) : null}
      {editing ? (
        <WatchEditor
          initial={editing.watch}
          offers={data?.offers ?? []}
          today={today}
          onClose={() => setEditing(null)}
          onDelete={
            editing.isNew
              ? undefined
              : async () => {
                  await updateWatches(watches.filter((w) => w.id !== editing.watch.id));
                  setEditing(null);
                }
          }
          onSave={async (w) => {
            const next = editing.isNew ? [w, ...watches] : watches.map((x) => (x.id === w.id ? w : x));
            await updateWatches(next);
            setEditing(null);
            if (editing.isNew) {
              say(`Следиш „${w.term}“`);
              if (!alertsOn && perm !== 'denied') location.hash = '#/watch';
            }
          }}
        />
      ) : null}
      {toast ? (
        <div class="toast" role="status">
          <span>{toast.msg}</span>
          {toast.undo ? (
            <button
              onClick={() => {
                toast.undo!();
                setToast(null);
              }}
            >
              Отмени
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
