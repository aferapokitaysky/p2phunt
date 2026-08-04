# Database Design

## Database Stack

- PostgreSQL as primary database.
- Prisma as ORM and migration tool.
- Redis for queues, locks, rate cache, and ephemeral job state.

## Design Principles

- Use UUID primary keys.
- Store monetary/crypto values as decimal, not float.
- Store original external ids.
- Store raw connector payloads as JSONB for traceability.
- Keep audit logs append-only.
- Index high-cardinality filters used by tables.
- Keep secrets encrypted and separated from visible account records.

## Core Tables

### `users`

Fields:

- `id`;
- `email`;
- `password_hash`;
- `display_name`;
- `status`;
- `created_at`;
- `updated_at`;

### `workspaces`

Fields:

- `id`;
- `name`;
- `mode`: `manual` or `auto`;
- `created_at`;
- `updated_at`;

### `workspace_members`

Fields:

- `id`;
- `workspace_id`;
- `user_id`;
- `role`;
- `created_at`;

### `platforms`

Registry of supported platform types.

Fields:

- `id`;
- `slug`;
- `name`;
- `category`: `exchange`, `telegram`, `web`, `mock`;
- `is_enabled`;
- `created_at`;

### `connector_definitions`

Fields:

- `id`;
- `platform_id`;
- `slug`;
- `version`;
- `capabilities` JSONB;
- `auth_methods` JSONB;
- `status`;
- `created_at`;
- `updated_at`;

### `accounts`

Fields:

- `id`;
- `workspace_id`;
- `platform_id`;
- `connector_definition_id`;
- `name`;
- `color`;
- `group_name`;
- `tags` text array or relation;
- `mode`;
- `status`;
- `last_sync_at`;
- `last_error`;
- `created_at`;
- `updated_at`;
- `archived_at`;

Indexes:

- `(workspace_id, status)`;
- `(workspace_id, platform_id)`;
- `(workspace_id, group_name)`;

### `account_secrets`

Fields:

- `id`;
- `account_id`;
- `kind`;
- `encrypted_payload`;
- `encryption_key_version`;
- `status`;
- `created_at`;
- `updated_at`;
- `rotated_at`;

Notes:

- Never expose `encrypted_payload` through API.
- For production, use envelope encryption or an external KMS/Vault.

### `deals`

Fields:

- `id`;
- `workspace_id`;
- `account_id`;
- `platform_id`;
- `external_id`;
- `side`: `buy` or `sell`;
- `crypto_asset`;
- `fiat_asset`;
- `crypto_amount`;
- `fiat_amount`;
- `price`;
- `fee_amount`;
- `fee_asset`;
- `profit_amount`;
- `profit_asset`;
- `counterparty_name`;
- `counterparty_external_id`;
- `status`;
- `external_status`;
- `opened_at`;
- `paid_at`;
- `completed_at`;
- `cancelled_at`;
- `raw_payload` JSONB;
- `last_sync_job_id`;
- `created_at`;
- `updated_at`;

Constraints:

- Unique `(account_id, external_id)` when `external_id` is not null.

Indexes:

- `(workspace_id, opened_at desc)`;
- `(workspace_id, status)`;
- `(workspace_id, platform_id)`;
- `(workspace_id, account_id)`;
- `(workspace_id, crypto_asset, fiat_asset)`;

### `ads`

Fields:

- `id`;
- `workspace_id`;
- `account_id`;
- `platform_id`;
- `external_id`;
- `side`;
- `crypto_asset`;
- `fiat_asset`;
- `price`;
- `min_limit`;
- `max_limit`;
- `available_amount`;
- `status`;
- `external_status`;
- `markup_rule_id`;
- `last_update_at`;
- `raw_payload` JSONB;
- `created_at`;
- `updated_at`;

Constraints:

- Unique `(account_id, external_id)` when `external_id` is not null.

### `balances`

Fields:

