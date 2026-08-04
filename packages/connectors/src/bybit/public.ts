import type { MarketAdDto, MarketQuery } from "@p2phunt/shared";

const BYBIT_P2P_ONLINE_URL = "https://api2.bybit.com/fiat/otc/item/online";

/**
 * Calls Bybit's public P2P web endpoint (the same one https://www.bybit.com/fiat/trade/otc
 * uses). Like the Binance equivalent, this is NOT an officially documented partner API —
 * no auth required, but undocumented and subject to change without notice.
 *
 * Side mapping (verified empirically): side="1" returns advertiser-selling ads (ascending
 * price, what a taker uses to BUY); side="0" returns advertiser-buying ads (descending
 * price, what a taker uses to SELL).
 */
export async function fetchBybitPublicAds(query: MarketQuery): Promise<MarketAdDto[]> {
  const side = query.side === "buy" ? "1" : "0";

  const response = await fetch(BYBIT_P2P_ONLINE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tokenId: query.cryptoAsset.toUpperCase(),
      currencyId: query.fiatAsset.toUpperCase(),
      payment: [],
      side,
      size: String(query.rows ?? 20),
      page: String(query.page ?? 1),
      amount: ""
    })
  });

  if (!response.ok) {
    throw new Error(`Bybit P2P request failed: HTTP ${response.status}`);
  }

  const body = (await response.json()) as BybitOnlineResponse;
  if (body.ret_code !== 0 || !body.result?.items) {
    throw new Error(`Bybit P2P request failed: ${body.ret_msg}`);
  }

  const fetchedAt = new Date().toISOString();

  return body.result.items.map((item) => ({
    platform: "bybit" as const,
    externalId: item.id,
    side: query.side,
    cryptoAsset: query.cryptoAsset.toUpperCase(),
    fiatAsset: query.fiatAsset.toUpperCase(),
    price: item.price,
    minLimit: item.minAmount ?? null,
    maxLimit: item.maxAmount ?? null,
    availableAmount: item.lastQuantity ?? null,
    paymentMethods: item.payments ?? [],
    advertiserName: item.nickName,
    advertiserOrderCount: item.recentOrderNum ?? null,
    advertiserCompletionRate: item.recentExecuteRate !== undefined && item.recentExecuteRate !== null ? item.recentExecuteRate / 100 : null,
    fetchedAt
  }));
}

interface BybitOnlineResponse {
  ret_code: number;
  ret_msg: string;
  result: {
    items: Array<{
      id: string;
      nickName: string;
      price: string;
      minAmount: string | null;
      maxAmount: string | null;
      lastQuantity: string | null;
      payments: string[] | null;
      recentOrderNum: number | null;
      recentExecuteRate: number | null;
    }>;
  };
}
