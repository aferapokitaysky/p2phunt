import { Injectable, NotFoundException } from "@nestjs/common";
import { CommandStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";

export interface CreateCommandInput {
  workspaceId: string;
  accountId: string;
  connectorSlug: string;
  type: string;
  reason: "manual" | "automation";
  input?: Record<string, unknown>;
  ruleExecutionId?: string;
}

@Injectable()
export class CommandsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCommand(data: CreateCommandInput) {
    return this.prisma.connectorCommand.create({
      data: {
        workspaceId: data.workspaceId,
        accountId: data.accountId,
        connectorSlug: data.connectorSlug,
        type: data.type,
        reason: data.reason,
        ...(data.input !== undefined ? { input: data.input as Prisma.InputJsonValue } : {}),
        ...(data.ruleExecutionId !== undefined ? { ruleExecutionId: data.ruleExecutionId } : {}),
        status: "pending"
      }
    });
  }

  async listCommands(workspaceId: string, accountId?: string) {
    return this.prisma.connectorCommand.findMany({
      where: { workspaceId, ...(accountId ? { accountId } : {}) },
      orderBy: { createdAt: "desc" },
      take: 200
    });
  }

  async getCommand(workspaceId: string, id: string) {
    const command = await this.prisma.connectorCommand.findFirst({ where: { id, workspaceId } });
    if (!command) throw new NotFoundException("Команда не найдена");
    return command;
  }

  async updateStatus(id: string, status: CommandStatus, result?: unknown, error?: string) {
    return this.prisma.connectorCommand.update({
      where: { id },
      data: {
        status,
        ...(result !== undefined ? { result: result as Prisma.InputJsonValue } : {}),
        ...(error !== undefined ? { error } : {}),
        ...(status === "succeeded" || status === "failed" ? { finishedAt: new Date() } : {})
      }
    });
  }
}
