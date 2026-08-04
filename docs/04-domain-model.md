# Domain Model

## Core Concepts

### Workspace

A workspace represents one trader or one trading organization.

MVP can have one workspace per user, but the domain should be ready for SaaS.

### User

A person who logs into P2PHunt.

Initial roles:

- `owner`;
- `admin`;
- `trader`;
- `operator`;
- `viewer`.

MVP can implement only owner, but data model should not block roles later.

### Platform

A known external service type.

Examples:

- `binance`;
- `bybit`;
- `okx`;
- `kucoin`;
- `cryptobot`;
- `xrocket`;
- `telegram_wallet`;
- `mock`.

### Connector

Code adapter that can communicate with a platform.

A connector exposes:

- platform id;
- display name;
- supported auth methods;
- capabilities;
- sync methods;
- command methods.

### Account

A connected service account, for example:

- Binance #1;
- CryptoBot Main;
- Rocket UA;
- Wallet VIP.

Fields:

- workspace;
- platform;
- connector;
- display name;
- color;
- tags;
- group;
- status;
- mode;
- credentials reference;
- last sync time;
- last error.

### Credential / Secret

Encrypted data used to connect to an external platform.

Examples:

- API key;
- API secret;
- Telegram session string;
- phone authorization state;
- webhook token.

Secrets must never be returned directly to the frontend.

### Deal

A unified representation of a P2P transaction, regardless of platform.

Fields:

- platform deal id;
- account id;
- type: buy/sell;
- crypto asset;
- fiat asset;
- crypto amount;
- fiat amount;
- price;
- fee;
- profit;
- counterparty;
- status;
- timestamps;
- raw payload reference.

### Ad / Order

A P2P advertisement or open offer controlled through a platform.

Fields:

- platform ad id;
- account id;
- type: buy/sell;
- crypto asset;
- fiat asset;
- price;
- min limit;
- max limit;
- available amount;
- status;
- markup rule;
- last update status.

Naming note:

- Some platforms call these ads.
- Some call them orders.
- Internally use `Ad` for visible P2P advertisements and `Deal` for matched transactions.

### Balance

Current amount of an asset on an account.

Fields:

- account id;
- asset;
- available amount;
- locked amount;
- total amount;
- valuation currency;
- updated at.

### Rate

A price quote for an asset pair from a specific source.

Fields:

- base asset;
- quote asset;
- source;
- bid;
- ask;
- mid;
- timestamp;
- freshness;
- raw payload.

### Markup

Pricing adjustment applied to rates.

Scopes:

- global;
- platform;
- account;
- ad.

Types:

- percent;
- fixed amount;
- spread-based;
- side-specific buy/sell.

### Rule

Automation definition:

```text
Trigger -> Conditions -> Actions
```

Rule fields:

- name;
- enabled;
- mode;
- trigger;
- conditions;
- actions;
- safeguards;
- cooldown;
- last execution;
- owner.

### Notification

Message shown in app, Telegram, webhook, email, or future channels.

### Audit Log

Immutable record of important changes and actions.

## Statuses

### Account Status

- `draft`;
- `connecting`;
- `active`;
- `disabled`;
- `error`;
- `reauth_required`;
- `archived`.

### Deal Status

Generic statuses:

- `new`;
- `pending`;
- `payment_pending`;
- `paid`;
- `appeal`;
- `completed`;
- `cancelled`;
- `expired`;
- `failed`;
- `unknown`.

Each connector maps platform-native statuses into these generic statuses and stores the original status separately.

### Ad Status

- `active`;
- `paused`;
- `disabled`;
- `out_of_balance`;
- `updating`;
- `error`;
- `unknown`.

### Job Status

- `queued`;
- `running`;
- `succeeded`;
- `failed`;
- `retrying`;
- `cancelled`.

### Rule Execution Status

- `dry_run`;
- `skipped`;
- `succeeded`;
- `failed`;
- `blocked_by_mode`;
- `blocked_by_guard`;
- `cooldown`.

## Entity Relationships

```text
Workspace
  -> Users
  -> Accounts
      -> Credentials
      -> Deals
      -> Ads
      -> Balances
      -> Connector Logs
  -> Rate Sources
      -> Rate Ticks
  -> Markup Rules
  -> Automation Rules
      -> Rule Executions
  -> Notifications
  -> Audit Logs
```

## Lifecycles

### Account Connection

```text
draft
  -> connecting
  -> active
  -> error
  -> reauth_required
  -> disabled
```

### Deal Sync

```text
remote payload
  -> normalized DTO
  -> upsert deal
  -> status transition
  -> balance refresh
  -> rule evaluation
  -> notification
```

### Automation Execution

```text
event arrives
  -> find enabled rules
  -> check workspace/account mode
  -> evaluate conditions
  -> check guards/cooldown
  -> execute actions
  -> log every step
  -> emit result
```

## Raw Payload Storage

For every connector-imported entity, store:

- normalized fields for app usage;
- raw payload for debugging;
- source timestamp;
- sync job id;
- connector version.

This is critical because external APIs change and normalized mapping bugs are inevitable.
