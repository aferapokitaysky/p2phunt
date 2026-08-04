import { Injectable, Logger } from "@nestjs/common";
import { fetchBinancePublicAds, fetchBybitPublicAds, fetchOkxPublicAds } from "@p2phunt/connectors";
import type { MarketAdDto, MarketPlatform, MarketQuery } from "@p2phunt/shared";

interface CacheEntry {
  expiresAt: number;
  data: MarketAdDto[];
}

const CACHE_TTL_MS = 5000;

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly cache = new Map<string, CacheEntry>();

  async listAds(query: MarketQuery, platforms: MarketPlatform[]) {
    const results = await Promise.all(
      platforms.map(async (platform) => {
        try {
          const ads = await this.fetchWithCache(platform, query);
          return { platform, ok: true as const, ads };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          this.logger.warn(`Market fetch failed for ${platform}: ${message}`);
          return { platform, ok: false as const, error: message, ads: [] as MarketAdDto[] };
        }
      })
    );

    const ads = results.flatMap((result) => result.ads).sort((a, b) => Number(a.price) - Number(b.price));
    const errors = results.filter((result) => !result.ok).map((result) => ({ platform: result.platform, error: (result as { error: string }).error }));

    return { ads, errors };
  }

  private async fetchWithCache(platform: MarketPlatform, query: MarketQuery): Promise<MarketAdDto[]> {
    const key = `${platform}:${query.cryptoAsset}:${query.fiatAsset}:${query.side}:${query.page ?? 1}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const data =
      platform === "binance"
        ? await fetchBinancePublicAds(query)
        : platform === "bybit"
          ? await fetchBybitPublicAds(query)
          : await fetchOkxPublicAds(query);
    this.cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  }
}