- `id`;
- `workspace_id`;
- `account_id`;
- `asset`;
- `available_amount`;
- `locked_amount`;
- `total_amount`;
- `valuation_fiat`;
- `valuation_amount`;
- `raw_payload` JSONB;
- `synced_at`;
- `created_at`;
- `updated_at`;

Constraints:

- Unique `(account_id, asset)`.

Indexes:

- `(workspace_id, asset)`;
- `(workspace_id, account_id)`;

### `rate_sources`

Fields:

- `id`;
- `workspace_id`;
- `slug`;
- `name`;
- `priority`;
- `refresh_interval_ms`;
- `status`;
- `config` JSONB;
- `created_at`;
- `updated_at`;

### `rate_ticks`

Fields:

- `id`;
- `workspace_id`;
- `source_id`;
- `base_asset`;
- `quote_asset`;
- `bid`;
- `ask`;
- `mid`;
- `raw_payload` JSONB;
- `source_timestamp`;
- `created_at`;

Indexes:

- `(workspace_id, base_asset, quote_asset, created_at desc)`;
- `(source_id, base_asset, quote_asset, created_at desc)`;

### `current_rates`

Materialized current rate per pair.

Fields:

- `id`;
- `workspace_id`;
- `base_asset`;
- `quote_asset`;
- `source_id`;
- `bid`;
- `ask`;
- `mid`;
- `selected_by`;
- `updated_at`;

Constraints:

- Unique `(workspace_id, base_asset, quote_asset)`.

### `markup_rules`

Fields:

- `id`;
- `workspace_id`;
- `scope_type`: `global`, `platform`, `account`, `ad`;
- `scope_id`;
- `base_asset`;
- `quote_asset`;
- `side`;
- `markup_type`: `percent`, `fixed`;
- `value`;
- `priority`;
- `enabled`;
- `created_at`;
- `updated_at`;

### `automation_rules`

Fields:

- `id`;
- `workspace_id`;
- `name`;
- `enabled`;
- `trigger` JSONB;
- `conditions` JSONB;
- `actions` JSONB;
- `guards` JSONB;
- `cooldown_seconds`;
- `last_executed_at`;
- `created_at`;
- `updated_at`;

### `rule_executions`

Fields:

- `id`;
- `workspace_id`;
- `rule_id`;
- `trigger_event_id`;
- `status`;
- `input` JSONB;
- `condition_results` JSONB;
- `action_results` JSONB;
- `error`;
- `started_at`;
- `finished_at`;

### `notifications`

Fields:

- `id`;
- `workspace_id`;
- `channel`;
- `title`;
- `body`;
- `severity`;
- `status`;
- `metadata` JSONB;
- `read_at`;
- `created_at`;

### `audit_logs`

Fields:

- `id`;
- `workspace_id`;
- `actor_user_id`;
- `actor_type`;
- `action`;
- `entity_type`;
- `entity_id`;
- `before` JSONB;
- `after` JSONB;
- `metadata` JSONB;
- `created_at`;

Indexes:

- `(workspace_id, created_at desc)`;
- `(workspace_id, entity_type, entity_id)`;

### `connector_sync_jobs`

Fields:

- `id`;
- `workspace_id`;
- `account_id`;
- `connector_slug`;
- `job_type`;
- `status`;
- `started_at`;
- `finished_at`;
- `error`;
- `stats` JSONB;
- `created_at`;

### `connector_logs`

Fields:

- `id`;
- `workspace_id`;
- `account_id`;
- `connector_slug`;
- `level`;
- `message`;
- `metadata` JSONB;
- `created_at`;

## Decimal Handling

Use `Decimal` in Prisma for:

- crypto amounts;
- fiat amounts;
- prices;
- rates;
- fees;
- profits;
- balances.

Never use JavaScript number for final persisted financial calculations.

## Retention

Suggested retention policy:

- deals: permanent;
- balances: current permanent, history configurable;
- rate ticks: high-frequency ticks can be downsampled;
- audit logs: permanent or long retention;
- connector logs: 30-180 days depending on volume;
- raw payloads: keep for MVP, later archive to object storage if large.
