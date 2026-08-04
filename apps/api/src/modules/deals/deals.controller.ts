import { Body, Controller, Get, Header, Param, Patch, Post, Query } from "@nestjs/common";
import { AuthenticatedUser, CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CurrentWorkspace } from "../../common/decorators/current-workspace.decorator.js";
import { DealsService } from "./deals.service.js";
import { AddDealMessageDto, AddDealNoteDto, UpdateDealDto } from "./dto.js";

@Controller("deals")
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Get()
  listDeals(@CurrentWorkspace() workspaceId: string, @Query() query: Record<string, string | undefined>) {
    return this.deals.listDeals(workspaceId, query);
  }

  @Get("export")
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", "attachment; filename=deals.csv")
  async exportDeals(
    @CurrentWorkspace() workspaceId: string,
    @Query() query: Record<string, string | undefined>
  ) {
    return this.deals.exportDeals(workspaceId, query);
  }

  @Get(":id")
  getDeal(@CurrentWorkspace() workspaceId: string, @Param("id") id: string) {
    return this.deals.getDeal(workspaceId, id);
  }

  @Patch(":id")
  updateDeal(@CurrentWorkspace() workspaceId: string, @Param("id") id: string, @Body() body: UpdateDealDto) {
    return this.deals.updateDeal(workspaceId, id, body);
  }

  @Post(":id/notes")
  addNote(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: AddDealNoteDto
  ) {
    return this.deals.addNote(workspaceId, user.userId, id, body.body);
  }

  @Post(":id/messages")
  addMessage(@CurrentWorkspace() workspaceId: string, @Param("id") id: string, @Body() body: AddDealMessageDto) {
    return this.deals.addMessage(workspaceId, id, body);
  }
}
