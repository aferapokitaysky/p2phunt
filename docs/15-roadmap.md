# Roadmap

## Stage 1 - Documentation And Decisions

Deliverables:

- project documentation;
- MVP scope;
- architecture;
- DB model;
- API draft;
- connector strategy;
- Telegram R&D plan.

Status:

- In progress.

## Stage 2 - Monorepo Scaffold

Deliverables:

- pnpm workspace;
- `apps/web`;
- `apps/api`;
- `apps/worker`;
- `packages/shared`;
- `packages/connectors`;
- TypeScript config;
- lint/format;
- Docker Compose for PostgreSQL/Redis;
- env examples.

## Stage 3 - Backend Core

Deliverables:

- NestJS API;
- Prisma schema;
- auth;
- accounts;
- platforms;
- deals;
- balances;
- rates;
- audit logs;
- connector logs;
- BullMQ setup;
- WebSocket gateway.

## Stage 4 - Frontend Core

Deliverables:

- app shell;
- navigation;
- auth screens;
- dashboard;
- accounts page;
- deals table;
- balances page;
- rates page;
- logs page;
- settings page.

## Stage 5 - Mock Connector

Deliverables:

- mock platform;
- fake account sync;
- fake deals;
- fake balances;
- fake ads;
- fake rates;
- controllable failures;
- seed/demo data.

## Stage 6 - First Real Official API Connector

Deliverables:

- research chosen platform;
- implement read-only connector;
- credential validation;
- sync profile/balances/deals if available;
- error handling;
- logs and metrics.

Recommended candidates:

- Binance;
- Bybit;
- OKX.

Final choice depends on actual API capabilities.

## Stage 7 - Notifications

Deliverables:

- in-app notifications;
- Telegram notification bot;
- webhook channel;
- notification settings;
- test channel action.

## Stage 8 - Manual Actions

Deliverables:

- connector command pipeline;
- update ad price if connector supports it;
- enable/disable ads if connector supports it;
- command status UI;
- audit logs;
- bulk action preview.

## Stage 9 - Automation MVP

Deliverables:

- JSON/form rule editor;
- triggers;
- conditions;
- safe actions;
- dry run;
- execution logs;
- global emergency stop;
- per-rule/per-account modes.

## Stage 10 - Telegram R&D

Deliverables:

- GramJS prototype;
- login flow;
- encrypted session storage;
- message capture;
- sample message corpus;
- CryptoBot parser prototype;
- xRocket parser prototype;
- capability matrix.

## Stage 11 - Telegram Connector MVP

Only if R&D succeeds.

Deliverables:

- read messages;
- parse selected events;
- sync deals/balances where possible;
- connector logs;
- reauth flow;
- parser tests.

## Stage 12 - SaaS Hardening

Deliverables:

- multi-workspace;
- roles;
- billing placeholder;
- stronger security;
- monitoring;
- backups;
- deployment pipeline;
- staging/prod split.

## Build Order Recommendation

Do not begin with Telegram automation.

Best path:

```text
Docs
  -> Monorepo
  -> DB/API
  -> Web dashboard
  -> Mock connector
  -> Rate service
  -> One official API connector
  -> Notifications
  -> Manual actions
  -> Automation
  -> Telegram R&D
```

This gets a usable product earlier and reduces the chance of spending weeks on fragile integration work before the core exists.
