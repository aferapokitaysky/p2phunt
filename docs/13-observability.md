# Observability

## Goal

The trader must understand what P2PHunt is doing at all times, especially when connectors or automation run.

## Log Types

### Audit Logs

Business/security changes:

- user changed account mode;
- rule enabled;
- ad update command created;
- secret rotated.

### Connector Logs

Integration behavior:

- sync started;
- sync succeeded;
- sync failed;
- API returned rate limit;
- parser failed;
- command executed.

### Job Logs

Worker lifecycle:

- queued;
- running;
- retrying;
- failed;
- completed.

### System Logs

Infrastructure/application events:

- database connection issue;
- Redis connection issue;
- websocket errors;
- unexpected exceptions.

## Metrics

Important metrics:

- sync duration by connector;
- sync failure rate;
- API error count by connector;
- queue depth;
- job retries;
- WebSocket connected clients;
- notification delivery failures;
- rule executions per hour;
- blocked automation actions;
- rate source freshness;
- rate source failures.

## Alerts

Initial alerts:

- connector failure repeated;
- rate source stale;
- automation action failed;
- queue backlog high;
- database unavailable;
- Redis unavailable;
- secret decryption failed;
- Telegram session reauth required.

## UI Monitoring

Visible in app:

- account sync health;
- last sync time;
- last error;
- connector status;
- rate source freshness;
- automation execution history;
- failed jobs with retry button.

## Correlation IDs

Every external command should have:

- command id;
- job id;
- account id;
- connector slug;
- audit log id;
- event id.

This makes debugging possible across API, worker, and UI.

## Sentry

Use Sentry for:

- frontend errors;
- API exceptions;
- worker exceptions.

Never send secrets in Sentry metadata.

## Prometheus / Grafana

Later production stack:

- API metrics endpoint;
- worker metrics endpoint;
- Redis metrics;
- PostgreSQL metrics;
- connector dashboards.

## Log Retention

Suggested:

- audit logs: long term;
- connector logs: 90 days;
- job logs: 30-90 days;
- rate raw ticks: downsample after short window;
- notification logs: 90 days.
