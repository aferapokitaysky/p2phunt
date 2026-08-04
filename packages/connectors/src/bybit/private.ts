import { createHmac } from "node:crypto";
import type { BalanceDto } from "@p2phunt/shared";
import type {
  ConnectorContext,
  ConnectorDefinition,
  ConnectorProfile,
  ConnectorValidationResult,
  P2PConnector
} from "../core/connector.js";

const BASE_URL = "https://api.bybit.com";
const RECV_WINDOW = "10000";

interface BybitCredentials {
  apiKey: string;
  apiSecret: string;
  /** Bybit account structure varies per account age — defaults to UNIFIED (current default for new accounts). */
  accountType?: string;
}

function readCredentials(ctx: ConnectorContext): BybitCredentials {
  const creds = ctx.credentials as Partial<BybitCredentials> | undefined;
  if (!creds?.apiKey || !creds.apiSecret) {
    throw new Error("Bybit connector requires an API key and secret — add them under the account's Connection tab.");
  }
  return { apiKey: creds.apiKey, apiSecret: creds.apiSecret, accountType: creds.accountType ?? "UNIFIED" };
}

async function signedGet<T>(creds: BybitCredentials, path: string, params: Record<string, string>): Promise<T> {
  const timestamp = String(Date.now());
  const query = new URLSearchParams(params).toString();
  const signPayload = `${timestamp}${creds.apiKey}${RECV_WINDOW}${query}`;
  const signature = createHmac("sha256", creds.apiSecret).update(signPayload).digest("hex");

  const response = await fetch(`${BASE_URL}${path}?${query}`, {
    method: "GET",
    headers: {
      "X-BAPI-API-KEY": creds.apiKey,
      "X-BAPI-TIMESTAMP": timestamp,
      "X-BAPI-RECV-WINDOW": RECV_WINDOW,
      "X-BAPI-SIGN": signature
    }
  });

  const body = (await response.json().catch(() => ({}))) as { retCode?: number; retMsg?: string } & Record<string, unknown>;

  if (!response.ok || (body.retCode !== undefined && body.retCode !== 0)) {
    throw new Error(`Bybit API error: ${body.retMsg ?? response.statusText}`);
  }

  return body as T;
}

interface BybitCoinBalance {
  coin: string;
  walletBalance?: string;
  free?: string;
  availableToWithdraw?: string;
  locked?: string;
}

interface BybitWalletBalanceResponse {
  result: {
    list: { accountType: string; coin: BybitCoinBalance[] }[];
  };
}

/**
 * Real Bybit connector using the officially documented, HMAC-signed v5 wallet-balance
 * endpoint. NOT live-verified against a real account — built from Bybit's public API docs.
 * Bybit's v5 REST API does not include a documented endpoint for a user's own P2P ads/orders
 * (P2P runs through separate, undocumented endpoints similar to the public market feed), so
 * deals/ads sync and ad management are intentionally not implemented — this connector is
 * read-only balances until a documented private P2P endpoint is confirmed.
 */
export class BybitConnector implements P2PConnector {
  definition: ConnectorDefinition = {
    slug: "bybit",
    platform: "bybit",
    platformCategory: "exchange" as const,
    displayName: "Bybit",
    version: "0.1.0",
    safetyLevel: 1 as const,
    authMethods: ["api_key" as const],
    capabilities: ["profile.read", "balances.read"]
  };

  async validateCredentials(ctx: ConnectorContext): Promise<ConnectorValidationResult> {
    try {
      const creds = readCredentials(ctx);
      await signedGet<BybitWalletBalanceResponse>(creds, "/v5/account/wallet-balance", { accountType: creds.accountType! });
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async getProfile(ctx: ConnectorContext): Promise<ConnectorProfile> {
    const creds = readCredentials(ctx);
    ctx.logger.info("Bybit profile check via wallet balance");
    return {
      externalAccountId: `bybit:${creds.accountType}`,
      displayName: null
    };
  }

  async syncBalances(ctx: ConnectorContext): Promise<BalanceDto[]> {
    const creds = readCredentials(ctx);
    const response = await signedGet<BybitWalletBalanceResponse>(creds, "/v5/account/wallet-balance", {
      accountType: creds.accountType!
    });

    const coins = response.result.list.flatMap((account) => account.coin);
    ctx.logger.info("Bybit balances synced", { count: coins.length });

    const syncedAt = new Date().toISOString();
    return coins
      .filter((c) => Number(c.walletBalance ?? 0) > 0)
      .map((c) => {
        const total = Number(c.walletBalance ?? 0);
        const available = Number(c.free ?? c.availableToWithdraw ?? c.walletBalance ?? 0);
        const locked = Number(c.locked ?? Math.max(total - available, 0));

        return {
          accountId: ctx.accountId,
          asset: c.coin,
          availableAmount: available.toString(),
          lockedAmount: locked.toString(),
          totalAmount: total.toString(),
          valuationFiat: null,
          valuationAmount: null,
          syncedAt
        };
      });
  }
}
