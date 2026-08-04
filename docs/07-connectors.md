# Connectors

## Connector Philosophy

P2PHunt should not hardcode business logic for every platform inside the core API.

Each external service is represented by a connector with explicit capabilities.

The core asks:

- what can this connector do?
- what auth does it need?
- how do we sync data?
- what commands are safe to expose?

## Connector Interface

Initial TypeScript shape:

```ts
export type ConnectorCapability =
  | "profile.read"
  | "balances.read"
  | "deals.read"
  | "ads.read"
  | "ads.update_price"
  | "ads.enable"
  | "ads.disable"
  | "rates.read"
  | "transfer.create"
  | "messages.read"
  | "messages.send";

export interface ConnectorDefinition {
  slug: string;
  platform: string;
  displayName: string;
  version: string;
  capabilities: ConnectorCapability[];
  authMethods: ConnectorAuthMethod[];
}

export interface ConnectorContext {
  accountId: string;
  workspaceId: string;
  credentials: unknown;
  logger: ConnectorLogger;
}

export interface Connector {
  definition: ConnectorDefinition;
  validateCredentials(ctx: ConnectorContext): Promise<ConnectorValidationResult>;
  getProfile(ctx: ConnectorContext): Promise<ConnectorProfile>;
  syncBalances(ctx: ConnectorContext): Promise<BalanceDto[]>;
  syncDeals(ctx: ConnectorContext, cursor?: SyncCursor): Promise<SyncResult<DealDto>>;
  syncAds(ctx: ConnectorContext, cursor?: SyncCursor): Promise<SyncResult<AdDto>>;
  updateAdPrice?(ctx: ConnectorContext, command: UpdateAdPriceCommand): Promise<CommandResult>;
  enableAd?(ctx: ConnectorContext, command: AdCommand): Promise<CommandResult>;
  disableAd?(ctx: ConnectorContext, command: AdCommand): Promise<CommandResult>;
}
```

## Capability Matrix

Example:

| Connector | Profile | Balances | Deals | Ads | Update Ads | Transfers | Messages |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mock | yes | yes | yes | yes | yes | no | no |
| Binance API | research | research | research | research | research | disabled | no |
| Bybit API | research | research | research | research | research | disabled | no |
| OKX API | research | research | research | research | research | disabled | no |
| CryptoBot MTProto | research | possible | possible | unknown | unknown | disabled | yes |
| xRocket MTProto | research | possible | possible | unknown | unknown | disabled | yes |
| Wallet MTProto | research | possible | possible | unknown | unknown | disabled | yes |

Use `research` until verified with real docs or experiments.

## Connector Auth Types

### API Key

Fields:

- key;
- secret;
- passphrase if required;
- restrictions;
- IP whitelist status.

### OAuth

Possible later for services that support it.

### Telegram MTProto

Fields:

- phone number;
- session string;
- api id;
- api hash;
- 2FA status;
- last auth status.

### Manual Import

CSV/XLSX import can be a connector-like source for early testing.

## Sync Rules

Every sync method should:

- be idempotent;
- accept cursor/date range if possible;
- return normalized DTOs;
- include raw payload reference;
- map external statuses;
- report partial failure clearly;
- respect rate limits.

## Normalization

The connector maps platform-specific data into P2PHunt models.

Example:

```text
Binance order id -> Deal.externalId
Binance asset -> Deal.cryptoAsset
Binance fiat -> Deal.fiatAsset
Binance order status -> Deal.status + Deal.externalStatus
```

Never discard external raw status.

## Connector Logs

Log:

- auth validation;
- sync start/finish;
- API rate limits;
- external errors;
- parsing errors;
- command attempts;
- command results.

Do not log:

- raw API secrets;
- full session strings;
- personal documents;
- private payment details unless explicitly needed and masked.

## Mock Connector

The mock connector is required.

It should generate:

- accounts;
- balances;
- deals;
- ads;
- rate-like data;
- random sync failures;
- status changes.

Why:

- frontend can be built before integrations;
- tests can use stable data;
- demo mode becomes possible;
- rule engine can be tested safely.

## Official API Connector Research Checklist

For each exchange:

- Is there official P2P API documentation?
- Can we read P2P ads?
- Can we update P2P ad price?
- Can we enable/disable ads?
- Can we read P2P deals?
- Can we read balance by wallet type?
- Are API keys allowed for P2P operations?
- Are IP whitelists required?
- What are rate limits?
- What permissions are needed?
- Are there regional restrictions?
- Is testnet/sandbox available?
- Are webhooks available?
- What fields are missing and must be derived?

## Connector Safety Levels

### Level 0 - Disabled

Connector exists in registry but cannot be used.

### Level 1 - Read-Only

Can sync profile, balances, deals, rates, ads.

### Level 2 - Manual Write

User can manually trigger supported commands.

### Level 3 - Guarded Automation

Automation can trigger limited commands with rules, cooldowns, limits, and audit logs.

### Level 4 - Money Movement

Transfers and confirmations. This should be treated as a separate security project.

MVP should stop at Level 1 or Level 2.
