# P2PHunt

P2PHunt is a unified operations desk for P2P traders who manage accounts across exchanges, Telegram wallets, and bots. Connect your accounts and run deals, balances, ads, rates, and automation from one panel instead of switching between exchange sites.

## Current Status

The product is implemented end-to-end and has been manually verified: register/login → connect an account → sync → see deals/balances/ads live in the UI via WebSocket, with a live cross-exchange market feed and a working (safety-gated) automation engine.

### apps/api — NestJS backend

- JWT auth (register/login/refresh/logout), workspace-scoped by membership, audit log on every mutation.
- Secrets (API keys, future Telegram sessions) encrypted at rest (AES-256-GCM), never returned by the API.
- Full domain API: accounts, deals (filters/sort/pagination/export/notes/messages), balances, ads (incl. bulk price update with required preview), rates (sources/current/history/manual override) + a markup pricing engine, automation rules (JSON rule editor, dry-run, executions, emergency stop, manual/auto mode), notifications, audit/connector/sync-job logs, connector commands, and a live public market feed (Binance + Bybit P2P, no account needed).
- WebSocket gateway (Socket.IO) broadcasts live domain events per workspace; a Redis pub/sub bridge relays events published by the worker process into the same gateway.

### apps/worker — BullMQ worker

- Owns real connector sync execution (`sync-account` job): calls the connector, upserts balances/deals/ads, writes connector/sync-job logs, publishes events.
- Owns connector command execution (`execute-command` job): runs `ads.update_price` / `ads.enable` / `ads.disable` against the connector and updates the ad + command status.
- Automation engine: matches enabled rules against fired events, evaluates conditions (`eq/neq/gt/gte/lt/lte/in/not_in/contains/changed_by_percent/changed_by_amount`), and executes safe actions only when the workspace is in **auto** mode, the emergency stop is off, and cooldown has elapsed. High-risk action types (transfers, payment confirmation, mass ad creation) are hard-blocked in code, not just by convention.

### apps/web — React frontend

Router, JWT session store with silent refresh, live WebSocket-driven cache invalidation (TanStack Query), and full pages: Dashboard, Deals (unified multi-account feed with a detail drawer — internal notes, logged messages, raw payload, since exchanges don't expose a chat API), Accounts (connect/sync/secrets/tabs), Balances, Ads (inline + bulk price changes with a confirm-preview step), Market (live Binance/Bybit offers), Rates (sources, manual override, history chart, price quote), Automation (JSON rule editor, dry-run preview, executions), Notifications, Logs, Settings (markup rules). Dark, dense operations-desk styling; Manual/Auto mode and Emergency Stop are always visible in the top bar.

**UI language: Russian.** Every page, form, status label, and user-facing backend message (auth errors, notification titles, connector log lines) is in Russian. Real crypto icons (BTC/ETH/USDT/USDC/BNB/TRX from the CC0-licensed `cryptocurrency-icons` set, plus a hand-drawn TON mark) and exchange badges (Binance/Bybit, brand-colored originals — not traced logos, to stay clear of trademark reproduction) are used throughout; fiat currencies show as country flags. Unknown assets fall back to a colored monogram so nothing ever renders blank.

### packages/connectors

- `MockConnector` — full read+write connector (including `ads.update_price/enable/disable`), seeded per-account jitter, opt-in simulated failures (`credentials.simulateFailures`) for exercising failure states without flaky tests.
- `binance/public.ts`, `bybit/public.ts` — live public P2P market data. **Not official partner APIs** — these are the same undocumented endpoints each exchange's own web app calls, verified to work but subject to change without notice.
- `telegram/parser.ts` — a configurable regex-rule parsing engine for Telegram bot notifications (CryptoBot/xRocket/Wallet-style), plus a replay harness for testing against a captured message corpus. The example rules are illustrative starting templates, not verified against any live bot. **A live GramJS login/session worker has not been built** — that requires a real phone number and interactive OTP entry, which isn't possible in an unattended session. See [docs/08-telegram-rd.md](docs/08-telegram-rd.md).

Real, private Bybit/Binance account connectors (balances/deals/ads via authenticated API) are not built — the plan only covers public market data with no key required. See [docs/07-connectors.md](docs/07-connectors.md) for the connector safety-level model this follows.

## Documentation

Start here:

- [Documentation Index](docs/00-index.md)
- [Project Context](PROJECT_CONTEXT.md)

Core documents:

- [Product Specification](docs/01-product.md)
- [MVP Scope](docs/02-mvp.md)
- [Architecture](docs/03-architecture.md)
- [Domain Model](docs/04-domain-model.md)
- [Database Design](docs/05-database.md)
- [API Specification](docs/06-api.md)
- [Connectors](docs/07-connectors.md)
- [Telegram R&D](docs/08-telegram-rd.md)
- [Automation Engine](docs/09-automation.md)
- [Rates And Pricing](docs/10-rates-pricing.md)
- [UI / UX Specification](docs/11-ui-ux.md)
- [Security And Risk](docs/12-security.md)
- [Observability](docs/13-observability.md)
- [Deployment](docs/14-deployment.md)
- [Roadmap](docs/15-roadmap.md)

## Stack

Frontend: React, TypeScript, Tailwind CSS, TanStack Query/Table, React Hook Form, Zod, Zustand, Recharts, Socket.IO client, React Router.

Backend: Node.js, TypeScript, NestJS, Prisma, PostgreSQL, Redis, BullMQ, Socket.IO, JWT.

Infrastructure: Docker / Docker Compose, GitHub Actions CI, Vitest.

## Core Principle

Read-only visibility first, manual write actions second, guarded automation third. This is financial operations software: every connector action and automation execution is explicit, logged, and safety-gated.

## Local Development

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres redis
pnpm db:migrate
pnpm --filter @p2phunt/api db:seed   # demo@p2phunt.local / password123
pnpm dev                              # runs api + worker + web
```

Open http://localhost:5173 and sign in with the seeded demo account.

Useful checks:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Run everything (including the app containers) via Docker Compose:

```bash
docker compose up --build -d
pnpm --filter @p2phunt/api exec prisma migrate deploy
pnpm --filter @p2phunt/api db:seed
```

Open http://localhost:4173 (the containerized web build; local `pnpm dev` uses :5173 instead).

Note: the root `.env` is for local `pnpm dev` (`WEB_ORIGIN`/`VITE_API_URL`/`VITE_WS_URL` point at :5173). Docker Compose reads that same `.env` automatically for variable interpolation, so the compose file intentionally uses separate `DOCKER_WEB_ORIGIN`/`DOCKER_VITE_API_URL`/`DOCKER_VITE_WS_URL` variables (defaulting to the container ports) instead of reusing those keys — otherwise the two workflows silently clash.

## What's deliberately not built yet

- **Real private exchange connectors** (Bybit/Binance authenticated read/write) — the connector interface and command pipeline are ready, but no live account has been used to verify them against real API responses.
- **Live Telegram MTProto session/login** — parser + replay harness exist; the interactive phone/OTP login worker does not.
- **Money movement** (transfers, payment confirmation) — explicitly out of scope; the automation engine hard-blocks these action types in code.
- **Exchange chat integration** — no exchange exposes a chat API; the deal drawer offers internal notes/logged messages instead.
