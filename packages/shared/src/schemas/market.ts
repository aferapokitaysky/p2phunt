import { z } from "zod";
import { assetCodeSchema, moneyDecimalSchema } from "./assets.js";
import { tradeSideSchema } from "./domain.js";

export const marketPlatformSchema = z.enum(["binance", "bybit"]);

/**
 * A public P2P advertisement fetched live from an exchange's public (unauthenticated)
 * market-data endpoint — not the user's own ad. Used to power the cross-exchange "Market"
 * feed so a trader can compare live rates without connecting an account.
 */
export const marketAdDtoSchema = z.object({
  platform: marketPlatformSchema,
  externalId: z.string(),
  side: tradeSideSchema,
  cryptoAsset: assetCodeSchema,
  fiatAsset: assetCodeSchema,
  price: moneyDecimalSchema,
  minLimit: moneyDecimalSchema.nullable(),
  maxLimit: moneyDecimalSchema.nullable(),
  availableAmount: moneyDecimalSchema.nullable(),
  paymentMethods: z.array(z.string()),
  advertiserName: z.string(),
  advertiserOrderCount: z.number().nullable(),
  advertiserCompletionRate: z.number().nullable(),
  fetchedAt: z.string().datetime()
});

export type MarketPlatform = z.infer<typeof marketPlatformSchema>;
export type MarketAdDto = z.infer<typeof marketAdDtoSchema>;

export interface MarketQuery {
  cryptoAsset: string;
  fiatAsset: string;
  side: "buy" | "sell";
  page?: number;
  rows?: number;
}
