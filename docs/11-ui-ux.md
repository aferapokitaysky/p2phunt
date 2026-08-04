# UI / UX Specification

## Product Feel

P2PHunt should feel like a professional trading operations tool:

- dense but clean;
- fast to scan;
- calm visual design;
- strong tables and filters;
- clear status indicators;
- no marketing-style landing screen as the main app.

## Main Navigation

Recommended sections:

- Dashboard;
- Deals;
- Accounts;
- Balances;
- Ads;
- Rates;
- Automation;
- Notifications;
- Logs;
- Settings.

## Dashboard

Purpose:

Show the current health of the trader's whole operation.

Widgets:

- total balance by selected fiat valuation;
- active deals;
- profit today;
- profit month;
- open ads;
- connector errors;
- recent notifications;
- recent rate changes;
- automation status;
- accounts requiring attention.

Important:

Dashboard should lead to action. Every card should click into a filtered table.

## Deals Page

The deals page is the main workspace.

Table columns:

- date/time;
- platform;
- account;
- side;
- crypto;
- fiat;
- crypto amount;
- fiat amount;
- price;
- fee;
- profit;
- counterparty;
- status;
- source;
- comment;
- actions.

Filters:

- account;
- platform;
- group;
- tag;
- side;
- crypto asset;
- fiat asset;
- status;
- date range;
- amount range;
- profit range;
- search by counterparty/external id.

Expected interactions:

- save filter presets;
- column visibility;
- sort;
- export;
- open deal drawer;
- add comment/tag;
- inspect raw source payload if permission allows.

## Accounts Page

Account list fields:

- name;
- platform;
- group;
- tags;
- mode;
- status;
- total balance;
- active deals;
- open ads;
- last sync;
- last error.

Account detail tabs:

- overview;
- balances;
- deals;
- ads;
- connector settings;
- logs;
- secrets/auth;
- automation.

## Balances Page

Views:

- grouped by asset;
- grouped by account;
- grouped by platform;
- valuation in selected fiat.

Example:

```text
USDT
  Binance #1     1500
  CryptoBot Main 450
  xRocket UA     700
  Total          2650
```

Actions:

- refresh balances;
- export;
- set balance alert;
- open account detail.

## Ads Page

Columns:

- platform;
- account;
- side;
- crypto;
- fiat;
- current price;
- calculated price;
- markup;
- min limit;
- max limit;
- available amount;
- status;
- last update;
- actions.

Actions:

- update price;
- enable;
- disable;
- bulk update;
- preview pricing.

Safety:

- bulk write actions require preview and confirmation;
- auto-mode actions should show rule source.

## Rates Page

Views:

- current rates;
- source comparison;
- history chart;
- markups;
- freshness;
- source errors.

Controls:

- pair selector;
- source priority;
- refresh interval;
- manual override;
- markup editor.

## Automation Page

MVP:

- list rules;
- create/edit rule using forms and JSON preview;
- enable/disable rule;
- dry-run test;
- view executions;
- emergency stop.

Later:

- visual builder;
- templates;
- historical simulation.

Rule list columns:

- enabled;
- name;
- trigger;
- actions;
- last execution;
- status;
- failures;
- mode.

## Notifications Page

Features:

- in-app notification list;
- severity filters;
- unread/read;
- channel status;
- test notification channel.

## Logs Page

Tabs:

- audit logs;
- connector logs;
- sync jobs;
- automation executions;
- system events.

Filters:

- account;
- platform;
- connector;
- entity type;
- severity;
- date range.

## Settings

Sections:

- profile;
- workspace;
- security;
- API keys/secrets;
- notification channels;
- rate sources;
- integrations;
- export/import;
- danger zone.

## Visual Style Direction

Use a restrained operational style:

- dark/light ready;
- strong contrast;
- compact tables;
- clear colored status chips;
- account color markers;
- icons for actions;
- no oversized hero areas inside the app.

## Empty States

Examples:

- no accounts connected;
- no deals synced;
- connector needs credentials;
- rate source failed;
- automation disabled.

Empty states should suggest the next concrete action.

## Critical UX Requirements

- User must always see whether system is in Manual or Auto.
- Automation emergency stop must be visible.
- Connector errors must not be buried.
- Destructive or money-moving actions require confirmation.
- Tables must be fast and filterable.
- Every external action should show pending/running/succeeded/failed state.
