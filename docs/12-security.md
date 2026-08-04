# Security And Risk

## Security Importance

P2PHunt handles trading accounts, API keys, Telegram sessions, balances, deals, and potentially money-moving actions.

Security must be part of MVP, not an afterthought.

## Secrets

Secrets include:

- exchange API keys;
- exchange API secrets;
- Telegram session strings;
- Telegram 2FA auth state;
- webhook tokens;
- notification bot tokens.

Rules:

- encrypt at rest;
- never return secret values through API;
- mask values in UI and logs;
- support rotation;
- support deletion;
- record audit logs for secret changes.

## Encryption

Development:

- use an environment encryption key.

Production:

- use KMS/Vault/envelope encryption.

Secret record should store:

- encrypted payload;
- key version;
- created date;
- rotated date;
- status.

## API Key Permissions

Encourage least privilege:

- read-only keys for early setup;
- separate keys for write actions;
- IP whitelist where possible;
- transfers disabled by default.

## Auth

MVP:

- email/password;
- password hashing with Argon2 or bcrypt;
- JWT access token;
- refresh token rotation.

Later:

- 2FA;
- Telegram login;
- Google login;
- team roles;
- session management UI.

## Authorization

Permission model should support:

- owner;
- admin;
- trader;
- operator;
- viewer.

Initial app can implement owner-only, but API should be ready to check permissions.

## Audit Logs

Log:

- account creation/update/delete;
- secret creation/rotation/delete;
- mode changes;
- connector commands;
- automation rule changes;
- automation executions;
- bulk actions;
- login/logout/security events.

Audit logs should be append-only.

## Automation Safety

Required:

- global emergency stop;
- workspace Manual/Auto mode;
- account Manual/Auto mode;
- per-rule enabled switch;
- dry-run testing;
- cooldowns;
- max action limits;
- confirmation for risky actions;
- execution logs.

## High-Risk Actions

These are not MVP:

- transfer crypto;
- confirm payment;
- release assets;
- create large batches of ads;
- change many prices without preview.

When introduced, they need:

- dedicated permissions;
- stronger confirmation;
- limits;
- alerting;
- rollback/compensating strategy where possible.

## Telegram Risks

Risks:

- session theft;
- account lockouts;
- flood limits;
- ToS restrictions;
- parsing mistakes;
- accidental bot interactions.

Controls:

- encrypted session storage;
- session delete action;
- flood wait handling;
- message send disabled by default;
- parser confidence thresholds;
- manual approval for actions.

## Data Privacy

Potential sensitive data:

- counterparties;
- payment details;
- chat text;
- balances;
- transaction ids.

Rules:

- avoid logging full payment details;
- mask counterparties where possible in general logs;
- restrict raw payload access;
- provide export/delete paths later for SaaS compliance.

## Rate Limiting

API should protect:

- login;
- credential validation;
- connector sync;
- manual commands;
- exports;
- webhook endpoints.

## Incident Response Basics

MVP should support:

- disable account;
- delete credentials;
- emergency stop automation;
- inspect recent commands;
- inspect recent logins;
- revoke refresh sessions.
