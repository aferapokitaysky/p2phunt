# API Specification

## API Style

Use REST for CRUD and commands.

Use WebSocket for live events.

Use JSON request/response bodies.

Use Zod or DTO validators at the boundary.

## Auth

### `POST /auth/register`

Create first user or SaaS user.

### `POST /auth/login`

Returns:

- access token;
- refresh token;
- user;
- workspace.

### `POST /auth/refresh`

Refresh access token.

### `POST /auth/logout`

Revoke refresh token.

### `GET /auth/me`

Return current user and workspace membership.

## Workspaces

### `GET /workspaces/current`

Return active workspace.

### `PATCH /workspaces/current`

Update workspace settings:

- name;
- global mode;
- default currency;
- automation emergency stop.

## Platforms

### `GET /platforms`

Return available platform registry.

### `GET /connectors`

Return connector definitions and capability matrix.

## Accounts

### `GET /accounts`

Query params:

- `platform`;
- `status`;
- `tag`;
- `group`;
- `search`.

### `POST /accounts`

Create account.

Body:

```json
{
  "platform": "binance",
  "connector": "binance-api",
  "name": "Binance #1",
  "color": "#2f80ed",
  "tags": ["UA", "USDT"],
  "groupName": "Main"
}
```

### `GET /accounts/:id`

Return account detail.

### `PATCH /accounts/:id`

Update account metadata and mode.

### `DELETE /accounts/:id`

Archive account.

### `POST /accounts/:id/connect`

Start connector auth flow.

### `POST /accounts/:id/secrets`

Store or rotate encrypted connector credentials.

### `POST /accounts/:id/sync`

Enqueue sync.

### `GET /accounts/:id/sync-jobs`

Return sync history.

## Deals

### `GET /deals`

Query params:

- `platform`;
- `accountId`;
- `side`;
- `status`;
- `cryptoAsset`;
- `fiatAsset`;
- `dateFrom`;
- `dateTo`;
- `amountMin`;
- `amountMax`;
- `profitMin`;
- `profitMax`;
- `tag`;
- `search`;
- `page`;
- `limit`;
- `sort`.

### `GET /deals/:id`

Return deal detail with raw metadata if permission allows.

### `PATCH /deals/:id`

Manual edits:

- comment;
- internal tags;
- manual profit correction;
- internal status override.

### `POST /deals/export`

Export CSV/XLSX.

## Balances

### `GET /balances`

Returns aggregated balances by asset and account.

Query params:

- `asset`;
- `accountId`;
- `platform`;
- `valuationFiat`.

### `GET /balances/summary`

Returns totals for dashboard.

## Ads

### `GET /ads`

Unified ad table.

### `GET /ads/:id`

Ad detail.

### `POST /ads/:id/actions/update-price`

Manual update price.

Body:

```json
{
  "price": "39.75",
  "reason": "manual"
}
```

### `POST /ads/:id/actions/enable`

Enable ad if connector supports it.

### `POST /ads/:id/actions/disable`

Disable ad if connector supports it.

### `POST /ads/bulk-actions/update-prices`

Mass price update. Must require confirmation.

## Rates

### `GET /rates/current`

Return selected current rates.

### `GET /rates/history`

Query params:

- `baseAsset`;
- `quoteAsset`;
- `source`;
- `from`;
- `to`;
- `interval`.

### `POST /rate-sources`

Create source.

### `PATCH /rate-sources/:id`

Update priority, interval, config, status.

### `POST /rates/manual-override`

Set manual rate override.

## Markups

### `GET /markups`

### `POST /markups`

### `PATCH /markups/:id`

### `DELETE /markups/:id`

## Automation

### `GET /automation/rules`

### `POST /automation/rules`

Create rule.

Body:

```json
{
  "name": "Notify on big deal",
  "enabled": true,
  "trigger": {
    "type": "deal.created"
  },
  "conditions": [
    {
      "field": "deal.fiatAmount",
      "operator": "gt",
      "value": "10000"
    }
  ],
  "actions": [
    {
      "type": "notification.send",
      "channel": "telegram"
    }
  ],
  "guards": {
    "dryRun": false
  },
  "cooldownSeconds": 60
}
```

### `PATCH /automation/rules/:id`

### `DELETE /automation/rules/:id`

### `POST /automation/rules/:id/test`

Dry-run rule against sample payload.

### `GET /automation/executions`

Return execution history.

### `POST /automation/emergency-stop`

Disable all automation immediately.

## Notifications

### `GET /notifications`

### `PATCH /notifications/:id/read`

### `POST /notification-channels`

Configure Telegram/webhook/etc.

### `POST /notification-channels/:id/test`

Send test notification.

## Logs

### `GET /audit-logs`

### `GET /connector-logs`

### `GET /jobs`

## WebSocket Events

Namespace:

```text
/workspace
```

Events:

- `deal.created`;
- `deal.updated`;
- `balance.updated`;
- `rate.updated`;
- `ad.updated`;
- `notification.created`;
- `account.sync_started`;
- `account.sync_finished`;
- `account.sync_failed`;
- `rule.executed`;
- `connector.command_updated`.

Event envelope:

```json
{
  "id": "event_uuid",
  "type": "deal.created",
  "workspaceId": "workspace_uuid",
  "occurredAt": "2026-07-30T00:00:00.000Z",
  "version": 1,
  "payload": {}
}
```

## Error Shape

```json
{
  "error": {
    "code": "CONNECTOR_CAPABILITY_NOT_SUPPORTED",
    "message": "This connector cannot update ads.",
    "details": {}
  }
}
```

## Important API Rules

- Every write action must create an audit log.
- Every connector command must return a command/job id.
- Secrets must never be returned.
- Money-moving actions require explicit permission and extra confirmation.
- Bulk actions require preview before execution.
