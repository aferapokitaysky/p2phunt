import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AuthenticatedUser, CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CurrentWorkspace } from "../../common/decorators/current-workspace.decorator.js";
import { AutomationService } from "./automation.service.js";
import { CreateAutomationRuleDto, TestAutomationRuleDto, UpdateAutomationRuleDto } from "./dto.js";

@Controller("automation")
export class AutomationController {
  constructor(private readonly automation: AutomationService) {}

  @Get("rules")
  list(@CurrentWorkspace() workspaceId: string) {
    return this.automation.list(workspaceId);
  }

  @Get("rules/:id")
  get(@CurrentWorkspace() workspaceId: string, @Param("id") id: string) {
    return this.automation.get(workspaceId, id);
  }

  @Post("rules")
  create(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateAutomationRuleDto
  ) {
    return this.automation.create(workspaceId, user.userId, body);
  }

  @Patch("rules/:id")
  update(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: UpdateAutomationRuleDto
  ) {
    return this.automation.update(workspaceId, user.userId, id, body);
  }

  @Delete("rules/:id")
  remove(@CurrentWorkspace() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.automation.remove(workspaceId, user.userId, id);
  }

  @Post("rules/:id/test")
  test(@CurrentWorkspace() workspaceId: string, @Param("id") id: string, @Body() body: TestAutomationRuleDto) {
    return this.automation.test(workspaceId, id, body.sampleInput);
  }

  @Get("executions")
  executions(@CurrentWorkspace() workspaceId: string, @Query("ruleId") ruleId?: string) {
    return this.automation.executions(workspaceId, ruleId);
  }

  @Post("emergency-stop")
  emergencyStop(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { active: boolean }
  ) {
    return this.automation.emergencyStop(workspaceId, user.userId, body.active);
  }

  @Post("mode")
  setMode(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { mode: "manual" | "auto" }
  ) {
    return this.automation.setMode(workspaceId, user.userId, body.mode);
  }
}
