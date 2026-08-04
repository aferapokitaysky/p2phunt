# Architecture

## High-Level Shape

P2PHunt should be a modular monorepo with a web app, API, worker services, shared domain types, and connector packages.

```text
Browser
  -> React Web App
  -> API Gateway / NestJS API
  -> PostgreSQL
  -> Redis / BullMQ
  -> Workers
  -> Connectors
  -> External platforms
```

## Recommended Monorepo

```text
apps/
  api/
    src/
      modules/
      main.ts
  web/
    src/
      app/
      components/
      features/
      routes/
  worker/
    src/
      queues/
      processors/
packages/
  shared/
    src/
      types/
      schemas/
      events/
  connectors/
    src/
      core/
      mock/
      binance/
      bybit/
      telegram/
docs/
```

## Runtime Services

### Web

Responsibilities:

- dashboard;
- tables;
- account management;
- rule configuration;
- notifications view;
- logs view;
- settings.

Technology:

- React;
- TypeScript;
- Tailwind CSS;
- TanStack Query;
- TanStack Table;
- React Hook Form;
- Zod;
- Zustand;
- Socket.IO Client;
- Recharts or Apache ECharts.

### API

Responsibilities:

- auth;
- REST API;
- WebSocket gateway;
- validation;
- permission checks;
- orchestration of commands;
- persistence through Prisma;
- enqueue background jobs.

Technology:

- Node.js;
- TypeScript;
- NestJS;
- Prisma;
- PostgreSQL;
- Redis;
- BullMQ;
- Socket.IO;
- Passport/JWT.

### Worker

Responsibilities:

- sync account data;
- run connector jobs;
- update rates;
- evaluate automation rules;
- dispatch notifications;
- retry failed jobs;
- write execution logs.

### Telegram Worker

Telegram should be separated from the main API because it has different lifecycle concerns:

- long-lived MTProto sessions;
- phone/code/2FA flows;
- reconnection;
- flood limits;
- message stream processing;
- parser management;
- per-account session storage.

Initial implementation can live inside `apps/worker`, but code boundaries should make it easy to split into `apps/telegram-worker`.

## Core Modules

```text
Auth
Users
Workspaces
Platforms
Accounts
Secrets
Connectors
Deals
Orders / Ads
Balances
Rates
Pricing
Automation
Notifications
Audit Logs
Connector Logs
Settings
Exports
```

## Data Flow: Sync Deals

```text
Scheduler
  -> enqueue sync-account job
  -> connector loads encrypted credentials
  -> connector fetches remote deals
  -> normalizer maps platform data to P2PHunt DTOs
  -> API/worker upserts deals
  -> audit/sync log written
  -> WebSocket emits deal.created/deal.updated
  -> rules may evaluate
  -> notifications may dispatch
```

## Data Flow: Rate Update

```text
Rate scheduler
  -> fetch source rates
  -> validate freshness
  -> choose source by priority/fallback
  -> persist rate tick
  -> recompute derived prices/markups
  -> emit rate.updated
  -> automation rules may run
```

## Data Flow: Manual Action

```text
User clicks action
  -> API validates permissions and account mode
  -> command stored as pending
  -> job enqueued
  -> connector executes command
  -> result persisted
  -> audit log written
  -> UI receives command status
```

## Manual vs Auto Mode

Modes should exist at multiple levels:

- workspace mode;
- account mode;
- connector mode;
- rule mode.

Example:

```text
Workspace: Manual
Account Binance #1: Auto enabled
Rule update-prices: Enabled
Result: no auto write actions because workspace is Manual
```

Global manual mode must override all lower-level auto settings.

## Event Model

Internal events should be typed and versioned.

Examples:

- `account.created`;
- `account.sync_started`;
- `account.sync_finished`;
- `account.sync_failed`;
- `deal.created`;
- `deal.updated`;
- `balance.updated`;
- `rate.updated`;
- `ad.updated`;
- `rule.triggered`;
- `rule.executed`;
- `notification.created`;
- `connector.command_failed`.

## Package Boundaries

### `packages/shared`

Contains:

- DTO schemas;
- event types;
- enums;
- shared Zod schemas;
- API route contract helpers if used.

Must not contain:

- database code;
- connector secrets;
- platform SDK clients;
- UI components.

### `packages/connectors`

Contains:

- connector interfaces;
- capability registry;
- mock connector;
- platform-specific adapters;
- normalization helpers.

Must not depend on frontend.

### `apps/api`

Owns:

- HTTP/API boundary;
- auth;
- permissions;
- Prisma service;
- WebSocket gateway;
- command authorization.

### `apps/worker`

Owns:

- queue processors;
- scheduled jobs;
- connector execution;
- rule execution.

## Deployment Shape

Development:

```text
web
api
worker
postgres
redis
```

Production:

```text
nginx / load balancer
web static assets
api replicas
worker replicas by queue
postgres managed or self-hosted
redis managed or self-hosted
object storage
monitoring
```

## Architectural Risks

- Telegram integrations may be fragile and may violate service terms depending on behavior.
- Some P2P APIs may not expose all required actions.
- High-frequency rate updates can overload APIs or hit limits.
- Automation can cause financial loss if rules are wrong.
- Multi-account Telegram sessions require careful session storage and recovery.

## Architectural Decisions For Now

- Use NestJS for modular backend structure.
- Use Prisma for schema and migrations.
- Use Redis/BullMQ for background work.
- Use Socket.IO for live UI events.
- Use a mock connector before real integrations.
- Treat money-moving actions as disabled until explicitly designed and tested.
