# P2PHunt Documentation Index

P2PHunt is a web SaaS platform for P2P traders who manage many accounts across exchanges, Telegram wallets, bots, and future services.

The documentation is split into focused documents so the project can evolve without one huge unreadable specification.

## Documents

- [01-product.md](/Users/korova/Desktop/p2p/docs/01-product.md) - product vision, users, problems, scope, success metrics.
- [02-mvp.md](/Users/korova/Desktop/p2p/docs/02-mvp.md) - MVP scope, phased delivery, what is intentionally excluded.
- [03-architecture.md](/Users/korova/Desktop/p2p/docs/03-architecture.md) - system architecture, services, package layout, data flow.
- [04-domain-model.md](/Users/korova/Desktop/p2p/docs/04-domain-model.md) - core entities, statuses, enums, lifecycle rules.
- [05-database.md](/Users/korova/Desktop/p2p/docs/05-database.md) - PostgreSQL/Prisma schema design and indexing notes.
- [06-api.md](/Users/korova/Desktop/p2p/docs/06-api.md) - REST API, WebSocket events, request/response contracts.
- [07-connectors.md](/Users/korova/Desktop/p2p/docs/07-connectors.md) - connector model, capabilities, official API integrations.
- [08-telegram-rd.md](/Users/korova/Desktop/p2p/docs/08-telegram-rd.md) - Telegram MTProto research plan and parsing strategy.
- [09-automation.md](/Users/korova/Desktop/p2p/docs/09-automation.md) - manual/auto modes, rule engine, actions, safeguards.
- [10-rates-pricing.md](/Users/korova/Desktop/p2p/docs/10-rates-pricing.md) - rates, fiat/crypto pairs, markups, price calculation.
- [11-ui-ux.md](/Users/korova/Desktop/p2p/docs/11-ui-ux.md) - screens, workflows, dashboard, tables, controls.
- [12-security.md](/Users/korova/Desktop/p2p/docs/12-security.md) - secrets, sessions, encryption, audit, risk controls.
- [13-observability.md](/Users/korova/Desktop/p2p/docs/13-observability.md) - logs, metrics, tracing, alerts, job monitoring.
- [14-deployment.md](/Users/korova/Desktop/p2p/docs/14-deployment.md) - Docker, environments, CI/CD, production shape.
- [15-roadmap.md](/Users/korova/Desktop/p2p/docs/15-roadmap.md) - implementation roadmap and milestones.
- [imported-chat-transcript.md](/Users/korova/Desktop/p2p/docs/imported-chat-transcript.md) - recovered source chat context.

## Guiding Decisions

- Build as `core + connectors`, not as one hardcoded integration.
- Start read-only, then manual write actions, then guarded automation.
- Treat Telegram integrations as a separate R&D track.
- Every external service integration must declare explicit capabilities.
- Keep audit logs from day one because this is money-moving software.
