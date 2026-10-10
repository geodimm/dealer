# dealer

Промоциите от Kaufland, Lidl и Billa на едно място: статично PWA за телефона, без бекенд, хоствано в GitHub Pages.

**Live:** https://livanov.github.io/dealer/

## Какво може (v0.1)

- Безкраен списък с оферти, търсене (работи и на латиница: `sirene` → „сирене“).
- Филтри: магазин, категория, валидност (сега / предстоящи), минимална отстъпка, скрити думи.
- Подреждане (отстъпка, цена, цена за кг/л, изтичат скоро, най-нови) и групиране (магазин, категория, валидност).
- **Следя:** следи продукт с граници (цена ≤, отстъпка ≥, €/кг ≤, без думи) и получавай известие при нова оферта.
- Списък за пазаруване по магазини, споделяне.
- Светла, тъмна и системна тема. Инсталира се от Chrome („Добави към началния екран“) и работи офлайн.

## Как работи

```
GitHub Actions (3× дневно)          Телефон
  scripts/build-data.mjs  ───────►  data/offers.json  ──►  IndexedDB (офлайн)
  (източници → нормализиране →                             ├─ търсене / филтри локално
   категории → offers.json)                                └─ следени продукти → известия
  vite build → GitHub Pages
```

- **Данни:** засега идват от публичния `promos.json` на [bgpromo.pages.dev](https://bgpromo.pages.dev/), който събира Lidl и Kaufland, а Billa – от [Price Barometer](https://prices.alexandergekov.com). Всеки източник е модул в `scripts/sources/`; собствени scrapers за всеки магазин могат да заменят източника постепенно. Ако източник падне, се ползват офертите от предишния deploy.
- **Всичко лично остава на устройството:** следени продукти, списък и настройки са в IndexedDB/localStorage. Сървър няма.
- **Известия без сървър:** приложението проверява при отваряне. Инсталирано в Chrome (Android/desktop), проверява и във фонов режим чрез Periodic Background Sync – колко често решава браузърът (обикновено около веднъж дневно). На iPhone – само при отваряне.

## Разработка

```bash
npm install
npm run data      # сваля и подготвя public/data/offers.json
npm run dev       # http://localhost:5173
npm test
npm run build     # dist/
npm run icons     # прегенерира иконите от SVG
```

Зад HTTP proxy Node 22 има нужда от `NODE_USE_ENV_PROXY=1` за `npm run data`.

## Deploy

`.github/workflows/deploy.yml` събира данните, тества, билдва и публикува в GitHub Pages при push и по график. Еднократно: **Settings → Pages → Source: GitHub Actions**.
