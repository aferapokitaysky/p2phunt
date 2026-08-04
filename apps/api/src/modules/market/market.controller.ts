import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import type { MarketPlatform } from "@p2phunt/shared";
import { MarketService } from "./market.service.js";

const VALID_PLATFORMS: MarketPlatform[] = ["binance", "bybit", "okx"];

@Controller("market")
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Get("ads")
  listAds(
    @Query("cryptoAsset") cryptoAsset: string,
    @Query("fiatAsset") fiatAsset: string,
    @Query("side") side: string,
    @Query("platforms") platformsParam?: string
  ) {
    if (!cryptoAsset || !fiatAsset) {
      throw new BadRequestException("Нужно указать cryptoAsset и fiatAsset");
    }
    if (side !== "buy" && side !== "sell") {
      throw new BadRequestException("side должен быть 'buy' или 'sell'");
    }

    const platforms = (platformsParam ? platformsParam.split(",") : VALID_PLATFORMS).filter((p): p is MarketPlatform =>
      VALID_PLATFORMS.includes(p as MarketPlatform)
    );

    if (platforms.length === 0) {
      throw new BadRequestException(`platforms должен быть подмножеством ${VALID_PLATFORMS.join(", ")}`);
    }

    return this.market.listAds({ cryptoAsset, fiatAsset, side }, platforms);
  }
}
