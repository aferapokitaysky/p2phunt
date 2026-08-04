import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export async function createConnectorLog(
  workspaceId: string,
  accountId: string,
  connectorSlug: string,
  level: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  await prisma.connectorLog.create({
    data: {
      workspaceId,
      accountId,
      connectorSlug,
      level,
      message,
      ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {})
    }
  });
}

export function createConnectorLogger(workspaceId: string, accountId: string, connectorSlug: string) {
  return {
    info: (message: string, metadata?: Record<string, unknown>) =>
      void createConnectorLog(workspaceId, accountId, connectorSlug, "info", message, metadata),
    warn: (message: string, metadata?: Record<string, unknown>) =>
      void createConnectorLog(workspaceId, accountId, connectorSlug, "warn", message, metadata),
    error: (message: string, metadata?: Record<string, unknown>) =>
      void createConnectorLog(workspaceId, accountId, connectorSlug, "error", message, metadata)
  };
}
