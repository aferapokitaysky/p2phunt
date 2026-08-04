import type {
  AdDto,
  BalanceDto,
  ConnectorCapability,
  DealDto,
  PlatformCategory,
  RateDto
} from "@p2phunt/shared";

export type ConnectorAuthMethod = "api_key" | "oauth" | "telegram_mtproto" | "manual";

export interface ConnectorDefinition {
  slug: string;
  platform: string;
  platformCategory: PlatformCategory;
  displayName: string;
  version: string;
  capabilities: ConnectorCapability[];
  authMethods: ConnectorAuthMethod[];
  safetyLevel: 0 | 1 | 2 | 3 | 4;
}

export interface ConnectorLogger {
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
}

export interface ConnectorContext {
  workspaceId: string;
  accountId: string;
  credentials?: unknown;
  logger: ConnectorLogger;
}

export interface SyncCursor {
  cursor?: string;
  from?: string;
  to?: string;
}

export interface SyncResult<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface ConnectorProfile {
  externalAccountId: string | null;
  displayName: string | null;
  rawPayload?: unknown;
}

export interface ConnectorValidationResult {
  ok: boolean;
  reason?: string;
}

export interface CommandResult {
  ok: boolean;
  externalCommandId?: string;
  message?: string;
  rawPayload?: unknown;
}

export interface UpdateAdPriceCommand {
  adExternalId: string;
  price: string;
  reason: "manual" | "automation";
}

export interface AdCommand {
  adExternalId: string;
  reason: "manual" | "automation";
}

export interface P2PConnector {
  definition: ConnectorDefinition;
  validateCredentials(ctx: ConnectorContext): Promise<ConnectorValidationResult>;
  getProfile(ctx: ConnectorContext): Promise<ConnectorProfile>;
  syncBalances?(ctx: ConnectorContext): Promise<BalanceDto[]>;
  syncDeals?(ctx: ConnectorContext, cursor?: SyncCursor): Promise<SyncResult<DealDto>>;
  syncAds?(ctx: ConnectorContext, cursor?: SyncCursor): Promise<SyncResult<AdDto>>;
  syncRates?(ctx: ConnectorContext): Promise<RateDto[]>;
  updateAdPrice?(ctx: ConnectorContext, command: UpdateAdPriceCommand): Promise<CommandResult>;
  enableAd?(ctx: ConnectorContext, command: AdCommand): Promise<CommandResult>;
  disableAd?(ctx: ConnectorContext, command: AdCommand): Promise<CommandResult>;
}

export function assertCapability(connector: P2PConnector, capability: ConnectorCapability): void {
  if (!connector.definition.capabilities.includes(capability)) {
    throw new Error(
      `Connector ${connector.definition.slug} does not support capability ${capability}`
    );
  }
}
