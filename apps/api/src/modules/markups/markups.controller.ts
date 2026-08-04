import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CurrentWorkspace } from "../../common/decorators/current-workspace.decorator.js";
import { CreateMarkupRuleDto, UpdateMarkupRuleDto } from "./dto.js";
import { MarkupsService } from "./markups.service.js";

@Controller("markups")
export class MarkupsController {
  constructor(private readonly markups: MarkupsService) {}

  @Get()
  list(@CurrentWorkspace() workspaceId: string) {
    return this.markups.list(workspaceId);
  }

  @Post()
  create(@CurrentWorkspace() workspaceId: string, @Body() body: CreateMarkupRuleDto) {
    return this.markups.create(workspaceId, body);
  }

  @Patch(":id")
  update(@CurrentWorkspace() workspaceId: string, @Param("id") id: string, @Body() body: UpdateMarkupRuleDto) {
    return this.markups.update(workspaceId, id, body);
  }

  @Delete(":id")
  remove(@CurrentWorkspace() workspaceId: string, @Param("id") id: string) {
    return this.markups.remove(workspaceId, id);
  }
}
