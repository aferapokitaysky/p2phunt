import type { ExecuteCommandJobData } from "@p2phunt/shared";
import type { CommandResult } from "@p2phunt/connectors";
import { Prisma } from "@prisma/client";
import { loadAccountCredentials } from "../connectors/credentials.js";
import { connectorRegistry } from "../connectors/registry.js";
import { createConnectorLogger } from "../connectors/logger.js";
import type { EventPublisher } from "../events/publisher.js";
import { prisma } from "../prisma/client.js";

export async function processExecuteCommand(publisher: EventPublisher, data: ExecuteCommandJobData) {
  const command = await prisma.connectorCommand.findUnique({ where: { id: data.commandId } });
  if (!command) return;

  await prisma.connectorCommand.update({ where: { id: command.id }, data: { status: "running" } });

  const account = await prisma.account.findUnique({
    where: { id: command.accountId },
    include: { connectorDefinition: true }
  });

  if (!account) {
    await failCommand(command.id, command.workspaceId, publisher, "Account not found");
    return;
  }

  const connector = connectorRegistry.get(command.connectorSlug);
  const logger = createConnectorLogger(command.workspaceId, command.accountId, command.connectorSlug);
  const credentials = await loadAccountCredentials(command.accountId);
  const ctx = { workspaceId: command.workspaceId, accountId: command.accountId, credentials, logger };
  const input = (command.input ?? {}) as Record<string, unknown>;
  const reason = command.reason === "automation" ? ("automation" as const) : ("manual" as const);

  try {
    let result: CommandResult;

    switch (command.type) {
      case "ads.update_price": {
        if (!connector.updateAdPrice) throw new Error("Connector does not support ads.update_price");
        result = await connector.updateAdPrice(ctx, {
          adExternalId: String(input.adExternalId),
          price: String(input.price),
          reason
        });
        break;
      }
      case "ads.enable": {
        if (!connector.enableAd) throw new Error("Connector does not support ads.enable");
        result = await connector.enableAd(ctx, { adExternalId: String(input.adExternalId), reason });
        break;
      }
      case "ads.disable": {
        if (!connector.disableAd) throw new Error("Connector does not support ads.disable");
        result = await connector.disableAd(ctx, { adExternalId: String(input.adExternalId), reason });
        break;
      }
      default:
        throw new Error(`Unsupported command type: ${command.type}`);
    }

    if (!result.ok) {
      throw new Error(result.message ?? "Connector command failed");
    }

    await prisma.connectorCommand.update({
      where: { id: command.id },
      data: {
        status: "succeeded",
        result: result as unknown as Prisma.InputJsonValue,
        ...(result.externalCommandId !== undefined ? { externalCommandId: result.externalCommandId } : {}),
        finishedAt: new Date()
      }
    });

    if (command.type === "ads.update_price" && typeof input.adExternalId === "string" && typeof input.price === "string") {
      await prisma.ad.updateMany({
        where: { accountId: command.accountId, externalId: input.adExternalId },
        data: { price: new Prisma.Decimal(input.price), lastUpdateAt: new Date() }
      });
    } else if (command.type === "ads.enable" || command.type === "ads.disable") {
      await prisma.ad.updateMany({
        where: { accountId: command.accountId, externalId: String(input.adExternalId) },
        data: { status: command.type === "ads.enable" ? "active" : "paused", lastUpdateAt: new Date() }
      });
    }

    await publisher.publish(command.workspaceId, "connector.command_updated", { commandId: command.id, status: "succeeded" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown command error";
    await failCommand(command.id, command.workspaceId, publisher, message);
  }
}

async function failCommand(commandId: string, workspaceId: string, publisher: EventPublisher, message: string) {
  await prisma.connectorCommand.update({
    where: { id: commandId },
    data: { status: "failed", error: message, finishedAt: new Date() }
  });
  await publisher.publish(workspaceId, "connector.command_failed", { commandId, error: message });
}
