import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";

export interface AuditEntry {
  workspaceId: string;
  actorUserId?: string | null;
  actorType: "user" | "system" | "automation";
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry) {
    await this.prisma.auditLog.create({
      data: {
        workspaceId: entry.workspaceId,
        actorUserId: entry.actorUserId ?? null,
        actorType: entry.actorType,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        ...(entry.before !== undefined ? { before: entry.before as Prisma.InputJsonValue } : {}),
        ...(entry.after !== undefined ? { after: entry.after as Prisma.InputJsonValue } : {}),
        ...(entry.metadata !== undefined ? { metadata: entry.metadata as Prisma.InputJsonValue } : {})
      }
    });
  }

  async list(workspaceId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 500)
    });
  }
}
