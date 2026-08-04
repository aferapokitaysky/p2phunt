# P2PHunt Project Context

This repository was initialized from the GitHub remote `https://github.com/aferapokitaysky/p2phunt.git`.
The remote was empty at import time. The first product context was recovered from the shared ChatGPT conversation and then expanded into structured documentation.

## Product Summary

P2PHunt is a web SaaS platform for P2P traders.

The goal is to replace switching between many exchanges, Telegram bots, wallets, and accounts with one operational control panel:

- accounts;
- deals;
- balances;
- rates;
- ads/orders;
- markups;
- analytics;
- notifications;
- audit logs;
- automation rules.

The product should feel like an operating system for a P2P trader, not a simple dashboard.

## Key Decisions

- Use `core + connectors` architecture.
- Start with read-only sync, then manual write actions, then guarded automation.
- Build a mock connector before real integrations.
- Treat Telegram integrations as a separate R&D track.
- Use Telegram MTProto for reading/interacting with Telegram bot dialogs; Telegram Bot API is not enough.
- Keep Telegram handling in a separate worker boundary.
- Encrypt secrets from day one.
- Log every external command and automation execution.
- Keep global Manual/Auto mode with emergency stop.

## Stack

Frontend:

- React;
- TypeScript;
- Tailwind CSS;
- TanStack Query;
- TanStack Table;
- React Hook Form;
- Zod;
- Zustand;
- Recharts or Apache ECharts;
- Socket.IO Client.

Backend:

- Node.js;
- TypeScript;
- NestJS;
- Prisma;
- PostgreSQL;
- Redis;
- BullMQ;
- Socket.IO;
- Passport/JWT.

Infrastructure:

- Docker;
- Docker Compose;
- Nginx;
- GitHub Actions;
- Sentry;
- Prometheus/Grafana;
- MinIO or S3.

## Documentation

Main entry point:

- [docs/00-index.md](/Users/korova/Desktop/p2p/docs/00-index.md)

Important documents:

- [docs/01-product.md](/Users/korova/Desktop/p2p/docs/01-product.md)
- [docs/02-mvp.md](/Users/korova/Desktop/p2p/docs/02-mvp.md)
- [docs/03-architecture.md](/Users/korova/Desktop/p2p/docs/03-architecture.md)
- [docs/05-database.md](/Users/korova/Desktop/p2p/docs/05-database.md)
- [docs/06-api.md](/Users/korova/Desktop/p2p/docs/06-api.md)
- [docs/07-connectors.md](/Users/korova/Desktop/p2p/docs/07-connectors.md)
- [docs/08-telegram-rd.md](/Users/korova/Desktop/p2p/docs/08-telegram-rd.md)
- [docs/09-automation.md](/Users/korova/Desktop/p2p/docs/09-automation.md)
- [docs/15-roadmap.md](/Users/korova/Desktop/p2p/docs/15-roadmap.md)

Source chat:

- [docs/imported-chat-transcript.md](/Users/korova/Desktop/p2p/docs/imported-chat-transcript.md)

## Current Implementation

The product is fully implemented end-to-end (not just a scaffold) and has been manually verified through the real UI in a browser, plus curl/API smoke tests, on every layer:

- **Auth & multi-tenancy**: JWT register/login/refresh/logout, `WorkspaceGuard` scoping every request by membership (replaced the old hardcoded `DEV_WORKSPACE_ID`), audit log on every mutation, secrets encrypted at rest (AES-256-GCM).
- **Full domain API** (`apps/api`): accounts (connect/sync/secrets/disable/sync-jobs), deals (filters/sort/pagination/export/notes/messages), balances, ads (price update + enable/disable, bulk with preview), rates (sources/current/history/manual override) with a markup pricing engine (global<platform<account<ad, most-specific-wins), automation (JSON rule CRUD/dry-run/executions/emergency-stop/mode), notifications, audit/connector/sync-job logs, connector commands, and a live public market endpoint (Binance + Bybit P2P, verified against real live data, no account needed).
- **Worker** (`apps/worker`): real BullMQ job processing — `sync-account` (calls the connector, upserts DB, publishes events) and `execute-command` (runs ad price/enable/disable against the connector). An automation engine matches fired events against enabled rules, evaluates conditions, and executes only in `auto` mode with emergency-stop/cooldown guards; high-risk action types are hard-blocked in code. Events cross the API/worker process boundary via a Redis pub/sub channel relayed into the Socket.IO gateway.
- **Frontend** (`apps/web`): full React app (router, JWT session store with silent refresh, live WS-driven query invalidation) covering Dashboard, Deals (multi-account feed + detail drawer with notes/logged messages/raw payload), Accounts, Balances, Ads, Market, Rates, Automation, Notifications, Logs, Settings. Dark dense operations-desk theme; Manual/Auto + Emergency Stop always visible. Fully localized in Russian, including backend-originated strings (auth errors, notification titles, connector log lines). Real crypto icons (CC0 `cryptocurrency-icons` set + hand-drawn TON) and original brand-colored exchange badges (not traced logos) throughout; fiat shows as flags; unknown assets fall back to a monogram.
- **Connectors** (`packages/connectors`): `MockConnector` now implements the write capabilities it declares (`ads.update_price/enable/disable`) with seeded jitter and opt-in simulated failures; `binance/public.ts` + `bybit/public.ts` pull live public P2P market data (undocumented-but-working endpoints, not official partner APIs); `telegram/parser.ts` is a configurable regex-rule engine + replay harness — real bot message formats are unverified, and no live GramJS login worker exists (needs a real phone + interactive OTP).
- **Tests**: Vitest unit tests for the automation condition evaluator, the Telegram parser, and `MockConnector` (30 tests, all passing).
- **Infra**: `docker-compose.yml` now also builds/runs `api`, `worker`, and `web` (previously only Postgres/Redis); GitHub Actions CI (lint/typecheck/test/build against real Postgres+Redis services).

Not built — see README "What's deliberately not built yet": real private Bybit/Binance connectors (only public market data is live), live Telegram MTProto login, and anything involving money movement.

## Next Implementation Step

1. Get real Bybit/Binance API keys and verify the private connectors (profile/balances/deals/ads) against live responses; currently only the public market endpoints are live-verified.
2. If/when a Telegram phone number is available for interactive testing, build the GramJS login worker (phone → code → 2FA → encrypted session) and calibrate `telegram/parser.ts` rules against a real captured message corpus.
3. Notification channels (Telegram bot / webhook) — the DB model and API CRUD exist (`NotificationChannel`), but no delivery worker consumes them yet.
4. Repeatable/scheduled jobs (periodic account sync, periodic rate refresh) — sync today is manual-trigger or automation-triggered only, no cron-style scheduler yet.
5. Wire a real rate-source connector (e.g. periodic Binance/Bybit public price polling into `RateTick`/`CurrentRate`) so the Rates page has live data without a manual override.
