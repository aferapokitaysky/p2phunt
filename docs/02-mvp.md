# MVP Scope

## MVP Goal

Build a usable web product foundation for P2PHunt where a trader can manage accounts, view unified deals, track balances, configure rates/markups, receive notifications, and inspect sync/audit logs.

The MVP must prove the architecture before attempting broad automation.

## MVP Strategy

The safest path is:

1. Build the platform core.
2. Add a mock connector for complete UI/backend development.
3. Add one official API connector.
4. Add Telegram R&D separately.
5. Add controlled write actions.
6. Add automation once data and actions are reliable.

## Phase 0 - Repository Foundation

Deliverables:

- Monorepo structure.
- TypeScript setup.
- Docker Compose for PostgreSQL and Redis.
- Shared types package.
- API health checks.
- Basic frontend shell.
- Prisma setup.
- Environment examples.
- CI placeholder.

Recommended structure:

```text
apps/
  api/
  web/
  worker/
packages/
  shared/
  connectors/
docs/
```

## Phase 1 - Core Read Model

Features:

- Auth: email/password for one user initially.
- Accounts CRUD.
- Account tags, colors, notes, groups.
- Platforms registry.
- Deals table.
- Balances table.
- Rates table.
- Dashboard summary.
- Audit logs.
- Sync logs.
- Mock connector.

Why mock connector first:

- It lets frontend, backend, DB, jobs, and WebSockets mature before fighting external APIs.
- It gives predictable data for testing.
- It lets the product feel real while integrations are still being researched.

## Phase 2 - Rate Service

Features:

- Rate sources.
- Asset/fiat pairs.
- Source priority.
- Refresh interval.
- Last rate snapshot.
- Rate history.
- Basic fallback.
- Manual override.
- Markup configuration.

MVP pair examples:

- USDT/UAH;
- USDT/RUB;
- USDT/USD;
- BTC/USD;
- ETH/USD;
- TON/USD.

Rate updates should publish events:

- `rate.updated`;
- `rate.source.failed`;
- `rate.fallback.used`.

## Phase 3 - First Real Connector

Pick one platform only.

Preferred order:

1. Binance/Bybit/OKX if official P2P API capabilities are available for required operations.
2. Read-only exchange account data if P2P write API is limited.
3. CryptoBot/xRocket only after Telegram R&D.

Minimum connector deliverables:

- connect credentials;
- validate credentials;
- sync profile;
- sync balances;
- sync deals or equivalent orders;
- write connector logs;
- expose capability matrix.

## Phase 4 - Notifications

Channels:

- in-app notifications;
- Telegram notifications through our own notification bot;
- webhook notification.

Events:

- new deal;
- deal updated;
- balance below threshold;
- rate changed;
- connector sync failed;
- rule executed;
- secret/credential issue.

## Phase 5 - Manual Actions

Manual means the user presses a button and P2PHunt sends a command through a connector.

Examples:

- refresh account;
- update ad price;
- disable ad;
- enable ad;
- retry failed sync;
- export deals.

Every manual action must create:

- audit log;
- connector command log;
- visible success/failure result.

## Phase 6 - Basic Automation

Only after manual actions are reliable.

MVP automation:

- enable/disable per account;
- global emergency stop;
- simple JSON rules;
- limited triggers;
- dry-run mode;
- execution logs.

Initial triggers:

- `rate.changed`;
- `deal.created`;
- `balance.changed`;
- `balance.low`;
- `connector.sync_failed`.

Initial actions:

- notify;
- webhook;
- create internal task/log;
- refresh account;
- update ad price only after safe connector testing.

## Explicitly Excluded From MVP

- Automatic crypto transfers.
- Automatic payment confirmation.
- High-frequency trading loops.
- Mass connector support.
- Visual rule builder.
- Multi-tenant billing.
- Complex team roles.
- Mobile application.
- Browser automation against financial websites without research.

## MVP Acceptance Criteria

- A user can sign in.
- A user can create accounts and group/tag them.
- A user can see dashboard totals.
- A user can inspect deals and balances.
- A user can configure rate sources and markups.
- A mock connector can generate repeatable account/deal/balance/rate data.
- Jobs run through Redis/BullMQ.
- WebSocket updates are visible in the frontend.
- Audit logs record account, connector, and manual actions.
- Secrets are not stored as plaintext.
