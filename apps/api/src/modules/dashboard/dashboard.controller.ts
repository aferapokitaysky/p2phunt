import { Controller, Get } from "@nestjs/common";
import { CurrentWorkspace } from "../../common/decorators/current-workspace.decorator.js";
import { DashboardService } from "./dashboard.service.js";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("summary")
  getSummary(@CurrentWorkspace() workspaceId: string) {
    return this.dashboard.getSummary(workspaceId);
  }
}
