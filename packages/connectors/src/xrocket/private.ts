import type { BalanceDto } from "@p2phunt/shared";
import type {
  ConnectorContext,
  ConnectorDefinition,
  ConnectorProfile,
  ConnectorValidationResult,
  P2PConnector
} from "../core/connector.js";

const BASE_URL = "https://pay.xrocket.tg";

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

async function call<T>(creds: XRocketCredentials, path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Rocket-Pay-Key": creds.apiToken }
  });

  const body = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string; data?: T };

  if (!response.ok || body.success === false) {
    throw new Error(`xRocket API error: ${body.message ?? `HTTP ${response.status}`}`);
  }

  return body.data as T;
}

interface XRocketApp {
  name: string;
  feePercents: number;
  balances: { currency: string; balance: number }[];
}

/**
 * Real connector for @xRocket's Pay API — a Telegram-bot TON/crypto wallet with a documented
 * REST API (OpenAPI spec verified live at https://pay.xrocket.tg/api-json), authenticated by
 * a per-app token from Rocket Pay > Create App. NOT live-verified against a real app token.
 * Only balances are exposed by the API — there's no per-deal/order history endpoint, so
 * syncDeals is intentionally not implemented.
 */
export class XRocketConnector implements P2PConnector {
  definition: ConnectorDefinition = {
    slug: "xrocket",
    platform: "xrocket",
    platformCategory: "telegram" as const,
    displayName: "xRocket",
    version: "0.1.0",
    safetyLevel: 1 as const,
    authMethods: ["api_key" as const],
    capabilities: ["profile.read", "balances.read"]
  };

  async validateCredentials(ctx: ConnectorContext): Promise<ConnectorValidationResult> {
    try {
      const creds = readCredentials(ctx);
      await call<XRocketApp>(creds, "/app/info");
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async getProfile(ctx: ConnectorContext): Promise<ConnectorProfile> {
    const creds = readCredentials(ctx);
    const app = await call<XRocketApp>(creds, "/app/info");
    ctx.logger.info("xRocket app info loaded", { name: app.name });
    return {
      externalAccountId: `xrocket:${app.name}`,
      displayName: app.name,
      rawPayload: app
    };
  }

  async syncBalances(ctx: ConnectorContext): Promise<BalanceDto[]> {
    const creds = readCredentials(ctx);
    const app = await call<XRocketApp>(creds, "/app/info");
    ctx.logger.info("xRocket balances synced", { count: app.balances.length });

    const syncedAt = new Date().toISOString();
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
