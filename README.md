# P2PHunt 🦅💱

[**English**](#english) | [**Русский**](#русский)

---

<a name="english"></a>
## 🇬🇧 English

P2PHunt is a unified operations desk for P2P crypto traders who manage accounts across exchanges, Telegram wallets, and bots. Connect your accounts once and run deals, balances, ads, rates, and automation from a single panel instead of switching between exchange sites, apps, and bots all day.

Think of it as an OMS (order/deal management) + CRM (counterparty context) + treasury view (cross-platform balances) + rate desk (markup rules) + automation platform (event-driven rules) + monitoring center (logs, notifications, sync health) — all in one operator-focused cockpit.

### 📌 Current Status

The product is implemented end-to-end and has been manually verified: **register/login → connect an account → sync → see deals/balances/ads live in the UI via WebSocket**, with a live cross-exchange market feed and a working (safety-gated) automation engine.

Deliberately **not** built yet:

- **Real private exchange connectors** (Bybit/Binance authenticated read/write) — the connector interface and command pipeline are ready, but no live account has been used to verify them against real API responses.
- **Live Telegram MTProto session/login** — the parser and replay harness exist; the interactive phone/OTP login worker does not.
- **Money movement** (transfers, payment confirmation) — explicitly out of scope; the automation engine hard-blocks these action types in code, not just by convention.
- **Exchange chat integration** — no exchange exposes a chat API, so the deal drawer offers internal notes and logged messages instead.

### ✨ Features

**API (NestJS backend)**
- JWT auth (register/login/refresh/logout), workspace-scoped by membership, with an audit log on every mutation.
- Secrets (API keys, future Telegram sessions) encrypted at rest with AES-256-GCM, never returned by the API.
- Full domain API: accounts, deals (filters/sort/pagination/export/notes/messages), balances, ads (incl. bulk price update with a required preview step), rates (sources/current/history/manual override) plus a markup pricing engine, automation rules (JSON rule editor, dry-run, executions, emergency stop, manual/auto mode), notifications, and audit/connector/sync-job logs.
- A live public market feed (Binance + Bybit P2P, no account required).
- WebSocket gateway (Socket.IO) broadcasts live domain events per workspace, with a Redis pub/sub bridge relaying events published by the worker process into the same gateway.

**Worker (BullMQ)**
- Owns real connector sync execution (`sync-account` job): calls the connector, upserts balances/deals/ads, writes connector/sync-job logs, publishes events.
- Owns connector command execution (`execute-command` job): runs `ads.update_price` / `ads.enable` / `ads.disable` against the connector and updates ad + command status.
- Automation engine: matches enabled rules against fired events, evaluates conditions (`eq/neq/gt/gte/lt/lte/in/not_in/contains/changed_by_percent/changed_by_amount`), and executes safe actions only when the workspace is in **auto** mode, the emergency stop is off, and cooldown has elapsed. High-risk action types (transfers, payment confirmation, mass ad creation) are hard-blocked in code.

**Web (React frontend)**
- Router, JWT session store with silent refresh, live WebSocket-driven cache invalidation (TanStack Query).
- Full page set: Dashboard, Deals (unified multi-account feed with a detail drawer — internal notes, logged messages, raw payload), Accounts (connect/sync/secrets/tabs), Balances, Ads (inline + bulk price changes with a confirm-preview step), Market (live Binance/Bybit offers), Rates (sources, manual override, history chart, price quote), Automation (JSON rule editor, dry-run preview, executions), Notifications, Logs, Settings (markup rules).
- Dark, dense operations-desk styling; Manual/Auto mode and Emergency Stop are always visible in the top bar.
- **UI language: Russian.** Every page, form, status label, and user-facing backend message (auth errors, notification titles, connector log lines) is in Russian. Real crypto icons (BTC/ETH/USDT/USDC/BNB/TRX from the CC0-licensed `cryptocurrency-icons` set, plus a hand-drawn TON mark) and exchange badges (brand-colored originals, not traced logos) are used throughout; fiat currencies show as country flags, with a colored monogram fallback for unknown assets.

**Connectors**
- `MockConnector` — a full read+write connector (including `ads.update_price/enable/disable`), with seeded per-account jitter and opt-in simulated failures for exercising failure states without flaky tests.
- `binance/public.ts`, `bybit/public.ts` — live public P2P market data via the same undocumented endpoints each exchange's own web app calls (not official partner APIs, verified working but subject to change).
- `telegram/parser.ts` — a configurable regex-rule parsing engine for Telegram bot notifications (CryptoBot/xRocket/Wallet-style), plus a replay harness for testing against a captured message corpus.

### 🧭 Core Principle

**Read-only visibility first, manual write actions second, guarded automation third.** This is financial operations software: every connector action and automation execution is explicit, logged, and safety-gated.

### 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS, TanStack Query / Table, React Hook Form, Zod, Zustand, Recharts, Socket.IO client, React Router |
| Backend | Node.js, TypeScript, NestJS, Prisma, PostgreSQL, Redis, BullMQ, Socket.IO, JWT (Passport) |
| Worker | Node.js, TypeScript, BullMQ, Prisma |
| Connectors | TypeScript adapters over Binance/Bybit public APIs, a mock read+write connector, and a Telegram bot-message parsing engine |
| Infrastructure | Docker / Docker Compose, GitHub Actions CI, Vitest |

### 📂 Repository Structure

```
apps/
  api/              # NestJS backend — auth, REST API, WebSocket gateway, Prisma
    prisma/         # database schema & migrations
    src/
      common/        # shared API infrastructure (guards, filters, interceptors)
      modules/       # feature modules (accounts, deals, balances, ads, rates, automation, ...)
  worker/           # BullMQ worker — connector sync, commands, automation engine
    src/
      connectors/    # runtime wiring for connector packages
      queues/        # BullMQ queue definitions
      jobs/          # job processors (sync-account, execute-command, ...)
      automation/    # rule matching & safe-action execution
      events/        # Redis pub/sub event bridge to the API gateway
  web/              # React frontend
    src/
      pages/         # Dashboard, Deals, Accounts, Balances, Ads, Market, Rates, Automation, ...
      components/    # shared UI components
      layout/        # app shell, navigation, top bar (mode/emergency stop)
      store/         # Zustand state (session, UI)
      hooks/, lib/   # data hooks, API/WS clients, utilities

packages/
  shared/           # shared TypeScript types, Zod schemas, automation contracts
  connectors/       # connector implementations
    src/
      core/          # connector interface & capability model
      mock/          # MockConnector (full read+write, simulated failures)
      binance/, bybit/    # public P2P market data adapters
      okx/           # (planned/partial) connector scaffolding
      telegram/      # bot-message parsing engine + replay harness
      cryptobot/, xrocket/, walletpay/  # Telegram-based service adapters

docs/               # in-depth product, architecture, and domain documentation (see below)
docker-compose.yml  # postgres, redis, and app containers for local/dev use
```

### 🚀 Getting Started

**Local development:**

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres redis
pnpm db:migrate
pnpm --filter @p2phunt/api db:seed   # demo@p2phunt.local / password123
pnpm dev                              # runs api + worker + web
```

Open [http://localhost:5173](http://localhost:5173) and sign in with the seeded demo account.

Useful checks:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

**Full Docker Compose stack** (including the app containers):

```bash
docker compose up --build -d
pnpm --filter @p2phunt/api exec prisma migrate deploy
pnpm --filter @p2phunt/api db:seed
```

Open [http://localhost:4173](http://localhost:4173) (the containerized web build; local `pnpm dev` uses `:5173` instead).

> Note: the root `.env` is for local `pnpm dev` (`WEB_ORIGIN`/`VITE_API_URL`/`VITE_WS_URL` point at `:5173`). Docker Compose reads the same `.env` for variable interpolation, so the compose file intentionally uses separate `DOCKER_WEB_ORIGIN`/`DOCKER_VITE_API_URL`/`DOCKER_VITE_WS_URL` variables (defaulting to the container ports) instead of reusing those keys — otherwise the two workflows silently clash.

### 📚 Documentation

This README covers the essentials. For deep architecture, domain-model, database, API, connector, automation, and rollout detail, see the **[`docs/`](docs/)** folder, starting with the [Documentation Index](docs/00-index.md):

- [Product Specification](docs/01-product.md) · [MVP Scope](docs/02-mvp.md) · [Architecture](docs/03-architecture.md)
- [Domain Model](docs/04-domain-model.md) · [Database Design](docs/05-database.md) · [API Specification](docs/06-api.md)
- [Connectors](docs/07-connectors.md) · [Telegram R&D](docs/08-telegram-rd.md) · [Automation Engine](docs/09-automation.md)
- [Rates And Pricing](docs/10-rates-pricing.md) · [UI / UX Specification](docs/11-ui-ux.md)
- [Security And Risk](docs/12-security.md) · [Observability](docs/13-observability.md)
- [Deployment](docs/14-deployment.md) · [Roadmap](docs/15-roadmap.md)
- [Project Context](PROJECT_CONTEXT.md)

---
---

<a name="русский"></a>
## 🇷🇺 Русский

P2PHunt — единая операционная панель для P2P-трейдеров, работающих с криптовалютой сразу на нескольких биржах, в Telegram-кошельках и через ботов. Подключите свои аккаунты один раз и управляйте сделками, балансами, объявлениями, курсами и автоматизацией из одного окна вместо постоянного переключения между сайтами бирж, приложениями и ботами.

Это одновременно OMS (управление сделками), CRM (контекст по контрагентам), казначейский модуль (балансы по всем площадкам), «рейт-деск» (правила наценки), платформа автоматизации (событийные правила) и центр мониторинга (логи, уведомления, статус синхронизации) — всё в одной рабочей консоли для оператора.

### 📌 Текущий статус

Продукт реализован полностью и проверен вручную: **регистрация/вход → подключение аккаунта → синхронизация → сделки/балансы/объявления в реальном времени через WebSocket**, плюс живая кросс-биржевая лента рынка и работающий (защищённый предохранителями) движок автоматизации.

Сознательно **не** реализовано:

- **Реальные приватные коннекторы бирж** (Bybit/Binance с авторизованным чтением/записью) — интерфейс коннектора и пайплайн команд готовы, но ни один боевой аккаунт не использовался для проверки против реальных ответов API.
- **Живая сессия/логин Telegram по MTProto** — парсер и харнесс для повторного воспроизведения сообщений есть, а интерактивный воркер логина по телефону/OTP — нет.
- **Движение денег** (переводы, подтверждение платежей) — сознательно вне скоупа; движок автоматизации блокирует такие типы действий на уровне кода, а не просто по соглашению.
- **Интеграция с чатом биржи** — ни одна биржа не предоставляет API чата, поэтому в карточке сделки вместо этого доступны внутренние заметки и залогированные сообщения.

### ✨ Возможности

**API (бэкенд на NestJS)**
- JWT-авторизация (регистрация/вход/обновление токена/выход), доступ в рамках рабочего пространства (workspace) по членству, аудит-лог на каждую мутацию.
- Секреты (API-ключи, в будущем — сессии Telegram) шифруются в покое (AES-256-GCM) и никогда не возвращаются через API.
- Полноценный доменный API: аккаунты, сделки (фильтры/сортировка/пагинация/экспорт/заметки/сообщения), балансы, объявления (включая массовое обновление цены с обязательным шагом предпросмотра), курсы (источники/текущий курс/история/ручное переопределение) плюс движок наценки, правила автоматизации (JSON-редактор правил, dry-run, история выполнений, аварийная остановка, ручной/авто режим), уведомления, логи аудита/коннекторов/синхронизаций.
- Живая публичная лента рынка (Binance + Bybit P2P, без необходимости аккаунта).
- WebSocket-шлюз (Socket.IO) рассылает доменные события в реальном времени по каждому workspace; мост Redis pub/sub передаёт в этот же шлюз события, публикуемые процессом воркера.

**Воркер (BullMQ)**
- Отвечает за реальное выполнение синхронизации коннектора (задача `sync-account`): вызывает коннектор, обновляет балансы/сделки/объявления, пишет логи коннектора/синхронизации, публикует события.
- Отвечает за выполнение команд коннектора (задача `execute-command`): выполняет `ads.update_price` / `ads.enable` / `ads.disable` через коннектор и обновляет статус объявления и команды.
- Движок автоматизации: сопоставляет включённые правила с произошедшими событиями, вычисляет условия (`eq/neq/gt/gte/lt/lte/in/not_in/contains/changed_by_percent/changed_by_amount`) и выполняет только безопасные действия — и только когда workspace находится в режиме **авто**, аварийная остановка выключена, а cooldown уже прошёл. Высокорисковые типы действий (переводы, подтверждение платежа, массовое создание объявлений) жёстко заблокированы в коде.

**Web (фронтенд на React)**
- Роутинг, хранилище JWT-сессии с тихим обновлением токена, живая инвалидация кэша по WebSocket (TanStack Query).
- Полный набор страниц: Dashboard, Сделки (единая лента по всем аккаунтам с боковой панелью деталей — внутренние заметки, залогированные сообщения, сырой payload), Аккаунты (подключение/синхронизация/секреты/вкладки), Балансы, Объявления (точечное и массовое изменение цены с шагом подтверждения), Рынок (живые предложения Binance/Bybit), Курсы (источники, ручное переопределение, график истории, котировка), Автоматизация (JSON-редактор правил, предпросмотр dry-run, история выполнений), Уведомления, Логи, Настройки (правила наценки).
- Тёмная, плотная стилистика операционного пульта; режим Ручной/Авто и Аварийная остановка всегда видны в верхней панели.
- **Язык интерфейса: русский.** Каждая страница, форма, статус-лейбл и пользовательское сообщение от бэкенда (ошибки авторизации, заголовки уведомлений, строки логов коннектора) — на русском языке. Используются настоящие иконки криптовалют (BTC/ETH/USDT/USDC/BNB/TRX из набора `cryptocurrency-icons` под лицензией CC0, плюс нарисованный вручную знак TON) и бейджи бирж (оригинальные, в фирменных цветах, а не скопированные логотипы); фиатные валюты отображаются флагами стран, для неизвестных активов — цветная монограмма-заглушка.

**Коннекторы**
- `MockConnector` — полноценный коннектор с чтением и записью (включая `ads.update_price/enable/disable`), с заданным джиттером на аккаунт и опциональной симуляцией сбоев для проверки сценариев отказа без «плавающих» тестов.
- `binance/public.ts`, `bybit/public.ts` — живые публичные данные рынка P2P через те же недокументированные эндпоинты, которые использует веб-приложение самой биржи (это не официальные партнёрские API, но проверено в работе; могут измениться без предупреждения).
- `telegram/parser.ts` — настраиваемый движок парсинга на основе regex-правил для уведомлений Telegram-ботов (в стиле CryptoBot/xRocket/Wallet), плюс харнесс для повторного воспроизведения на захваченном корпусе сообщений.

### 🧭 Ключевой принцип

**Сначала read-only видимость, затем ручные действия записи, и только потом — управляемая автоматизация.** Это финансовое операционное ПО: каждое действие коннектора и каждый запуск автоматизации явные, логируются и защищены предохранителями.

### 🛠️ Технологический стек

| Слой | Технологии |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS, TanStack Query / Table, React Hook Form, Zod, Zustand, Recharts, Socket.IO client, React Router |
| Backend | Node.js, TypeScript, NestJS, Prisma, PostgreSQL, Redis, BullMQ, Socket.IO, JWT (Passport) |
| Worker | Node.js, TypeScript, BullMQ, Prisma |
| Коннекторы | TypeScript-адаптеры над публичными API Binance/Bybit, мок-коннектор с чтением и записью, движок парсинга сообщений Telegram-ботов |
| Инфраструктура | Docker / Docker Compose, GitHub Actions CI, Vitest |

### 📂 Структура репозитория

```
apps/
  api/              # бэкенд на NestJS — авторизация, REST API, WebSocket-шлюз, Prisma
    prisma/         # схема базы данных и миграции
    src/
      common/        # общая инфраструктура API (guards, filters, interceptors)
      modules/       # доменные модули (accounts, deals, balances, ads, rates, automation, ...)
  worker/           # воркер на BullMQ — синхронизация коннекторов, команды, движок автоматизации
    src/
      connectors/    # runtime-подключение пакетов коннекторов
      queues/        # определения очередей BullMQ
      jobs/          # обработчики задач (sync-account, execute-command, ...)
      automation/    # сопоставление правил и выполнение безопасных действий
      events/        # мост событий Redis pub/sub к шлюзу API
  web/              # фронтенд на React
    src/
      pages/         # Dashboard, Сделки, Аккаунты, Балансы, Объявления, Рынок, Курсы, Автоматизация, ...
      components/    # общие UI-компоненты
      layout/        # каркас приложения, навигация, верхняя панель (режим/авар. остановка)
      store/         # состояние на Zustand (сессия, UI)
      hooks/, lib/   # хуки данных, клиенты API/WS, утилиты

packages/
  shared/           # общие TypeScript-типы, Zod-схемы, контракты автоматизации
  connectors/       # реализации коннекторов
    src/
      core/          # интерфейс коннектора и модель возможностей
      mock/          # MockConnector (полный чтение+запись, симуляция сбоев)
      binance/, bybit/    # адаптеры публичных данных рынка P2P
      okx/           # (плановый/частичный) каркас коннектора
      telegram/      # движок парсинга сообщений ботов + харнесс воспроизведения
      cryptobot/, xrocket/, walletpay/  # адаптеры Telegram-сервисов

docs/               # подробная продуктовая, архитектурная и доменная документация (см. ниже)
docker-compose.yml  # postgres, redis и контейнеры приложения для локальной разработки
```

### 🚀 Быстрый старт

**Локальная разработка:**

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres redis
pnpm db:migrate
pnpm --filter @p2phunt/api db:seed   # demo@p2phunt.local / password123
pnpm dev                              # запускает api + worker + web
```

Откройте [http://localhost:5173](http://localhost:5173) и войдите с сид-аккаунтом.

Полезные проверки:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

**Полный стек через Docker Compose** (включая контейнеры приложения):

```bash
docker compose up --build -d
pnpm --filter @p2phunt/api exec prisma migrate deploy
pnpm --filter @p2phunt/api db:seed
```

Откройте [http://localhost:4173](http://localhost:4173) (контейнеризированная сборка web; локальный `pnpm dev` использует `:5173`).

> Примечание: корневой `.env` предназначен для локального `pnpm dev` (`WEB_ORIGIN`/`VITE_API_URL`/`VITE_WS_URL` указывают на `:5173`). Docker Compose читает тот же `.env` для подстановки переменных, поэтому в compose-файле намеренно используются отдельные переменные `DOCKER_WEB_ORIGIN`/`DOCKER_VITE_API_URL`/`DOCKER_VITE_WS_URL` (по умолчанию — порты контейнеров) вместо тех же ключей — иначе два сценария запуска будут конфликтовать друг с другом.

### 📚 Документация

Этот README покрывает главное. Подробности по архитектуре, доменной модели, базе данных, API, коннекторам, автоматизации и деплою — в папке **[`docs/`](docs/)**, начиная с [индекса документации](docs/00-index.md):

- [Продуктовая спецификация](docs/01-product.md) · [Скоуп MVP](docs/02-mvp.md) · [Архитектура](docs/03-architecture.md)
- [Доменная модель](docs/04-domain-model.md) · [Дизайн базы данных](docs/05-database.md) · [Спецификация API](docs/06-api.md)
- [Коннекторы](docs/07-connectors.md) · [Telegram R&D](docs/08-telegram-rd.md) · [Движок автоматизации](docs/09-automation.md)
- [Курсы и ценообразование](docs/10-rates-pricing.md) · [Спецификация UI/UX](docs/11-ui-ux.md)
- [Безопасность и риски](docs/12-security.md) · [Наблюдаемость](docs/13-observability.md)
- [Деплой](docs/14-deployment.md) · [Дорожная карта](docs/15-roadmap.md)
- [Контекст проекта](PROJECT_CONTEXT.md)
