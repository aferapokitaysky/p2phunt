# Product Specification

## Name

P2PHunt.

## One-Line Definition

P2PHunt is a unified web workspace for P2P traders to monitor accounts, deals, balances, rates, ads, automation rules, and notifications across many platforms from one control panel.

## Product Positioning

P2PHunt should feel like an operations system for a P2P trader, not a simple analytics dashboard.

The product combines:

- OMS: order/deal management.
- CRM: counterparty and deal context.
- Treasury view: balances across platforms.
- Rate desk: fast rate tracking and markup rules.
- Automation platform: event-driven rules for routine actions.
- Monitoring center: logs, errors, notifications, and sync health.

## Primary User

The first product version is built for one serious P2P trader who may operate many accounts and services.

Later versions can become SaaS for:

- solo traders;
- small P2P teams;
- operators working under a manager;
- account farms or grouped trading setups;
- agencies managing liquidity and ads across several platforms.

## Problems To Solve

P2P traders often work across multiple places at once:

- Binance P2P;
- Bybit P2P;
- OKX P2P;
- KuCoin;
- CryptoBot;
- xRocket;
- Telegram Wallet / Wallet;
- other Telegram or web-based wallets.

This creates several operational problems:

- The trader constantly switches between apps, bots, websites, and accounts.
- Deals are scattered and hard to compare.
- Balances are fragmented.
- Rate changes require manual recalculation.
- Ads and offers become stale.
- Profit is hard to calculate across services.
- Automation is either missing or risky.
- Telegram bot integrations are non-trivial because Telegram Bot API cannot read other bots.
- There is no central audit trail of what changed and why.

## Core Value

P2PHunt should make the trader feel that all P2P work is happening inside one cockpit:

- all accounts visible;
- all deals searchable;
- all balances aggregated;
- all rates centralized;
- all ads controllable where integration allows it;
- all automation explicit and auditable;
- all risky actions protected by modes, confirmations, limits, and logs.

## Product Principles

- Connector-first: every platform is an adapter with declared capabilities.
- Money-safe by default: read-only first, writes second, automation third.
- Operator clarity: every account, action, source, status, and error must be visible.
- Fast scanning: tables and filters matter more than marketing-style UI.
- Manual and Auto modes must be obvious.
- Automation must be explainable: why a rule ran, what data it used, what changed.
- Integrations determine real scope; avoid promising actions until proven by R&D.

## Supported Platform Categories

### Official API Platforms

Examples:

- Binance;
- Bybit;
- OKX;
- KuCoin.

Expected capabilities depend on each platform's real API:

- sync balances;
- sync P2P deals/orders;
- read ads;
- update ads;
- read rates;
- create/cancel/update operations if available;
- transfer if available and explicitly enabled.

### Telegram-Based Services

Examples:

- CryptoBot;
- xRocket;
- Telegram Wallet;
- other wallet bots.

These require Telegram Client API / MTProto, not Telegram Bot API, if we need to read bot dialogs and interact as a user.

### Web-Only / Unofficial Services

Possible techniques:

- official hidden/private API research;
- Playwright automation;
- manual import;
- webhook/import if the service supports it.

These are high-risk and should not be in the first production-critical scope.

## Key User Stories

- As a trader, I want to connect multiple accounts so I can see everything in one place.
- As a trader, I want to tag accounts so I can separate regions, strategies, wallets, and risk levels.
- As a trader, I want one deal table so I do not need to open every platform.
- As a trader, I want aggregated balances so I know where my liquidity is.
- As a trader, I want fast rates and custom markups so I can price consistently.
- As a trader, I want notifications for new deals, balance issues, errors, and executed rules.
- As a trader, I want manual mode so nothing changes without my action.
- As a trader, I want auto mode so trusted rules can perform repetitive work.
- As a future SaaS owner, I want multi-user roles so operators can work with limited permissions.
- As a developer, I want connector capabilities so new services can be added cleanly.

## Success Metrics

For MVP:

- User can create and manage connected accounts.
- User can see unified deals and balances.
- User can configure rates and markups.
- User can receive Telegram/web notifications.
- At least one connector works with real API data or a realistic mocked connector.
- Sync jobs, errors, and audit logs are visible.

For production:

- Deal sync latency under a target threshold per connector.
- Rate updates stable at configured intervals.
- No silent automation actions; every action has an execution log.
- Secrets are encrypted at rest.
- Failed jobs are retryable and visible.
- User can disable all automation instantly.

## Non-Goals For Early MVP

- Full money-moving automation.
- Reverse engineering many services at once.
- Complex team billing.
- Visual n8n-style editor from day one.
- Mobile app.
- Guaranteed support for every Telegram wallet before R&D.
