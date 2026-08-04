import { createHmac } from "node:crypto";
import type { BalanceDto, DealDto, DealStatus } from "@p2phunt/shared";
import type {
  ConnectorContext,
  ConnectorDefinition,
  ConnectorProfile,
  ConnectorValidationResult,
  P2PConnector,
  SyncResult
} from "../core/connector.js";

const BASE_URL = "https://api.binance.com";

interface BinanceCredentials {
  apiKey: string;
  apiSecret: string;
}

function readCredentials(ctx: ConnectorContext): BinanceCredentials {
  const creds = ctx.credentials as Partial<BinanceCredentials> | undefined;
  if (!creds?.apiKey || !creds.apiSecret) {
    throw new Error("Binance connector requires an API key and secret — add them under the account's Connection tab.");
  }
  return { apiKey: creds.apiKey, apiSecret: creds.apiSecret };
}

async function signedRequest<T>(
  creds: BinanceCredentials,
  method: "GET" | "POST",
  path: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    timestamp: String(Date.now()),
    recvWindow: "10000"
  });
  const signature = createHmac("sha256", creds.apiSecret).update(query.toString()).digest("hex");
  query.set("signature", signature);

  const response = await fetch(`${BASE_URL}${path}?${query.toString()}`, {
    method,
    headers: { "X-MBX-APIKEY": creds.apiKey }
  });

  const body = (await response.json().catch(() => ({}))) as { code?: number; msg?: string } & Record<string, unknown>;

  if (!response.ok) {
    throw new Error(`Binance API error ${response.status}: ${body.msg ?? JSON.stringify(body)}`);
  }

  return body as T;
}

function mapOrderStatus(status: string | undefined): { status: DealStatus; } {
  switch (status) {
    case "COMPLETED":
      return { status: "completed" };
    case "CANCELLED":
    case "CANCELLED_BY_SYSTEM":
      return { status: "cancelled" };
    case "IN_APPEAL":
      return { status: "appeal" };
    case "PENDING":
      return { status: "pending" };
    case "TRADING":
    case "BUYER_PAYED":
    case "DISTRIBUTING":
      return { status: "payment_pending" };
    default:
      return { status: "unknown" };
  }
}

interface BinanceAccountInfo {
  accountType?: string;
  balances: { asset: string; free: string; locked: string }[];
}

interface BinanceC2COrder {
  orderNumber: string;
  tradeType: "BUY" | "SELL";
  asset: string;
  fiat: string;
  amount?: string;
  totalPrice?: string;
  unitPrice?: string;
  orderStatus?: string;
  createTime?: number;
  counterPartNickName?: string;
}

interface BinanceC2CHistoryResponse {
  code: string;
  message: string | null;
  data: BinanceC2COrder[];
}

/**
 * Real Binance connector using officially documented, HMAC-signed Spot + C2C endpoints.
 * NOT live-verified against a real account — built from Binance's public API docs. Balances
 * use the well-established `/api/v3/account` endpoint; C2C order history uses the documented
 * `/sapi/v1/c2c/orderMatch/listUserOrderHistory` endpoint. Binance does not expose an official
 * API for managing your own P2P ads, so ad read/write is intentionally not implemented here —
 * safetyLevel stays at 1 (read-only) until verified live.
 */
export class BinanceConnector implements P2PConnector {
  definition: ConnectorDefinition = {
    slug: "binance",
    platform: "binance",
    platformCategory: "exchange" as const,
    displayName: "Binance",
    version: "0.1.0",
    safetyLevel: 1 as const,
    authMethods: ["api_key" as const],
    capabilities: ["profile.read", "balances.read", "deals.read"]
  };

  async validateCredentials(ctx: ConnectorContext): Promise<ConnectorValidationResult> {
    try {
      const creds = readCredentials(ctx);
      await signedRequest<BinanceAccountInfo>(creds, "GET", "/api/v3/account");
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async getProfile(ctx: ConnectorContext): Promise<ConnectorProfile> {
    const creds = readCredentials(ctx);
    const account = await signedRequest<BinanceAccountInfo>(creds, "GET", "/api/v3/account");
    ctx.logger.info("Binance account info loaded", { accountType: account.accountType });
    return {
      externalAccountId: `binance:${account.accountType ?? "spot"}`,
      displayName: null,
      rawPayload: { accountType: account.accountType }
    };
  }

  async syncBalances(ctx: ConnectorContext): Promise<BalanceDto[]> {
    const creds = readCredentials(ctx);
    const account = await signedRequest<BinanceAccountInfo>(creds, "GET", "/api/v3/account");
    ctx.logger.info("Binance balances synced", { count: account.balances.length });

    const syncedAt = new Date().toISOString();
    return account.balances
      .filter((b) => Number(b.free) + Number(b.locked) > 0)
      .map((b) => ({
        accountId: ctx.accountId,
        asset: b.asset,
        availableAmount: b.free,
        lockedAmount: b.locked,
        totalAmount: (Number(b.free) + Number(b.locked)).toString(),
        valuationFiat: null,
        valuationAmount: null,
        syncedAt
      }));
  }

  async syncDeals(ctx: ConnectorContext): Promise<SyncResult<DealDto>> {
    const creds = readCredentials(ctx);

    const [buys, sells] = await Promise.all([
      signedRequest<BinanceC2CHistoryResponse>(creds, "GET", "/sapi/v1/c2c/orderMatch/listUserOrderHistory", {
        tradeType: "BUY",
        rows: 100
      }),
      signedRequest<BinanceC2CHistoryResponse>(creds, "GET", "/sapi/v1/c2c/orderMatch/listUserOrderHistory", {
        tradeType: "SELL",
        rows: 100
      })
    ]);

    const orders = [...(buys.data ?? []), ...(sells.data ?? [])];
    ctx.logger.info("Binance C2C order history synced", { count: orders.length });

    const items: DealDto[] = orders.map((order) => {
      const price = Number(order.unitPrice ?? 0);
      const fiatAmount = Number(order.totalPrice ?? order.amount ?? 0);
      const cryptoAmount = price > 0 ? (fiatAmount / price).toFixed(8) : "0";
      const { status } = mapOrderStatus(order.orderStatus);

      return {
        externalId: order.orderNumber,
        accountId: ctx.accountId,
        platform: "binance",
        side: order.tradeType === "BUY" ? "buy" : "sell",
        cryptoAsset: order.asset,
        fiatAsset: order.fiat,
        cryptoAmount,
        fiatAmount: fiatAmount.toString(),
        price: (order.unitPrice ?? "0").toString(),
        feeAmount: null,
        feeAsset: null,
        profitAmount: null,
        profitAsset: null,
        counterpartyName: order.counterPartNickName ?? null,
        status,
        externalStatus: order.orderStatus ?? null,
        openedAt: order.createTime ? new Date(order.createTime).toISOString() : null,
        rawPayload: order
      };
    });

    return { items, hasMore: false };
  }

  // No syncAds and no ad management — Binance doesn't expose an official API for either, so
  // there's nothing for a manual/automation "update ad price" action to ever target.
}
