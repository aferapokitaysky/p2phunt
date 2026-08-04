import { Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class LogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async auditLogs(workspaceId: string, limit = 200) {
    return this.audit.list(workspaceId, limit);
  }

  async connectorLogs(workspaceId: string, accountId?: string, limit = 200) {
    return this.prisma.connectorLog.findMany({
      where: { workspaceId, ...(accountId ? { accountId } : {}) },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 1000)
    });
  }

  async syncJobs(workspaceId: string, accountId?: string, limit = 200) {
    return this.prisma.connectorSyncJob.findMany({
      where: { workspaceId, ...(accountId ? { accountId } : {}) },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 1000)
    });
  }
}
