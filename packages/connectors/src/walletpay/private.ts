import type { DealDto, DealStatus } from "@p2phunt/shared";
import type {
  ConnectorContext,
  ConnectorDefinition,
  ConnectorProfile,
  ConnectorValidationResult,
  P2PConnector,
  SyncResult
} from "../core/connector.js";

const BASE_URL = "https://pay.wallet.tg/wpay/store-api/v1";

interface WalletPayCredentials {
  apiKey: string;
}

function readCredentials(ctx: ConnectorContext): WalletPayCredentials {
  const creds = ctx.credentials as Partial<WalletPayCredentials> | undefined;
  if (!creds?.apiKey) {
    throw new Error("Wallet Pay connector requires a Store API key — get it from pay.wallet.tg after your store is approved, then add it under the account's Connection tab.");
  }
  return { apiKey: creds.apiKey };
}

async function call<T>(creds: WalletPayCredentials, path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: { "Wpay-Store-Api-Key": creds.apiKey }
  });

  const body = (await response.json().catch(() => ({}))) as { status?: string; message?: string; data?: T };

  if (!response.ok || body.status !== "SUCCESS") {
    throw new Error(`Wallet Pay API error: ${body.message ?? body.status ?? `HTTP ${response.status}`}`);
  }

  return body.data as T;
}

interface WalletPayOrder {
  id: string;
  status: "ACTIVE" | "EXPIRED" | "PAID" | "CANCELLED";
  amount: { amount: string; currencyCode: string };
  externalId: string;
  createdDateTime: string;
  paymentDateTime?: string;
}

function mapOrderStatus(status: WalletPayOrder["status"]): DealStatus {
  switch (status) {
    case "PAID":
      return "completed";
    case "EXPIRED":
      return "expired";
    case "CANCELLED":
      return "cancelled";
    default:
      return "pending";
  }
}

/**
 * Real connector for Wallet Pay (@wallet's merchant payment platform) — authenticated by a
 * per-store API key from pay.wallet.tg, no MTProto login required. NOT live-verified against
 * a real store key. Built from the official OpenAPI spec at
 * https://docs.wallet.tg/pay/integration-schema.yaml (fetched and verified live).
 *
 * Wallet Pay's API is merchant-order-focused only — there is no balance-read endpoint, so
 * this connector exposes orders as "deals" and nothing else. There is also no dedicated
 * profile/whoami endpoint, so credential validation piggybacks on a zero-row order-list call.
 */
export class WalletPayConnector implements P2PConnector {
  definition: ConnectorDefinition = {
    slug: "walletpay",
    platform: "walletpay",
    platformCategory: "telegram" as const,
    displayName: "Wallet",
    version: "0.1.0",
    safetyLevel: 1 as const,
    authMethods: ["api_key" as const],
    capabilities: ["profile.read", "deals.read"]
  };

  async validateCredentials(ctx: ConnectorContext): Promise<ConnectorValidationResult> {
    try {
      const creds = readCredentials(ctx);
      await call<{ items: WalletPayOrder[] }>(creds, "/reconciliation/order-list", { offset: "0", count: "1" });
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async getProfile(ctx: ConnectorContext): Promise<ConnectorProfile> {
    const creds = readCredentials(ctx);
    await call<{ items: WalletPayOrder[] }>(creds, "/reconciliation/order-list", { offset: "0", count: "1" });
    ctx.logger.info("Wallet Pay store credentials validated");
    return {
      externalAccountId: `walletpay:${ctx.accountId}`,
      displayName: null
    };
  }

  async syncDeals(ctx: ConnectorContext): Promise<SyncResult<DealDto>> {
    const creds = readCredentials(ctx);
    const result = await call<{ items: WalletPayOrder[] }>(creds, "/reconciliation/order-list", {
      offset: "0",
      count: "100"
    });
    ctx.logger.info("Wallet Pay orders synced", { count: result.items.length });

    const items: DealDto[] = result.items.map((order) => ({
      externalId: order.id,
      accountId: ctx.accountId,
      platform: "walletpay",
      side: "sell",
      cryptoAsset: order.amount.currencyCode,
      fiatAsset: order.amount.currencyCode,
      cryptoAmount: order.amount.amount,
      fiatAmount: order.amount.amount,
      price: "1",
      feeAmount: null,
      feeAsset: null,
      profitAmount: null,
      profitAsset: null,
      counterpartyName: order.externalId,
      status: mapOrderStatus(order.status),
      externalStatus: order.status,
      openedAt: order.createdDateTime,
      rawPayload: order
    }));

    return { items, hasMore: false };
  }
}
