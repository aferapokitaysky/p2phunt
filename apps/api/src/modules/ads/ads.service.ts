import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service.js";
import { CommandsService } from "../commands/commands.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { QueueService } from "../queue/queue.service.js";
import { UpdateAdPriceDto } from "./dto.js";

@Injectable()
export class AdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commands: CommandsService,
    private readonly audit: AuditService,
    private readonly queue: QueueService
  ) {}

  async listAds(workspaceId: string, accountId?: string) {
    return this.prisma.ad.findMany({
      where: { workspaceId, ...(accountId ? { accountId } : {}) },
      include: { account: { select: { id: true, name: true, color: true } } },
      orderBy: { updatedAt: "desc" }
    });
  }

  async updatePrice(workspaceId: string, actorUserId: string, adId: string, dto: UpdateAdPriceDto) {
    const ad = await this.assertOwnership(workspaceId, adId);
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: ad.accountId },
      include: { connectorDefinition: true }
    });

    const command = await this.commands.createCommand({
      workspaceId,
      accountId: ad.accountId,
      connectorSlug: account.connectorDefinition.slug,
      type: "ads.update_price",
      reason: "manual",
      input: { adExternalId: ad.externalId, price: dto.price }
    });
    await this.queue.enqueueCommand({ commandId: command.id });

    await this.audit.record({
      workspaceId,
      actorUserId,
      actorType: "user",
      action: "ad.update_price_requested",
      entityType: "Ad",
      entityId: adId,
      after: { price: dto.price, commandId: command.id }
    });

    return command;
  }

  async setEnabled(workspaceId: string, actorUserId: string, adId: string, enabled: boolean) {
    const ad = await this.assertOwnership(workspaceId, adId);
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: ad.accountId },
      include: { connectorDefinition: true }
    });

    const command = await this.commands.createCommand({
      workspaceId,
      accountId: ad.accountId,
      connectorSlug: account.connectorDefinition.slug,
      type: enabled ? "ads.enable" : "ads.disable",
      reason: "manual",
      input: { adExternalId: ad.externalId }
    });
    await this.queue.enqueueCommand({ commandId: command.id });

    await this.audit.record({
      workspaceId,
      actorUserId,
      actorType: "user",
      action: enabled ? "ad.enable_requested" : "ad.disable_requested",
      entityType: "Ad",
      entityId: adId,
      after: { commandId: command.id }
    });

    return command;
  }

  async bulkPreview(workspaceId: string, adIds: string[], priceDeltaPercent: number) {
    const ads = await this.prisma.ad.findMany({ where: { id: { in: adIds }, workspaceId } });
    if (ads.length !== adIds.length) {
      throw new BadRequestException("Некоторые объявления не найдены в этом рабочем пространстве");
    }

    return ads.map((ad) => {
      const currentPrice = Number(ad.price);
      const newPrice = currentPrice * (1 + priceDeltaPercent / 100);
      return {
        adId: ad.id,
        externalId: ad.externalId,
        currentPrice,
        newPrice: Number(newPrice.toFixed(8)),
        deltaPercent: priceDeltaPercent
      };
    });
  }

  async bulkUpdatePrice(workspaceId: string, actorUserId: string, adIds: string[], priceDeltaPercent: number) {
    const preview = await this.bulkPreview(workspaceId, adIds, priceDeltaPercent);
    const results = [];
    for (const item of preview) {
      const command = await this.updatePrice(workspaceId, actorUserId, item.adId, {
        price: item.newPrice.toString()
      });
      results.push({ adId: item.adId, commandId: command.id });
    }
    return results;
  }

  private async assertOwnership(workspaceId: string, adId: string) {
    const ad = await this.prisma.ad.findFirst({ where: { id: adId, workspaceId } });
    if (!ad) throw new NotFoundException("Объявление не найдено");
    return ad;
  }
}
