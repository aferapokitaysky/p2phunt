import { z } from "zod";

export const assetCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(16)
  .regex(/^[A-Z0-9]+$/);

export const moneyDecimalSchema = z
  .string()
  .trim()
  .regex(/^-?\d+(\.\d+)?$/);

export const supportedCryptoAssets = ["USDT", "BTC", "ETH", "TON", "USDC", "BNB", "TRX"] as const;
export const supportedFiatAssets = ["UAH", "RUB", "USD", "EUR", "KZT", "TRY", "PLN"] as const;

export type AssetCode = z.infer<typeof assetCodeSchema>;
export type MoneyDecimal = z.infer<typeof moneyDecimalSchema>;
