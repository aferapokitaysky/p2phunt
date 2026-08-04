import { evaluateConditions, isHighRiskAction, WRITE_ACTION_TYPES } from "@p2phunt/shared";
import type { ConditionResult, RuleCondition } from "@p2phunt/shared";
import { Prisma, RuleExecutionStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { enqueueCommand } from "../queues/connector-queue.js";
import type { EventPublisher } from "../events/publisher.js";

interface RunTriggerInput {
  workspaceId: string;
  eventType: string;
  input: Record<string, unknown>;
}

interface ActionResult {
  type: string;
  status: "executed" | "queued" | "blocked" | "skipped";
  reason?: string;
  commandId?: string;
}

export async function runAutomationForEvent(publisher: EventPublisher, trigger: RunTriggerInput) {
  const { workspaceId, eventType, input } = trigger;

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) return;

  const rules = await prisma.automationRule.findMany({ where: { workspaceId, enabled: true } });

  for (const rule of rules) {
    const ruleTrigger = rule.trigger as { type?: string } | null;
    if (!ruleTrigger || ruleTrigger.type !== eventType) continue;

    if (workspace.mode !== "auto") {
      await recordExecution(rule.id, workspaceId, "blocked_by_mode", input, undefined, undefined, "workspace not in auto mode");
      continue;
    }
    if (workspace.emergencyStop) {
      await recordExecution(rule.id, workspaceId, "blocked_by_guard", input, undefined, undefined, "emergency stop active");
      continue;
    }
    if (rule.cooldownSeconds && rule.lastExecutedAt) {
      const elapsedSeconds = (Date.now() - rule.lastExecutedAt.getTime()) / 1000;
      if (elapsedSeconds < rule.cooldownSeconds) {
        const remaining = Math.ceil(rule.cooldownSeconds - elapsedSeconds);
        await recordExecution(rule.id, workspaceId, "cooldown", input, undefined, undefined, `cooldown active, ${remaining}s remaining`);
        continue;
      }
    }

    const conditions = (rule.conditions as unknown as RuleCondition[]) ?? [];
    const evaluation = evaluateConditions(conditions, input);
    if (!evaluation.matched) {
      await recordExecution(rule.id, workspaceId, "skipped", input, evaluation.results, undefined, "conditions not met");
      continue;
    }

    const guards = (rule.guards as { allowedAccountIds?: string[]; deniedAccountIds?: string[] } | null) ?? {};
    const accountId = typeof input.accountId === "string" ? input.accountId : undefined;

    if (guards.allowedAccountIds && accountId && !guards.allowedAccountIds.includes(accountId)) {
      await recordExecution(rule.id, workspaceId, "blocked_by_guard", input, evaluation.results, undefined, "account not in allowlist");
      continue;
    }
    if (guards.deniedAccountIds && accountId && guards.deniedAccountIds.includes(accountId)) {
      await recordExecution(rule.id, workspaceId, "blocked_by_guard", input, evaluation.results, undefined, "account is denied");
      continue;
    }

    const actions = (rule.actions as unknown as { type: string; params?: Record<string, unknown> }[]) ?? [];
    const actionResults = await executeActions(workspaceId, accountId, actions);

    await prisma.automationRule.update({ where: { id: rule.id }, data: { lastExecutedAt: new Date() } });
    const execution = await recordExecution(rule.id, workspaceId, "succeeded", input, evaluation.results, actionResults, undefined);
    await publisher.publish(workspaceId, "rule.executed", { ruleId: rule.id, executionId: execution.id, status: "succeeded" });
  }
}

async function executeActions(
  workspaceId: string,
  accountId: string | undefined,
  actions: { type: string; params?: Record<string, unknown> }[]
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  for (const action of actions) {
    if (isHighRiskAction(action.type)) {
      results.push({ type: action.type, status: "blocked", reason: "high_risk_action_disabled" });
      continue;
    }

    if (action.type === "notify") {
      const title = typeof action.params?.message === "string" ? action.params.message : "Automation rule triggered";
      await prisma.notification.create({
        data: { workspaceId, channel: "in_app", title, body: JSON.stringify(action.params ?? {}), severity: "info" }
      });
      results.push({ type: action.type, status: "executed" });
      continue;
    }

    if (WRITE_ACTION_TYPES.has(action.type) && accountId) {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: { connectorDefinition: true }
      });
      if (account) {
        const command = await prisma.connectorCommand.create({
          data: {
            workspaceId,
            accountId,
            connectorSlug: account.connectorDefinition.slug,
            type: action.type,
            reason: "automation",
            ...(action.params !== undefined ? { input: action.params as Prisma.InputJsonValue } : {}),
            status: "pending"
          }
        });
        await enqueueCommand({ commandId: command.id });
        results.push({ type: action.type, status: "queued", commandId: command.id });
        continue;
      }
    }

    results.push({ type: action.type, status: "skipped", reason: "missing_account_context" });
  }

  return results;
}

async function recordExecution(
  ruleId: string,
  workspaceId: string,
  status: RuleExecutionStatus,
  input: Record<string, unknown>,
  conditionResults: ConditionResult[] | undefined,
  actionResults: ActionResult[] | undefined,
  error: string | undefined
) {
  return prisma.ruleExecution.create({
    data: {
      workspaceId,
      ruleId,
      status,
      input: input as Prisma.InputJsonValue,
      ...(conditionResults !== undefined ? { conditionResults: conditionResults as unknown as Prisma.InputJsonValue } : {}),
      ...(actionResults !== undefined ? { actionResults: actionResults as unknown as Prisma.InputJsonValue } : {}),
      ...(error !== undefined ? { error } : {}),
      finishedAt: new Date()
    }
  });
}
