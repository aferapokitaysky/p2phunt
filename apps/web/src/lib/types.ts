export interface Platform {
  id: string;
  slug: string;
  name: string;
  category: string;
}

export interface ConnectorDefinition {
  id: string;
  slug: string;
  version: string;
  capabilities: string[];
  authMethods: string[];
}

export interface Account {
  id: string;
  workspaceId: string;
  name: string;
  color: string | null;
  groupName: string | null;
  tags: string[];
  mode: "manual" | "auto";
  status: "draft" | "connecting" | "active" | "disabled" | "error" | "reauth_required" | "archived";
  lastSyncAt: string | null;
  lastError: string | null;
  createdAt: string;
  platform: Platform;
  connectorDefinition: ConnectorDefinition;
  _count: { deals: number; ads: number; balances: number };
}

export interface AccountDetail extends Account {
  balances: Balance[];
  deals: Deal[];
  ads: Ad[];
  connectorLogs: ConnectorLog[];
  secrets: { id: string; kind: string; status: string; createdAt: string; rotatedAt: string | null }[];
}

export interface Deal {
  id: string;
  workspaceId: string;
  accountId: string;
  externalId: string | null;
  side: "buy" | "sell";
  cryptoAsset: string;
  fiatAsset: string;
  cryptoAmount: string;
  fiatAmount: string;
  price: string;
  feeAmount: string | null;
  feeAsset: string | null;
  profitAmount: string | null;
  profitAsset: string | null;
  counterpartyName: string | null;
  status: string;
  externalStatus: string | null;
  openedAt: string | null;
  tags: string[];
  comment: string | null;
  createdAt: string;
  account?: { id: string; name: string; color: string | null; tags: string[] };
}

export interface DealDetail extends Deal {
  notes: { id: string; body: string; createdAt: string }[];
  messages: DealMessage[];
  rawPayload: unknown;
}

export interface DealMessage {
  id: string;
  dealId: string;
  source: "internal" | "telegram" | "exchange";
  direction: "inbound" | "outbound";
  senderName: string | null;
  body: string;
  sentAt: string;
}

export interface Balance {
  id: string;
  accountId: string;
  asset: string;
  availableAmount: string;
  lockedAmount: string;
  totalAmount: string;
  valuationFiat: string | null;
  valuationAmount: string | null;
  syncedAt: string;
  account?: { id: string; name: string; color: string | null; platformId: string };
}

export interface Ad {
  id: string;
  accountId: string;
  externalId: string | null;
  side: "buy" | "sell";
  cryptoAsset: string;
  fiatAsset: string;
  price: string;
  minLimit: string | null;
  maxLimit: string | null;
  availableAmount: string | null;
  status: string;
  updatedAt: string;
  account?: { id: string; name: string; color: string | null };
}

export interface ConnectorLog {
  id: string;
  accountId: string | null;
  connectorSlug: string;
  level: string;
  message: string;
  metadata: unknown;
  createdAt: string;
}

export interface SyncJob {
  id: string;
  accountId: string;
  connectorSlug: string;
  jobType: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  stats: { balances: number; deals: number; ads: number } | null;
  createdAt: string;
}

export interface DashboardSummary {
  workspace: { id: string; name: string; mode: "manual" | "auto"; emergencyStop: boolean };
  accounts: number;
  accountsNeedingAttention: number;
  activeDeals: number;
  completedDeals: number;
  openAds: number;
  balancesByAsset: Record<string, string>;
  recentLogs: ConnectorLog[];
  unreadNotifications: number;
  activeAutomationRules: number;
}

export interface RateSource {
  id: string;
  slug: string;
  name: string;
  priority: number;
  refreshIntervalMs: number;
  status: string;
}

export interface CurrentRate {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  bid: string | null;
  ask: string | null;
  mid: string;
  selectedBy: string;
  updatedAt: string;
  source: { slug: string; name: string; status: string };
}

export interface PriceQuote {
  baseAsset: string;
  quoteAsset: string;
  side: "buy" | "sell";
  baseRate: number;
  selectedBy: string;
  rateUpdatedAt: string;
  ageMs: number;
  markup: { id: string; scopeType: string; markupType: string; value: number } | null;
  finalPrice: number;
}

export interface MarkupRule {
  id: string;
  scopeType: "global" | "platform" | "account" | "ad";
  scopeId: string | null;
  baseAsset: string | null;
  quoteAsset: string | null;
  side: "buy" | "sell" | null;
  markupType: "percent" | "fixed";
  value: string;
  priority: number;
  enabled: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: { type: string; [key: string]: unknown };
  conditions: { field: string; operator: string; value: unknown }[];
  actions: { type: string; params?: Record<string, unknown> }[];
  guards: Record<string, unknown> | null;
  cooldownSeconds: number | null;
  lastExecutedAt: string | null;
  createdAt: string;
}

export interface RuleExecution {
  id: string;
  ruleId: string;
  status: string;
  input: unknown;
  conditionResults: unknown;
  actionResults: unknown;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface Notification {
  id: string;
  channel: string;
  title: string;
  body: string;
  severity: "info" | "success" | "warning" | "error" | "critical";
  status: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  actorType: string;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
}

export interface ConnectorCommand {
  id: string;
  accountId: string;
  connectorSlug: string;
  type: string;
  reason: "manual" | "automation";
  input: unknown;
  status: "pending" | "running" | "succeeded" | "failed" | "blocked_by_mode" | "blocked_by_guard";
  result: unknown;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface MarketAd {
  platform: "binance" | "bybit";
  externalId: string;
  side: "buy" | "sell";
  cryptoAsset: string;
  fiatAsset: string;
  price: string;
  minLimit: string | null;
  maxLimit: string | null;
  availableAmount: string | null;
  paymentMethods: string[];
  advertiserName: string;
  advertiserOrderCount: number | null;
  advertiserCompletionRate: number | null;
  fetchedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}
