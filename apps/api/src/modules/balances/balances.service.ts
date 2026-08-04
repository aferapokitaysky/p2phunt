import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class BalancesService {
  constructor(private readonly prisma: PrismaService) {}

  async listBalances(workspaceId: string, query: { accountId?: string | undefined; asset?: string | undefined }) {
    const balances = await this.prisma.balance.findMany({
      where: {
        workspaceId,
        ...(query.accountId ? { accountId: query.accountId } : {}),
        ...(query.asset ? { asset: query.asset.toUpperCase() } : {})
      },
      include: { account: { select: { id: true, name: true, color: true, platformId: true } } },
      orderBy: [{ asset: "asc" }]
    });

    const groupedByAsset = new Map<string, { asset: string; totalAmount: number; valuationAmount: number }>();
    for (const balance of balances) {
      const entry = groupedByAsset.get(balance.asset) ?? { asset: balance.asset, totalAmount: 0, valuationAmount: 0 };
      entry.totalAmount += Number(balance.totalAmount);
      entry.valuationAmount += Number(balance.valuationAmount ?? 0);
      groupedByAsset.set(balance.asset, entry);
    }

    return {
      items: balances,
      byAsset: [...groupedByAsset.values()]
    };
  }
}
