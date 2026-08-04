import type { MarketAdDto, MarketQuery } from "@p2phunt/shared";

const BINANCE_P2P_SEARCH_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";

/**
 * Calls Binance's public P2P web endpoint (the same one https://p2p.binance.com uses).
 * This is NOT an officially documented partner API — it requires no API key/auth, but the
 * shape is undocumented and can change without notice. Treat it as best-effort market data,
 * not a stable integration surface.
 */
export async function fetchBinancePublicAds(query: MarketQuery): Promise<MarketAdDto[]> {
  const tradeType = query.side === "buy" ? "BUY" : "SELL";

  const response = await fetch(BINANCE_P2P_SEARCH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: query.page ?? 1,
      rows: query.rows ?? 20,
      asset: query.cryptoAsset.toUpperCase(),
      fiat: query.fiatAsset.toUpperCase(),
      tradeType,
      payTypes: [],
      publisherType: null
    })
  });

  if (!response.ok) {
    throw new Error(`Binance P2P request failed: HTTP ${response.status}`);
  }

  const body = (await response.json()) as BinanceSearchResponse;
  if (body.code !== "000000" || !Array.isArray(body.data)) {
    throw new Error(`Binance P2P request failed: ${body.message ?? body.code}`);
  }

  const fetchedAt = new Date().toISOString();

  return body.data.map((entry) => ({
    platform: "binance" as const,
    externalId: entry.adv.advNo,
    side: query.side,
    cryptoAsset: entry.adv.asset,
    fiatAsset: entry.adv.fiatUnit,
    price: entry.adv.price,
    minLimit: entry.adv.minSingleTransAmount ?? null,
    maxLimit: entry.adv.maxSingleTransAmount ?? null,
    availableAmount: entry.adv.surplusAmount ?? null,
    paymentMethods: entry.adv.tradeMethods.map((method) => method.tradeMethodShortName ?? method.identifier),
    advertiserName: entry.advertiser.nickName,
    advertiserOrderCount: entry.advertiser.monthOrderCount ?? null,
    advertiserCompletionRate: entry.advertiser.monthFinishRate ?? null,
    fetchedAt
  }));
}

interface BinanceSearchResponse {
  code: string;
  message: string | null;
  data: Array<{
    adv: {
      advNo: string;
      asset: string;
      fiatUnit: string;
      price: string;
      minSingleTransAmount: string | null;
      maxSingleTransAmount: string | null;
      surplusAmount: string | null;
      tradeMethods: Array<{ identifier: string; tradeMethodShortName: string | null }>;
    };
    advertiser: {
      nickName: string;
      monthOrderCount: number | null;
      monthFinishRate: number | null;
    };
  }>;
}
