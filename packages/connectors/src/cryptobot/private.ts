import type { BalanceDto, DealDto, DealStatus } from "@p2phunt/shared";
import type {
  ConnectorContext,
  ConnectorDefinition,
  ConnectorProfile,
  ConnectorValidationResult,
  P2PConnector,
  SyncResult
} from "../core/connector.js";

const BASE_URL = "https://pay.crypt.bot/api";

interface CryptoBotCredentials {
  apiToken: string;
}

function readCredentials(ctx: ConnectorContext): CryptoBotCredentials {
  const creds = ctx.credentials as Partial<CryptoBotCredentials> | undefined;
  if (!creds?.apiToken) {
    throw new Error("CryptoBot connector requires an API token — get it from @CryptoBot via /pay, then add it under the account's Connection tab.");
  }
  return { apiToken: creds.apiToken };
}

async function call<T>(creds: CryptoBotCredentials, method: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}/${method}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: { "Crypto-Pay-API-Token": creds.apiToken }
  });

  const body = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: { code: number; name: string }; result?: T };

  if (!response.ok || !body.ok) {
    throw new Error(`CryptoBot API error: ${body.error?.name ?? `HTTP ${response.status}`}`);
  }

  return body.result as T;
}

interface CryptoBotAppInfo {
  app_id: number;
  name: string;
  payment_processing_bot_username: string;
}

interface CryptoBotBalance {
  currency_code: string;
  available: string;
  onhold: string;
}

interface CryptoBotInvoice {
  invoice_id: number;
  status: "active" | "paid" | "expired";
  asset: string;
  amount: string;
  description?: string;
  created_at: string;
  paid_at?: string;
}

function mapInvoiceStatus(status: CryptoBotInvoice["status"]): DealStatus {
  switch (status) {
    case "paid":
      return "completed";
    case "expired":
      return "expired";
    default:
      return "pending";
  }
}

/**
 * Real connector for @CryptoBot's Crypto Pay API — a Telegram-bot wallet with a documented
 * REST API authenticated by a per-app token (created via /pay inside the bot, no MTProto
 * login required). NOT live-verified against a real app token — built from the official
 * Crypto Pay API reference. Invoices are treated as "deals" (an invoice paid to the app's
 * wallet is analogous to an incoming P2P deal); there is no ad concept in this API.
 */
export class CryptoBotConnector implements P2PConnector {
  definition: ConnectorDefinition = {
    slug: "cryptobot",
    platform: "cryptobot",
    platformCategory: "telegram" as const,
    displayName: "CryptoBot",
    version: "0.1.0",
    safetyLevel: 1 as const,
    authMethods: ["api_key" as const],
    capabilities: ["profile.read", "balances.read", "deals.read"]
  };

  async validateCredentials(ctx: ConnectorContext): Promise<ConnectorValidationResult> {
    try {
      const creds = readCredentials(ctx);
      await call<CryptoBotAppInfo>(creds, "getMe");
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async getProfile(ctx: ConnectorContext): Promise<ConnectorProfile> {
    const creds = readCredentials(ctx);
    const app = await call<CryptoBotAppInfo>(creds, "getMe");
    ctx.logger.info("CryptoBot app info loaded", { appId: app.app_id });
    return {
      externalAccountId: `cryptobot:${app.app_id}`,
      displayName: app.name,
      rawPayload: app
    };
  }

  async syncBalances(ctx: ConnectorContext): Promise<BalanceDto[]> {
    const creds = readCredentials(ctx);
    const balances = await call<CryptoBotBalance[]>(creds, "getBalance");
    ctx.logger.info("CryptoBot balances synced", { count: balances.length });

    const syncedAt = new Date().toISOString();
    return balances
      .filter((b) => Number(b.available) + Number(b.onhold) > 0)
      .map((b) => ({
        accountId: ctx.accountId,
        asset: b.currency_code,
        availableAmount: b.available,
        lockedAmount: b.onhold,
        totalAmount: (Number(b.available) + Number(b.onhold)).toString(),
        valuationFiat: null,
        valuationAmount: null,
        syncedAt
      }));
  }

  async syncDeals(ctx: ConnectorContext): Promise<SyncResult<DealDto>> {
    const creds = readCredentials(ctx);
    const invoices = await call<{ items: CryptoBotInvoice[] }>(creds, "getInvoices", { count: "100" });
    ctx.logger.info("CryptoBot invoices synced", { count: invoices.items.length });

    const items: DealDto[] = invoices.items.map((inv) => ({
      externalId: String(inv.invoice_id),
      accountId: ctx.accountId,
      platform: "cryptobot",
      side: "sell",
      cryptoAsset: inv.asset,
      fiatAsset: inv.asset,
      cryptoAmount: inv.amount,
      fiatAmount: inv.amount,
      price: "1",
      feeAmount: null,
      feeAsset: null,
      profitAmount: null,
      profitAsset: null,
      counterpartyName: inv.description ?? null,
      status: mapInvoiceStatus(inv.status),
      externalStatus: inv.status,
      openedAt: inv.created_at,
      rawPayload: inv
    }));

    return { items, hasMore: false };
  }
}
