import type { SyncAccountJobData } from "@p2phunt/shared";
import { Prisma } from "@prisma/client";
import { runAutomationForEvent } from "../automation/engine.js";
import { loadAccountCredentials } from "../connectors/credentials.js";
import { connectorRegistry } from "../connectors/registry.js";
import { createConnectorLog, createConnectorLogger } from "../connectors/logger.js";
import type { EventPublisher } from "../events/publisher.js";
import { prisma } from "../prisma/client.js";

export async function processSyncAccount(publisher: EventPublisher, data: SyncAccountJobData) {
  const { workspaceId, accountId, syncJobId } = data;

  const account = await prisma.account.findFirst({
    where: { id: accountId, workspaceId },
    include: { connectorDefinition: true }
  });

  if (!account) {
    await prisma.connectorSyncJob.update({
      where: { id: syncJobId },
      data: { status: "failed", error: "Account not found", finishedAt: new Date() }
    });
    return;
  }

  const connector = connectorRegistry.get(account.connectorDefinition.slug);
  const connectorSlug = connector.definition.slug;
  const logger = createConnectorLogger(workspaceId, accountId, connectorSlug);

  await prisma.connectorSyncJob.update({ where: { id: syncJobId }, data: { status: "running", startedAt: new Date() } });
  await publisher.publish(workspaceId, "account.sync_started", { accountId, syncJobId });

  const credentials = await loadAccountCredentials(accountId);
  const ctx = { workspaceId, accountId, credentials, logger };

  try {
    const balances = connector.syncBalances ? await connector.syncBalances(ctx) : [];
    const deals = connector.syncDeals ? await connector.syncDeals(ctx) : { items: [], hasMore: false };
    const ads = connector.syncAds ? await connector.syncAds(ctx) : { items: [], hasMore: false };

    for (const balance of balances) {
      await prisma.balance.upsert({
        where: { accountId_asset: { accountId, asset: balance.asset } },
        create: {
          workspaceId,
          accountId,
          asset: balance.asset,
          availableAmount: new Prisma.Decimal(balance.availableAmount),
          lockedAmount: new Prisma.Decimal(balance.lockedAmount),
          totalAmount: new Prisma.Decimal(balance.totalAmount),
          valuationFiat: balance.valuationFiat,
          valuationAmount: balance.valuationAmount ? new Prisma.Decimal(balance.valuationAmount) : null,
          syncedAt: new Date(balance.syncedAt)
        },
        update: {
          availableAmount: new Prisma.Decimal(balance.availableAmount),
          lockedAmount: new Prisma.Decimal(balance.lockedAmount),
          totalAmount: new Prisma.Decimal(balance.totalAmount),
          valuationFiat: balance.valuationFiat,
          valuationAmount: balance.valuationAmount ? new Prisma.Decimal(balance.valuationAmount) : null,
          syncedAt: new Date(balance.syncedAt)
        }
      });
      await publisher.publish(workspaceId, "balance.updated", { balance });
      await runAutomationForEvent(publisher, {
        workspaceId,
        eventType: "balance.updated",
        input: { ...balance }
      });
    }

    for (const deal of deals.items) {
      if (!deal.externalId) {
        await createConnectorLog(workspaceId, accountId, connectorSlug, "warn", "Skipped deal without external id", { deal });
        continue;
      }

      const existing = await prisma.deal.findUnique({
        where: { accountId_externalId: { accountId, externalId: deal.externalId } }
      });

      await prisma.deal.upsert({
        where: { accountId_externalId: { accountId, externalId: deal.externalId } },
        create: {
          workspaceId,
          accountId,
          platformId: account.platformId,
          externalId: deal.externalId,
          side: deal.side,
          cryptoAsset: deal.cryptoAsset,
          fiatAsset: deal.fiatAsset,
          cryptoAmount: new Prisma.Decimal(deal.cryptoAmount),
          fiatAmount: new Prisma.Decimal(deal.fiatAmount),
          price: new Prisma.Decimal(deal.price),
          feeAmount: deal.feeAmount ? new Prisma.Decimal(deal.feeAmount) : null,
          feeAsset: deal.feeAsset,
          profitAmount: deal.profitAmount ? new Prisma.Decimal(deal.profitAmount) : null,
          profitAsset: deal.profitAsset,
          counterpartyName: deal.counterpartyName,
          status: deal.status,
          externalStatus: deal.externalStatus,
          openedAt: deal.openedAt ? new Date(deal.openedAt) : null,
          lastSyncJobId: syncJobId,
          rawPayload: deal.rawPayload as Prisma.InputJsonValue
        },
        update: {
          status: deal.status,
          externalStatus: deal.externalStatus,
          lastSyncJobId: syncJobId,
          rawPayload: deal.rawPayload as Prisma.InputJsonValue
        }
      });

      const eventType = existing ? "deal.updated" : "deal.created";
      await publisher.publish(workspaceId, eventType, { deal });
      await runAutomationForEvent(publisher, { workspaceId, eventType, input: { ...deal } });
    }

    for (const ad of ads.items) {
      if (!ad.externalId) {
        await createConnectorLog(workspaceId, accountId, connectorSlug, "warn", "Skipped ad without external id", { ad });
        continue;
      }

      await prisma.ad.upsert({
        where: { accountId_externalId: { accountId, externalId: ad.externalId } },
        create: {
          workspaceId,
          accountId,
          platformId: account.platformId,
          externalId: ad.externalId,
          side: ad.side,
          cryptoAsset: ad.cryptoAsset,
          fiatAsset: ad.fiatAsset,
          price: new Prisma.Decimal(ad.price),
          minLimit: ad.minLimit ? new Prisma.Decimal(ad.minLimit) : null,
          maxLimit: ad.maxLimit ? new Prisma.Decimal(ad.maxLimit) : null,
          availableAmount: ad.availableAmount ? new Prisma.Decimal(ad.availableAmount) : null,
          status: ad.status,
          externalStatus: ad.externalStatus,
          lastUpdateAt: new Date(),
          rawPayload: ad.rawPayload as Prisma.InputJsonValue
        },
        update: {
          price: new Prisma.Decimal(ad.price),
          status: ad.status,
          externalStatus: ad.externalStatus,
          lastUpdateAt: new Date(),
          rawPayload: ad.rawPayload as Prisma.InputJsonValue
        }
      });

      await publisher.publish(workspaceId, "ad.updated", { ad });
      await runAutomationForEvent(publisher, { workspaceId, eventType: "ad.updated", input: { ...ad } });
    }

    await prisma.account.update({ where: { id: accountId }, data: { lastSyncAt: new Date(), lastError: null, status: "active" } });

    const stats = { balances: balances.length, deals: deals.items.length, ads: ads.items.length };
    await prisma.connectorSyncJob.update({
      where: { id: syncJobId },
      data: { status: "succeeded", finishedAt: new Date(), stats }
    });

    await publisher.publish(workspaceId, "account.sync_finished", { accountId, syncJobId, stats });
    await runAutomationForEvent(publisher, {
      workspaceId,
      eventType: "account.sync_finished",
      input: { accountId, syncJobId, ...stats }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";

    await prisma.account.update({ where: { id: accountId }, data: { lastError: message, status: "error" } });
    await prisma.connectorSyncJob.update({
      where: { id: syncJobId },
      data: { status: "failed", finishedAt: new Date(), error: message }
    });

    await publisher.publish(workspaceId, "account.sync_failed", { accountId, syncJobId, error: message });
    await runAutomationForEvent(publisher, {
      workspaceId,
      eventType: "account.sync_failed",
      input: { accountId, syncJobId, error: message }
    });
  }
}
