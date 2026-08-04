import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentWorkspace } from "../../common/decorators/current-workspace.decorator.js";
import { CreateRateSourceDto, ManualOverrideDto, UpdateRateSourceDto } from "./dto.js";
import { PricingService } from "./pricing.service.js";
import { RatesService } from "./rates.service.js";

@Controller("rates")
export class RatesController {
  constructor(
    private readonly rates: RatesService,
    private readonly pricing: PricingService
  ) {}

  @Get("sources")
  listSources(@CurrentWorkspace() workspaceId: string) {
    return this.rates.listSources(workspaceId);
  }

  @Post("sources")
  createSource(@CurrentWorkspace() workspaceId: string, @Body() body: CreateRateSourceDto) {
    return this.rates.createSource(workspaceId, body);
  }

  @Patch("sources/:id")
  updateSource(
    @CurrentWorkspace() workspaceId: string,
    @Param("id") id: string,
    @Body() body: UpdateRateSourceDto
  ) {
    return this.rates.updateSource(workspaceId, id, body);
  }

  @Get("current")
  current(
    @CurrentWorkspace() workspaceId: string,
    @Query("baseAsset") baseAsset?: string,
    @Query("quoteAsset") quoteAsset?: string
  ) {
    return this.rates.current(workspaceId, baseAsset, quoteAsset);
  }

  @Get("history")
  history(
    @CurrentWorkspace() workspaceId: string,
    @Query("baseAsset") baseAsset: string,
    @Query("quoteAsset") quoteAsset: string,
    @Query("limit") limit?: string
  ) {
    return this.rates.history(workspaceId, baseAsset, quoteAsset, limit ? Number(limit) : undefined);
  }

  @Post("manual-override")
  manualOverride(@CurrentWorkspace() workspaceId: string, @Body() body: ManualOverrideDto) {
    return this.rates.manualOverride(workspaceId, body);
  }

  @Get("quote")
  quote(
    @CurrentWorkspace() workspaceId: string,
    @Query("baseAsset") baseAsset: string,
    @Query("quoteAsset") quoteAsset: string,
    @Query("side") side: "buy" | "sell",
    @Query("accountId") accountId?: string,
    @Query("adId") adId?: string
  ) {
    return this.pricing.quote(workspaceId, { baseAsset, quoteAsset, side, accountId, adId });
  }
}
