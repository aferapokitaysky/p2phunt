import type { AdDto, BalanceDto, DealDto, RateDto } from "@p2phunt/shared";
import type {
  AdCommand,
  CommandResult,
  ConnectorDefinition,
  ConnectorContext,
  ConnectorProfile,
  ConnectorValidationResult,
  P2PConnector,
  SyncResult,
  UpdateAdPriceCommand
} from "../core/connector.js";

const now = () => new Date().toISOString();

/** Deterministic PRNG (mulberry32) seeded from a string, so the same account gets stable jitter within a time bucket instead of pure noise. */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  let t = (hash += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function jitter(accountId: string, salt: string, magnitudePercent: number): number {
  const timeBucket = Math.floor(Date.now() / (5 * 60 * 1000));
  const r = seededRandom(`${accountId}:${salt}:${timeBucket}`);
  return 1 + (r - 0.5) * 2 * (magnitudePercent / 100);
}

const SIMULATED_FAILURE_RATE = 0.05;

export class MockConnector implements P2PConnector {
  definition: ConnectorDefinition = {
    slug: "mock",
    platform: "mock",
    platformCategory: "mock" as const,
    displayName: "Демо P2P",
    version: "0.2.0",
    safetyLevel: 2 as const,
    authMethods: ["manual" as const],
    capabilities: [
      "profile.read",
      "balances.read",
      "deals.read",
      "ads.read",
      "ads.update_price",
      "ads.enable",
      "ads.disable",
      "rates.read"
    ]
  };

  async validateCredentials(_ctx: ConnectorContext): Promise<ConnectorValidationResult> {
    return { ok: true };
  }

  async getProfile(ctx: ConnectorContext): Promise<ConnectorProfile> {
    ctx.logger.info("Демо-профиль загружен");

    return {
      externalAccountId: `mock:${ctx.accountId}`,
      displayName: "Демо-трейдер"
    };
  }

  async syncBalances(ctx: ConnectorContext): Promise<BalanceDto[]> {
    this.maybeFail(ctx, "syncBalances");
    ctx.logger.info("Демо-балансы синхронизированы");

    const usdtAmount = (2650 * jitter(ctx.accountId, "usdt", 8)).toFixed(2);
    const tonAmount = (740.5 * jitter(ctx.accountId, "ton", 8)).toFixed(2);

    return [
      {
        accountId: ctx.accountId,
        asset: "USDT",
        availableAmount: (Number(usdtAmount) - 150).toFixed(2),
        lockedAmount: "150.00",
        totalAmount: usdtAmount,
        valuationFiat: "USD",
        valuationAmount: usdtAmount,
        syncedAt: now()
      },
      {
        accountId: ctx.accountId,
        asset: "TON",
        availableAmount: tonAmount,
        lockedAmount: "0",
        totalAmount: tonAmount,
        valuationFiat: "USD",
        valuationAmount: (Number(tonAmount) * 3.3).toFixed(2),
        syncedAt: now()
      }
    ];
  }

  async syncDeals(ctx: ConnectorContext): Promise<SyncResult<DealDto>> {
    this.maybeFail(ctx, "syncDeals");
    ctx.logger.info("Демо-сделки синхронизированы");

    const openedAt = now();

    return {
      hasMore: false,
      items: [
        {
          externalId: "mock-deal-1",
          accountId: ctx.accountId,
          platform: "mock",
          side: "sell",
          cryptoAsset: "USDT",
          fiatAsset: "UAH",
          cryptoAmount: "100.00",
          fiatAmount: "3980.00",
          price: "39.80",
          feeAmount: "0.10",
          feeAsset: "USDT",
          profitAmount: "14.20",
          profitAsset: "UAH",
          counterpartyName: "demo-counterparty",
          status: "completed",
          externalStatus: "DONE",
          openedAt,
          rawPayload: { source: "mock" }
        },
        {
          externalId: "mock-deal-2",
          accountId: ctx.accountId,
          platform: "mock",
          side: "buy",
          cryptoAsset: "TON",
          fiatAsset: "USD",
          cryptoAmount: "50",
          fiatAmount: "165",
          price: "3.30",
          feeAmount: null,
          feeAsset: null,
          profitAmount: null,
          profitAsset: null,
          counterpartyName: "vip-buyer",
          status: "payment_pending",
          externalStatus: "WAIT_PAYMENT",
          openedAt,
          rawPayload: { source: "mock" }
        }
      ]
    };
  }

  async syncAds(ctx: ConnectorContext): Promise<SyncResult<AdDto>> {
    this.maybeFail(ctx, "syncAds");
    ctx.logger.info("Демо-объявления синхронизированы");

    return {
      hasMore: false,
      items: [
        {
          externalId: "mock-ad-1",
          accountId: ctx.accountId,
          platform: "mock",
          side: "sell",
          cryptoAsset: "USDT",
          fiatAsset: "UAH",
          price: (39.85 * jitter(ctx.accountId, "ad-price", 3)).toFixed(2),
          minLimit: "1000",
          maxLimit: "25000",
          availableAmount: "1200",
          status: "active",
          externalStatus: "ONLINE",
          rawPayload: { source: "mock" }
        }
      ]
    };
  }

  async syncRates(_ctx: ConnectorContext): Promise<RateDto[]> {
    return [
      {
        source: "mock",
        baseAsset: "USDT",
        quoteAsset: "UAH",
        bid: "39.72",
        ask: "39.88",
        mid: "39.80",
        sourceTimestamp: now()
      }
    ];
  }

  async updateAdPrice(ctx: ConnectorContext, command: UpdateAdPriceCommand): Promise<CommandResult> {
    ctx.logger.info("Цена демо-объявления обновлена", { adExternalId: command.adExternalId, price: command.price });
    return {
      ok: true,
      externalCommandId: `mock-cmd-${Date.now()}`,
      message: `Цена для ${command.adExternalId} установлена: ${command.price}`
    };
  }

  async enableAd(ctx: ConnectorContext, command: AdCommand): Promise<CommandResult> {
    ctx.logger.info("Демо-объявление включено", { adExternalId: command.adExternalId });
    return { ok: true, externalCommandId: `mock-cmd-${Date.now()}`, message: `${command.adExternalId} включено` };
  }

  async disableAd(ctx: ConnectorContext, command: AdCommand): Promise<CommandResult> {
    ctx.logger.info("Демо-объявление отключено", { adExternalId: command.adExternalId });
    return { ok: true, externalCommandId: `mock-cmd-${Date.now()}`, message: `${command.adExternalId} отключено` };
  }

  /**
   * Sync failures are opt-in (off by default) via `credentials.simulateFailures`, so real
   * syncs and automated tests stay deterministic — this is purely a demo/QA knob for
   * exercising the UI's failure states on request.
   */
  private maybeFail(ctx: ConnectorContext, operation: string): void {
    const credentials = ctx.credentials as { simulateFailures?: boolean } | undefined;
    if (!credentials?.simulateFailures) return;

    if (Math.random() < SIMULATED_FAILURE_RATE) {
      ctx.logger.error("Симулированный сбой демо-коннектора", { operation });
      throw new Error(`Simulated failure in mock connector during ${operation}`);
    }
  }
}
