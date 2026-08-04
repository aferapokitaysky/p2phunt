import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(workspaceId: string) {
    const [workspace, accounts, accountsNeedingAttention, activeDeals, completedDeals, balances, ads, recentLogs, unreadNotifications, activeAutomationRules] =
      await Promise.all([
        this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
        this.prisma.account.count({ where: { workspaceId, archivedAt: null } }),
        this.prisma.account.count({
          where: { workspaceId, archivedAt: null, status: { in: ["error", "reauth_required"] } }
        }),
        this.prisma.deal.count({
          where: {
            workspaceId,
            status: { in: ["new", "pending", "payment_pending", "paid", "appeal"] }
          }
        }),
        this.prisma.deal.count({ where: { workspaceId, status: "completed" } }),
        this.prisma.balance.findMany({ where: { workspaceId }, orderBy: [{ asset: "asc" }] }),
        this.prisma.ad.count({ where: { workspaceId, status: "active" } }),
        this.prisma.connectorLog.findMany({
          where: { workspaceId },
          orderBy: { createdAt: "desc" },
          take: 5
        }),
        this.prisma.notification.count({ where: { workspaceId, status: "unread" } }),
        this.prisma.automationRule.count({ where: { workspaceId, enabled: true } })
      ]);

    const balancesByAsset = balances.reduce<Record<string, string>>((acc, balance) => {
      const current = Number(acc[balance.asset] ?? 0);
      acc[balance.asset] = String(current + Number(balance.totalAmount));
      return acc;
    }, {});

    return {
      workspace: { id: workspace.id, name: workspace.name, mode: workspace.mode, emergencyStop: workspace.emergencyStop },
      accounts,
      accountsNeedingAttention,
      activeDeals,
      completedDeals,
      openAds: ads,
      balancesByAsset,
      recentLogs,
      unreadNotifications,
      activeAutomationRules
    };
  }
}
