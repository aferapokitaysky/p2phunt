import { z } from "zod";
import { assetCodeSchema, moneyDecimalSchema } from "./assets.js";

export const platformCategorySchema = z.enum(["exchange", "telegram", "web", "mock"]);
export const workspaceModeSchema = z.enum(["manual", "auto"]);
export const accountStatusSchema = z.enum([
  "draft",
  "connecting",
  "active",
  "disabled",
  "error",
  "reauth_required",
  "archived"
]);
export const tradeSideSchema = z.enum(["buy", "sell"]);
export const dealStatusSchema = z.enum([
  "new",
  "pending",
  "payment_pending",
  "paid",
  "appeal",
  "completed",
  "cancelled",
  "expired",
  "failed",
  "unknown"
]);
export const adStatusSchema = z.enum([
  "active",
  "paused",
  "disabled",
  "out_of_balance",
  "updating",
  "error",
  "unknown"
]);
export const connectorCapabilitySchema = z.enum([
  "profile.read",
  "balances.read",
  "deals.read",
  "ads.read",
  "ads.update_price",
  "ads.enable",
  "ads.disable",
  "rates.read",
  "transfer.create",
  "messages.read",
  "messages.send"
]);

export const accountDtoSchema = z.object({
  id: z.string().uuid(),
  platform: z.string(),
  connector: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  groupName: z.string().nullable(),
  tags: z.array(z.string()),
  mode: workspaceModeSchema,
  status: accountStatusSchema,
  lastSyncAt: z.string().datetime().nullable()
});

export const dealDtoSchema = z.object({
  id: z.string().uuid().optional(),
  externalId: z.string().nullable(),
  accountId: z.string().uuid(),
  platform: z.string(),
  side: tradeSideSchema,
  cryptoAsset: assetCodeSchema,
  fiatAsset: assetCodeSchema,
  cryptoAmount: moneyDecimalSchema,
  fiatAmount: moneyDecimalSchema,
  price: moneyDecimalSchema,
  feeAmount: moneyDecimalSchema.nullable(),
  feeAsset: assetCodeSchema.nullable(),
  profitAmount: moneyDecimalSchema.nullable(),
  profitAsset: assetCodeSchema.nullable(),
  counterpartyName: z.string().nullable(),
  status: dealStatusSchema,
  externalStatus: z.string().nullable(),
  openedAt: z.string().datetime().nullable(),
  rawPayload: z.unknown().optional()
});

export const balanceDtoSchema = z.object({
  accountId: z.string().uuid(),
  asset: assetCodeSchema,
  availableAmount: moneyDecimalSchema,
  lockedAmount: moneyDecimalSchema,
  totalAmount: moneyDecimalSchema,
  valuationFiat: assetCodeSchema.nullable(),
  valuationAmount: moneyDecimalSchema.nullable(),
  syncedAt: z.string().datetime()
});

export const adDtoSchema = z.object({
  externalId: z.string().nullable(),
  accountId: z.string().uuid(),
  platform: z.string(),
  side: tradeSideSchema,
  cryptoAsset: assetCodeSchema,
  fiatAsset: assetCodeSchema,
  price: moneyDecimalSchema,
  minLimit: moneyDecimalSchema.nullable(),
  maxLimit: moneyDecimalSchema.nullable(),
  availableAmount: moneyDecimalSchema.nullable(),
  status: adStatusSchema,
  externalStatus: z.string().nullable(),
  rawPayload: z.unknown().optional()
});

export const rateDtoSchema = z.object({
  source: z.string(),
  baseAsset: assetCodeSchema,
  quoteAsset: assetCodeSchema,
  bid: moneyDecimalSchema.nullable(),
  ask: moneyDecimalSchema.nullable(),
  mid: moneyDecimalSchema,
  sourceTimestamp: z.string().datetime().nullable()
});

export type PlatformCategory = z.infer<typeof platformCategorySchema>;
export type WorkspaceMode = z.infer<typeof workspaceModeSchema>;
export type AccountStatus = z.infer<typeof accountStatusSchema>;
export type TradeSide = z.infer<typeof tradeSideSchema>;
export type DealStatus = z.infer<typeof dealStatusSchema>;
export type AdStatus = z.infer<typeof adStatusSchema>;
export type ConnectorCapability = z.infer<typeof connectorCapabilitySchema>;
export type AccountDto = z.infer<typeof accountDtoSchema>;
export type DealDto = z.infer<typeof dealDtoSchema>;
export type BalanceDto = z.infer<typeof balanceDtoSchema>;
export type AdDto = z.infer<typeof adDtoSchema>;
export type RateDto = z.infer<typeof rateDtoSchema>;
