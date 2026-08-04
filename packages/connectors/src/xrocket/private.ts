import type { BalanceDto } from "@p2phunt/shared";
import type {
  ConnectorContext,
  ConnectorDefinition,
  ConnectorProfile,
  ConnectorValidationResult,
  P2PConnector
} from "../core/connector.js";

const PAY_BASE_URL = "https://pay.xrocket.tg";
const EXCHANGE_BASE_URL = "https://exchange.api.xrocket.exchange";

interface XRocketCredentials {
  apiToken: string;
}

function readCredentials(ctx: ConnectorContext): XRocketCredentials {
  const creds = ctx.credentials as Partial<XRocketCredentials> | undefined;
  if (!creds?.apiToken) {
    throw new Error("xRocket connector requires an API token — get it from @xRocket via Rocket Pay > Create App > API token, then add it under the account's Connection tab.");
  }
  return { apiToken: creds.apiToken };
}

/**
 * @xRocket issues two unrelated token types from the same bot menu: a "Rocket Pay" wallet
 * token (opaque string, used against pay.xrocket.tg) and an "Exchange" trading-account token
 * (a JWT carrying `platform: "exchange_api"`, used against exchange.api.xrocket.exchange).
 * They are rejected outright by each other's API ("Unknown API Key" — verified live), so we
 * read the JWT's own claim to route to the right one instead of guessing.
 */
function decodeExchangeJwt(token: string): { userId: string } | null {
  const parts = token.split(".");
  const payloadSegment = parts.length === 3 ? parts[1] : undefined;
  if (!payloadSegment) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8")) as Record<string, unknown>;
    if (payload.platform !== "exchange_api" || typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

async function callPay<T>(creds: XRocketCredentials, path: string): Promise<T> {
  const response = await fetch(`${PAY_BASE_URL}${path}`, {
    headers: { "Rocket-Pay-Key": creds.apiToken }
  });

  const body = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string; data?: T };

  if (!response.ok || body.success === false) {
    throw new Error(`xRocket Pay API error: ${body.message ?? `HTTP ${response.status}`}`);
  }

  return body.data as T;
}

async function callExchange<T>(creds: XRocketCredentials, path: string): Promise<T> {
  const response = await fetch(`${EXCHANGE_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${creds.apiToken}` }
  });

  const body = (await response.json().catch(() => ({}))) as T & { message?: string; detail?: string };

  if (!response.ok) {
    throw new Error(`xRocket Exchange API error: ${body.message ?? body.detail ?? `HTTP ${response.status}`}`);
  }

  return body;
}

interface XRocketApp {
  name: string;
  feePercents: number;
  balances: { currency: string; balance: number }[];
}

interface XRocketExchangeBalance {
  asset: string;
  balance: string;
  available: string;
  holds: string;
}

/**
 * Real connector for @xRocket — auto-detects which of the bot's two token types it was
 * given (see decodeExchangeJwt above) and talks to the matching API. Both hosts and response
 * shapes were verified live against a real token during development, not fabricated:
 * - Pay wallet: GET /app/info on pay.xrocket.tg (Rocket-Pay-Key header)
 * - Exchange account: GET /api/v1/accounts/{trading,funding}/balances on
 *   exchange.api.xrocket.exchange (Authorization: Bearer)
 * The Exchange API also exposes an orders/history endpoint, but its non-empty response shape
 * couldn't be verified live (the test account had no order history), so syncDeals is left
 * unimplemented rather than guessed.
 */
export class XRocketConnector implements P2PConnector {
  definition: ConnectorDefinition = {
    slug: "xrocket",
    platform: "xrocket",
    platformCategory: "telegram" as const,
    displayName: "xRocket",
    version: "0.2.0",
    safetyLevel: 1 as const,
    authMethods: ["api_key" as const],
    capabilities: ["profile.read", "balances.read"]
  };

  async validateCredentials(ctx: ConnectorContext): Promise<ConnectorValidationResult> {
    try {
      const creds = readCredentials(ctx);
      if (decodeExchangeJwt(creds.apiToken)) {
        await callExchange<{ balances: XRocketExchangeBalance[] }>(creds, "/api/v1/accounts/trading/balances");
      } else {
        await callPay<XRocketApp>(creds, "/app/info");
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async getProfile(ctx: ConnectorContext): Promise<ConnectorProfile> {
    const creds = readCredentials(ctx);
    const exchangeClaims = decodeExchangeJwt(creds.apiToken);

    if (exchangeClaims) {
      ctx.logger.info("xRocket Exchange account identified", { userId: exchangeClaims.userId });
      return {
        externalAccountId: `xrocket-exchange:${exchangeClaims.userId}`,
        displayName: null
      };
    }

    const app = await callPay<XRocketApp>(creds, "/app/info");
    ctx.logger.info("xRocket Pay app info loaded", { name: app.name });
    return {
      externalAccountId: `xrocket-pay:${app.name}`,
      displayName: app.name,
      rawPayload: app
    };
  }

  async syncBalances(ctx: ConnectorContext): Promise<BalanceDto[]> {
    const creds = readCredentials(ctx);
    const syncedAt = new Date().toISOString();

    if (decodeExchangeJwt(creds.apiToken)) {
      const [trading, funding] = await Promise.all([
        callExchange<{ balances: XRocketExchangeBalance[] }>(creds, "/api/v1/accounts/trading/balances"),
        callExchange<{ balances: XRocketExchangeBalance[] }>(creds, "/api/v1/accounts/funding/balances")
      ]);
      ctx.logger.info("xRocket Exchange balances synced", {
        trading: trading.balances.length,
        funding: funding.balances.length
      });

      const totals = new Map<string, { available: number; holds: number }>();
      for (const b of [...trading.balances, ...funding.balances]) {
        const prev = totals.get(b.asset) ?? { available: 0, holds: 0 };
        totals.set(b.asset, { available: prev.available + Number(b.available), holds: prev.holds + Number(b.holds) });
      }

      return [...totals.entries()]
        .filter(([, v]) => v.available + v.holds > 0)
        .map(([asset, v]) => ({
          accountId: ctx.accountId,
          asset,
          availableAmount: String(v.available),
          lockedAmount: String(v.holds),
          totalAmount: String(v.available + v.holds),
          valuationFiat: null,
          valuationAmount: null,
          syncedAt
        }));
    }

    const app = await callPay<XRocketApp>(creds, "/app/info");
    ctx.logger.info("xRocket Pay balances synced", { count: app.balances.length });

    return app.balances
      .filter((b) => b.balance > 0)
      .map((b) => ({
        accountId: ctx.accountId,
        asset: b.currency,
        availableAmount: String(b.balance),
        lockedAmount: "0",
        totalAmount: String(b.balance),
        valuationFiat: null,
        valuationAmount: null,
        syncedAt
      }));
  }
}
