import { Injectable, NotFoundException } from "@nestjs/common";
import { DealStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { UpdateDealDto } from "./dto.js";

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async listDeals(workspaceId: string, query: Record<string, string | undefined>) {
    const where: Prisma.DealWhereInput = { workspaceId };

    if (query.status && isDealStatus(query.status)) {
      where.status = query.status;
    }
    if (query.accountId) {
      where.accountId = query.accountId;
    }
    if (query.platformId) {
      where.platformId = query.platformId;
    }
    if (query.side === "buy" || query.side === "sell") {
      where.side = query.side;
    }
    if (query.cryptoAsset) {
      where.cryptoAsset = query.cryptoAsset.toUpperCase();
    }
    if (query.fiatAsset) {
      where.fiatAsset = query.fiatAsset.toUpperCase();
    }
    if (query.search) {
      where.OR = [
        { counterpartyName: { contains: query.search, mode: "insensitive" } },
        { externalId: { contains: query.search, mode: "insensitive" } },
        { comment: { contains: query.search, mode: "insensitive" } }
      ];
    }
    if (query.dateFrom || query.dateTo) {
      where.openedAt = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {})
      };
    }

    const limit = Math.min(Number(query.limit ?? 50) || 50, 200);
    const page = Math.max(Number(query.page ?? 1) || 1, 1);
    const sortField: "openedAt" | "price" | "profitAmount" | "cryptoAmount" =
      query.sortBy && ["openedAt", "price", "profitAmount", "cryptoAmount"].includes(query.sortBy)
        ? (query.sortBy as "openedAt" | "price" | "profitAmount" | "cryptoAmount")
        : "openedAt";
    const sortDir = query.sortDir === "asc" ? "asc" : "desc";

    const [items, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        include: { account: { select: { id: true, name: true, color: true, tags: true } } },
        orderBy: [{ [sortField]: sortDir }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.deal.count({ where })
    ]);

    return { items, page, limit, total };
  }

  async exportDeals(workspaceId: string, query: Record<string, string | undefined>) {
    const { items } = await this.listDeals(workspaceId, { ...query, limit: "5000", page: "1" });
    const header = [
      "id",
      "openedAt",
      "account",
      "side",
      "cryptoAsset",
      "fiatAsset",
      "cryptoAmount",
      "fiatAmount",
      "price",
      "profitAmount",
      "status",
      "counterparty"
    ];
    const rows = items.map((deal) =>
      [
        deal.id,
        deal.openedAt?.toISOString() ?? "",
        deal.account?.name ?? "",
        deal.side,
        deal.cryptoAsset,
        deal.fiatAsset,
        deal.cryptoAmount.toString(),
        deal.fiatAmount.toString(),
        deal.price.toString(),
        deal.profitAmount?.toString() ?? "",
        deal.status,
        deal.counterpartyName ?? ""
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    return [header.join(","), ...rows].join("\n");
  }

  async getDeal(workspaceId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, workspaceId },
      include: {
        account: { select: { id: true, name: true, color: true, tags: true } },
        notes: { orderBy: { createdAt: "desc" } },
        messages: { orderBy: { sentAt: "asc" } }
      }
    });
    if (!deal) throw new NotFoundException("Сделка не найдена");
    return deal;
  }

  async updateDeal(workspaceId: string, id: string, input: UpdateDealDto) {
    await this.assertOwnership(workspaceId, id);
    return this.prisma.deal.update({
      where: { id },
      data: {
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.comment !== undefined ? { comment: input.comment } : {})
      }
    });
  }

  async addNote(workspaceId: string, actorUserId: string, dealId: string, body: string) {
    await this.assertOwnership(workspaceId, dealId);
    return this.prisma.dealNote.create({
      data: { workspaceId, dealId, authorUserId: actorUserId, body }
    });
  }

  async addMessage(
    workspaceId: string,
    dealId: string,
    input: { body: string; direction: "inbound" | "outbound"; senderName?: string }
  ) {
    const deal = await this.assertOwnership(workspaceId, dealId);
    return this.prisma.dealMessage.create({
      data: {
        workspaceId,
        dealId,
        accountId: deal.accountId,
        source: "internal",
        direction: input.direction,
        ...(input.senderName !== undefined ? { senderName: input.senderName } : {}),
        body: input.body
      }
    });
  }

  private async assertOwnership(workspaceId: string, dealId: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id: dealId, workspaceId } });
    if (!deal) throw new NotFoundException("Сделка не найдена");
    return deal;
  }
}

function isDealStatus(value: string): value is DealStatus {
  return Object.values(DealStatus).includes(value as DealStatus);
}
