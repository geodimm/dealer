import type { Category, DataFile } from '../lib/types';
import type { ThemePref } from '../lib/prefs';
import type { Background } from '../lib/alerts';
import { InstallCard } from './InstallCard';

const THEMES: [ThemePref, string, [string, string]][] = [
  ['system', 'Системна', ['#f5f6f2', '#0e1012']],
  ['light', 'Светла', ['#f5f6f2', '#ffffff']],
  ['dark', 'Тъмна', ['#0e1012', '#23282d']],
];

const fmt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('bg-BG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const BG_TEXT: Record<Background, string> = {
  on: 'включена',
  off: 'изключена',
  'not-installed': 'инсталирай приложението',
  unsupported: 'не се поддържа от браузъра',
};

export function SettingsScreen({
  data,
  theme,
  setTheme,
  alertsOn,
  perm,
  background,
  onToggleAlerts,
  checkedAt,
  refreshing,
  onRefresh,
  installed,
  canPrompt,
  onInstall,
  categories,
  onEditOrder,
}: {
  data: DataFile | undefined;
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  alertsOn: boolean;
  perm: string;
  background: Background;
  onToggleAlerts: (on: boolean) => void;
  checkedAt: number | null;
  refreshing: boolean;
  onRefresh: () => void;
  installed: boolean;
  canPrompt: boolean;
  onInstall: () => void;
  categories: Category[];
  onEditOrder: () => void;
}) {
  return (
    <>
      <header class="top">
        <div class="brandrow">
          <h1 class="title">Настройки</h1>
        </div>
      </header>
      <main class="content stack" style={{ gap: '22px' }}>
        {!installed ? <InstallCard canPrompt={canPrompt} onInstall={onInstall} /> : null}

        <section class="section">
          <h3>Тема</h3>
          <div class="themes" role="radiogroup" aria-label="Тема">
            {THEMES.map(([id, label, [a, b]]) => (
              <button class="theme" role="radio" aria-checked={theme === id} onClick={() => setTheme(id)}>
                <span class="pv">
                  <span style={{ background: a }} />
                  <span style={{ background: b }} />
                </span>
                {label}
              </button>
            ))}
          </div>
          <p class="hint">„Системна“ следва настройката на телефона.</p>
        </section>

        <section class="section">
          <h3>Ред на категориите</h3>
          <div class="panel row">
            <span class="grow hint" style={{ fontSize: '14px', color: 'var(--text)' }}>
              {categories
                .slice(0, 4)
                .map((c) => c.label)
                .join(' → ')}
              {categories.length > 4 ? ' → …' : ''}
            </span>
            <button class="secondary" style={{ height: '40px', padding: '0 14px' }} onClick={onEditOrder}>
              Подреди
            </button>
          </div>
          <p class="hint">Използва се при сортиране „Релевантност“ и при групиране по категория.</p>
        </section>

        <section class="section">
          <h3>Известия</h3>
          <div class="panel" style={{ gap: 0, padding: '4px 14px' }}>
            <div class="kv">
              <span>Известия за следени продукти</span>
              <label class="switch">
                <input
                  type="checkbox"
                  checked={alertsOn}
                  aria-label="Известия за следени продукти"
                  onChange={(e) => onToggleAlerts(e.currentTarget.checked)}
                />
                <span />
              </label>
            </div>
            <div class="kv">
              <span>Проверка във фонов режим</span>
              <span>{alertsOn ? BG_TEXT[background] : '—'}</span>
            </div>
            {perm === 'denied' ? (
              <p class="hint" style={{ padding: '10px 0' }}>
                Известията са блокирани за сайта. Разреши ги от настройките на браузъра.
              </p>
            ) : null}
          </div>
          <p class="hint">
            Приложението проверява при всяко отваряне. Инсталирано в Chrome на Android, проверява и във фонов режим – колко често решава
            браузърът (обикновено около веднъж дневно).
          </p>
        </section>

        <section class="section">
          <h3>Данни</h3>
          <div class="panel" style={{ gap: 0, padding: '4px 14px' }}>
            <div class="kv">
              <span>Оферти</span>
              <span>{data?.offers.length ?? 0}</span>
            </div>
            <div class="kv">
              <span>Събрани на</span>
              <span>{fmt(data?.generatedAt)}</span>
            </div>
            <div class="kv">
              <span>Последна проверка</span>
              <span>{checkedAt ? fmt(new Date(checkedAt).toISOString()) : '—'}</span>
            </div>
            {data?.stores.map((s) => (
              <div class="kv">
                <span>{s.name}</span>
                <span>
                  {s.count} · {s.ok ? fmt(s.updatedAt) : `стари данни (${fmt(s.updatedAt)})`}
                </span>
              </div>
            ))}
            <div class="kv">
              <button class="textbtn" onClick={onRefresh} disabled={refreshing}>
                {refreshing ? 'Обновяване…' : 'Обнови сега'}
              </button>
            </div>
          </div>
          <p class="hint">
            Офертите се пазят на устройството и работят офлайн. Източник:{' '}
            {data?.attribution.map((a, i) => (
              <>
                {i ? ', ' : ''}
                <a href={a.link} target="_blank" rel="noopener">
                  {a.name}
                </a>
              </>
            ))}
            . Цените са информативни – проверявай в магазина.
          </p>
        </section>
        <p class="hint" style={{ textAlign: 'center' }}>
          dealer v{__APP_VERSION__} ·{' '}
          <a href="https://github.com/livanov/dealer" target="_blank" rel="noopener">
            GitHub
          </a>
        </p>
      </main>
    </>
  );
}
