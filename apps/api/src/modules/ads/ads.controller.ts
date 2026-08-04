import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AuthenticatedUser, CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CurrentWorkspace } from "../../common/decorators/current-workspace.decorator.js";
import { AdsService } from "./ads.service.js";
import { BulkAdPriceDto, UpdateAdPriceDto } from "./dto.js";

@Controller("ads")
export class AdsController {
  constructor(private readonly ads: AdsService) {}

  @Get()
  list(@CurrentWorkspace() workspaceId: string, @Query("accountId") accountId?: string) {
    return this.ads.listAds(workspaceId, accountId);
  }

  @Patch(":id/price")
  updatePrice(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: UpdateAdPriceDto
  ) {
    return this.ads.updatePrice(workspaceId, user.userId, id, body);
  }

  @Post(":id/enable")
  enable(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.ads.setEnabled(workspaceId, user.userId, id, true);
  }

  @Post(":id/disable")
  disable(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.ads.setEnabled(workspaceId, user.userId, id, false);
  }

  @Post("bulk-actions/preview")
  bulkPreview(@CurrentWorkspace() workspaceId: string, @Body() body: BulkAdPriceDto) {
    return this.ads.bulkPreview(workspaceId, body.adIds, body.priceDeltaPercent);
  }

  @Post("bulk-actions/update-prices")
  bulkUpdate(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: BulkAdPriceDto
  ) {
    return this.ads.bulkUpdatePrice(workspaceId, user.userId, body.adIds, body.priceDeltaPercent);
  }
}
