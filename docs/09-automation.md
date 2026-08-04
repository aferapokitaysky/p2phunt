# Automation Engine

## Purpose

Automation is one of P2PHunt's main differentiators.

It should let traders define rules like:

```text
When a rate changes
and the change is greater than 0.25%
then update selected ads
and send a Telegram notification
```

## Modes

### Manual

No automatic write actions.

Allowed:

- sync;
- notifications;
- analytics;
- dry-run rule evaluation.

Blocked:

- update ads;
- enable/disable ads;
- transfers;
- confirmations;
- any connector write command.

### Auto

Rules may execute allowed actions if:

- workspace mode permits;
- account mode permits;
- connector capability supports action;
- rule is enabled;
- guards pass;
- cooldown allows it.

## Rule Shape

```json
{
  "trigger": {},
  "conditions": [],
  "actions": [],
  "guards": {}
}
```

## Triggers

Initial triggers:

- `rate.changed`;
- `deal.created`;
- `deal.updated`;
- `balance.updated`;
- `balance.low`;
- `ad.out_of_balance`;
- `connector.sync_failed`;
- `connector.command_failed`;
- `time.schedule`.

Later triggers:

- `profit.threshold_reached`;
- `spread.opportunity_detected`;
- `counterparty.repeat_detected`;
- `ad.stale`;
- `market.volatility_high`.

## Conditions

Operators:

- `eq`;
- `neq`;
- `gt`;
- `gte`;
- `lt`;
- `lte`;
- `in`;
- `not_in`;
- `contains`;
- `changed_by_percent`;
- `changed_by_amount`.

Example:

```json
{
  "field": "rate.changePercent",
  "operator": "gte",
  "value": "0.25"
}
```

## Actions

Safe initial actions:

- create notification;
- send Telegram notification;
- send webhook;
- create internal log/task;
- refresh account;
- calculate recommended price.

Manual-write actions:

- update ad price;
- enable ad;
- disable ad;
- update ad limits.

High-risk future actions:

- send crypto;
- confirm payment;
- release assets;
- create new ads automatically.

## Guards

Every rule can have safeguards:

- dry-run;
- max executions per hour;
- cooldown seconds;
- max price change percent;
- allowed accounts;
- denied accounts;
- allowed assets;
- minimum balance after action;
- require confirmation above amount;
- block during connector degraded state.

## Execution Flow

```text
event
  -> load candidate rules
  -> check enabled
  -> check global/workspace/account mode
  -> evaluate conditions
  -> evaluate guards
  -> create execution record
  -> run actions sequentially or as configured
  -> persist action results
  -> emit rule.executed
```

## Dry Run

Dry run should show:

- trigger input;
- matched conditions;
- skipped conditions;
- planned actions;
- computed prices;
- blocked reasons;
- expected connector commands.

Dry run is essential before enabling auto mode.

## Rule Examples

### Notify New Big Deal

```json
{
  "name": "Notify new big USDT deal",
  "trigger": { "type": "deal.created" },
  "conditions": [
    { "field": "deal.cryptoAsset", "operator": "eq", "value": "USDT" },
    { "field": "deal.fiatAmount", "operator": "gte", "value": "10000" }
  ],
  "actions": [
    { "type": "notification.send", "channel": "telegram" }
  ]
}
```

### Disable Ads When Balance Is Low

```json
{
  "name": "Disable USDT ads below 500",
  "trigger": { "type": "balance.updated" },
  "conditions": [
    { "field": "balance.asset", "operator": "eq", "value": "USDT" },
    { "field": "balance.availableAmount", "operator": "lt", "value": "500" }
  ],
  "actions": [
    { "type": "ad.disable", "selector": { "asset": "USDT" } },
    { "type": "notification.send", "channel": "telegram" }
  ],
  "guards": {
    "cooldownSeconds": 300
  }
}
```

### Recalculate Price On Rate Change

```json
{
  "name": "Reprice UAH USDT ads",
  "trigger": { "type": "rate.changed" },
  "conditions": [
    { "field": "rate.baseAsset", "operator": "eq", "value": "USDT" },
    { "field": "rate.quoteAsset", "operator": "eq", "value": "UAH" },
    { "field": "rate.changePercent", "operator": "gte", "value": "0.25" }
  ],
  "actions": [
    { "type": "price.calculate" },
    { "type": "ad.update_price", "mode": "manual_approval" }
  ],
  "guards": {
    "maxPriceChangePercent": "1.5",
    "cooldownSeconds": 60
  }
}
```

## UI Evolution

MVP:

- JSON-like advanced editor;
- simple form presets;
- dry-run preview.

Later:

- visual builder;
- templates;
- version history;
- simulation on historical data.

## Safety Requirements

- Global emergency stop.
- Per-rule disable switch.
- Per-account auto/manual mode.
- Every execution logged.
- Every connector write command logged.
- Bulk write preview before execution.
- High-risk actions disabled by default.
