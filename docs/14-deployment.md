# Deployment

## Environments

### Local

Services:

- web;
- api;
- worker;
- PostgreSQL;
- Redis.

Use Docker Compose for infrastructure and local package scripts for app development.

### Staging

Production-like environment for:

- connector testing;
- webhook testing;
- Telegram session testing;
- migrations;
- UI QA.

### Production

Should include:

- HTTPS;
- environment secrets;
- database backups;
- Redis persistence strategy;
- monitoring;
- error tracking;
- CI/CD.

## Docker Compose

Initial services:

```text
postgres
redis
api
worker
web
```

Optional later:

```text
telegram-worker
nginx
prometheus
grafana
minio
```

## Environment Variables

Examples:

```text
DATABASE_URL=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ENCRYPTION_KEY=
WEB_ORIGIN=
API_PORT=
SENTRY_DSN=
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
```

## CI/CD

GitHub Actions pipeline:

- install dependencies;
- lint;
- typecheck;
- test;
- Prisma generate;
- build packages;
- build Docker images;
- run migrations in controlled deployment step.

## Database Migrations

Rules:

- migrations committed to repo;
- never auto-reset production database;
- backup before risky migrations;
- test migrations in staging.

## Backups

Back up:

- PostgreSQL;
- encrypted secret data;
- object storage if used;
- environment secret key material through secure external system.

Without encryption keys, database backups cannot restore connector access.

## Production Topology

```text
Load balancer / Nginx
  -> web static assets
  -> api replicas
  -> websocket gateway
workers
  -> connector queue
  -> rate queue
  -> notification queue
  -> automation queue
PostgreSQL
Redis
Object storage
Monitoring
```

## Scaling

Scale by queue:

- rate workers;
- connector sync workers;
- notification workers;
- automation workers.

Telegram workers may need sticky session ownership per Telegram account.

## Release Strategy

Start with:

- local-only;
- then private VPS staging;
- then invite-only production.

Avoid public SaaS launch until:

- integrations are proven;
- security review is done;
- automation safeguards are tested;
- legal/ToS risks are understood.
