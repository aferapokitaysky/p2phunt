import { randomUUID } from "node:crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { evaluateConditions, isHighRiskAction, RuleCondition } from "@p2phunt/shared";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateAutomationRuleDto, UpdateAutomationRuleDto } from "./dto.js";

@Injectable()
export class AutomationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async list(workspaceId: string) {
    return this.prisma.automationRule.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  }

  async get(workspaceId: string, id: string) {
    return this.assertOwnership(workspaceId, id);
  }

  async create(workspaceId: string, actorUserId: string, dto: CreateAutomationRuleDto) {
    const rule = await this.prisma.automationRule.create({
      data: {
        workspaceId,
        name: dto.name,
        trigger: dto.trigger as Prisma.InputJsonValue,
        conditions: dto.conditions as Prisma.InputJsonValue,
        actions: dto.actions as Prisma.InputJsonValue,
        ...(dto.guards !== undefined ? { guards: dto.guards as Prisma.InputJsonValue } : {}),
        ...(dto.cooldownSeconds !== undefined ? { cooldownSeconds: dto.cooldownSeconds } : {})
      }
    });

    await this.audit.record({
      workspaceId,
      actorUserId,
      actorType: "user",
      action: "automation_rule.created",
      entityType: "AutomationRule",
      entityId: rule.id
    });

    return rule;
  }

  async update(workspaceId: string, actorUserId: string, id: string, dto: UpdateAutomationRuleDto) {
    await this.assertOwnership(workspaceId, id);

    const rule = await this.prisma.automationRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
        ...(dto.trigger !== undefined ? { trigger: dto.trigger as Prisma.InputJsonValue } : {}),
        ...(dto.conditions !== undefined ? { conditions: dto.conditions as Prisma.InputJsonValue } : {}),
        ...(dto.actions !== undefined ? { actions: dto.actions as Prisma.InputJsonValue } : {}),
        ...(dto.guards !== undefined ? { guards: dto.guards as Prisma.InputJsonValue } : {}),
        ...(dto.cooldownSeconds !== undefined ? { cooldownSeconds: dto.cooldownSeconds } : {})
      }
    });

    await this.audit.record({
      workspaceId,
      actorUserId,
      actorType: "user",
      action: "automation_rule.updated",
      entityType: "AutomationRule",
      entityId: id,
      after: dto as Record<string, unknown>
    });

    return rule;
  }

  async remove(workspaceId: string, actorUserId: string, id: string) {
    await this.assertOwnership(workspaceId, id);
    await this.prisma.automationRule.delete({ where: { id } });
    await this.audit.record({
      workspaceId,
      actorUserId,
      actorType: "user",
      action: "automation_rule.deleted",
      entityType: "AutomationRule",
      entityId: id
    });
    return { ok: true };
  }

  async test(workspaceId: string, id: string, sampleInput: Record<string, unknown>) {
    const rule = await this.assertOwnership(workspaceId, id);
    const conditions = (rule.conditions as unknown as RuleCondition[]) ?? [];
    const evaluation = evaluateConditions(conditions, sampleInput);

    const actions = (rule.actions as unknown as { type: string; params?: Record<string, unknown> }[]) ?? [];
    const plannedActions = actions.map((action) => ({
      type: action.type,
      params: action.params,
      wouldExecute: evaluation.matched && !isHighRiskAction(action.type),
      blockedReason: !evaluation.matched
        ? "conditions_not_met"
        : isHighRiskAction(action.type)
          ? "high_risk_action_disabled"
          : null
    }));

    const execution = await this.prisma.ruleExecution.create({
      data: {
        workspaceId,
        ruleId: id,
        triggerEventId: randomUUID(),
        status: "dry_run",
        input: sampleInput as Prisma.InputJsonValue,
        conditionResults: evaluation.results as unknown as Prisma.InputJsonValue,
        actionResults: plannedActions as unknown as Prisma.InputJsonValue,
        finishedAt: new Date()
      }
    });

    return {
      executionId: execution.id,
      matched: evaluation.matched,
      conditionResults: evaluation.results,
      plannedActions
    };
  }

  async executions(workspaceId: string, ruleId?: string) {
    return this.prisma.ruleExecution.findMany({
      where: { workspaceId, ...(ruleId ? { ruleId } : {}) },
      orderBy: { startedAt: "desc" },
      take: 200
    });
  }

  async emergencyStop(workspaceId: string, actorUserId: string, active: boolean) {
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { emergencyStop: active }
    });

    await this.audit.record({
      workspaceId,
      actorUserId,
      actorType: "user",
      action: active ? "workspace.emergency_stop_activated" : "workspace.emergency_stop_deactivated",
      entityType: "Workspace",
      entityId: workspaceId
    });

    return { emergencyStop: workspace.emergencyStop };
  }

  async setMode(workspaceId: string, actorUserId: string, mode: "manual" | "auto") {
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { mode }
    });

    await this.audit.record({
      workspaceId,
      actorUserId,
      actorType: "user",
      action: "workspace.mode_changed",
      entityType: "Workspace",
      entityId: workspaceId,
      after: { mode }
    });

    return { mode: workspace.mode };
  }

  private async assertOwnership(workspaceId: string, id: string) {
    const rule = await this.prisma.automationRule.findFirst({ where: { id, workspaceId } });
    if (!rule) throw new NotFoundException("Правило автоматизации не найдено");
    return rule;
  }
}
