import type { MarketAdDto, MarketQuery } from "@p2phunt/shared";

const OKX_P2P_BOOKS_URL = "https://www.okx.com/v3/c2c/tradingOrders/books";

/**
 * Calls OKX's public P2P web endpoint (the same one https://www.okx.com/p2p-markets uses).
 * Like the Binance/Bybit equivalents, this is NOT an officially documented partner API — no
 * auth required, but undocumented and subject to change without notice.
 *
 * Side mapping (verified empirically): requesting side="sell" returns merchant-selling ads
 * under `data.sell` (what a taker uses to BUY); side="buy" returns merchant-buying ads under
 * `data.buy` (what a taker uses to SELL) — same inversion as Bybit's public endpoint.
 */
export async function fetchOkxPublicAds(query: MarketQuery): Promise<MarketAdDto[]> {
  const requestSide = query.side === "buy" ? "sell" : "buy";
  const responseKey = requestSide;

  const url = new URL(OKX_P2P_BOOKS_URL);
  url.searchParams.set("side", requestSide);
  url.searchParams.set("baseCurrency", query.cryptoAsset.toLowerCase());
  url.searchParams.set("quoteCurrency", query.fiatAsset.toLowerCase());
  url.searchParams.set("paymentMethod", "all");
  url.searchParams.set("userType", "all");
  url.searchParams.set("showTrade", "false");
  url.searchParams.set("showFollow", "false");
  url.searchParams.set("showAlreadyTraded", "false");
  url.searchParams.set("isAbleFilter", "false");

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; P2PHuntBot/1.0)" }
  });

  if (!response.ok) {
    throw new Error(`OKX P2P request failed: HTTP ${response.status}`);
  }

  const body = (await response.json()) as OkxBooksResponse;
  if (body.code !== 0 || !body.data) {
    throw new Error(`OKX P2P request failed: ${body.code}`);
  }

  const rows = (body.data[responseKey] ?? []).slice(0, query.rows ?? 20);
  const fetchedAt = new Date().toISOString();

  return rows.map((row) => ({
    platform: "okx" as const,
    externalId: row.id,
    side: query.side,
    cryptoAsset: row.baseCurrency.toUpperCase(),
    fiatAsset: row.quoteCurrency.toUpperCase(),
    price: row.price,
    minLimit: row.quoteMinAmountPerOrder ?? null,
    maxLimit: row.quoteMaxAmountPerOrder ?? null,
    availableAmount: row.availableAmount ?? null,
    paymentMethods: row.paymentMethods ?? [],
    advertiserName: row.nickName,
    advertiserOrderCount: row.completedOrderQuantity ?? null,
    advertiserCompletionRate: row.completedRate ? Number(row.completedRate) : null,
    fetchedAt
  }));
}

interface OkxAdRow {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  price: string;
  quoteMinAmountPerOrder: string | null;
  quoteMaxAmountPerOrder: string | null;
  availableAmount: string | null;
  paymentMethods: string[] | null;
  nickName: string;
  completedOrderQuantity: number | null;
  completedRate: string | null;
}

interface OkxBooksResponse {
  code: number;
  data: {
    buy: OkxAdRow[];
    sell: OkxAdRow[];
  } | null;
}
