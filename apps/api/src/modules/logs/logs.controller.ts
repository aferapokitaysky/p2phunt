import { Controller, Get, Query } from "@nestjs/common";
import { CurrentWorkspace } from "../../common/decorators/current-workspace.decorator.js";
import { LogsService } from "./logs.service.js";

@Controller("logs")
export class LogsController {
  constructor(private readonly logs: LogsService) {}

  @Get("audit")
  auditLogs(@CurrentWorkspace() workspaceId: string, @Query("limit") limit?: string) {
    return this.logs.auditLogs(workspaceId, limit ? Number(limit) : undefined);
  }

  @Get("connector")
  connectorLogs(
    @CurrentWorkspace() workspaceId: string,
    @Query("accountId") accountId?: string,
    @Query("limit") limit?: string
  ) {
    return this.logs.connectorLogs(workspaceId, accountId, limit ? Number(limit) : undefined);
  }

  @Get("sync-jobs")
  syncJobs(
    @CurrentWorkspace() workspaceId: string,
    @Query("accountId") accountId?: string,
    @Query("limit") limit?: string
  ) {
    return this.logs.syncJobs(workspaceId, accountId, limit ? Number(limit) : undefined);
  }
}
