import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

const TREND_DAYS = 14;
const DEAL_LOOKBACK = 5000;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(workspaceId: string) {
    const [
      workspace,
      accounts,
      accountsNeedingAttention,
      activeDeals,
      completedDeals,
      balances,
      rates,
      platforms,
      deals,
      ads,
      recentLogs,
      unreadNotifications,
      activeAutomationRules
    ] = await Promise.all([
      this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
      this.prisma.account.count({ where: { workspaceId, archivedAt: null } }),
      this.prisma.account.count({
        where: { workspaceId, archivedAt: null, status: { in: ["error", "reauth_required"] } }
      }),
      this.prisma.deal.count({
        where: { workspaceId, status: { in: ["new", "pending", "payment_pending", "paid", "appeal"] } }
      }),
      this.prisma.deal.count({ where: { workspaceId, status: "completed" } }),
      this.prisma.balance.findMany({
        where: { workspaceId },
        include: { account: { select: { id: true, name: true, color: true, status: true, platform: { select: { slug: true, name: true } } } } },
        orderBy: [{ asset: "asc" }]
      }),
      this.prisma.currentRate.findMany({ where: { workspaceId } }),
      this.prisma.platform.findMany({ select: { id: true, slug: true, name: true } }),
      this.prisma.deal.findMany({
        where: { workspaceId },
        select: {
          side: true,
          status: true,
          fiatAsset: true,
          fiatAmount: true,
          profitAmount: true,
          profitAsset: true,
          createdAt: true,
          platformId: true
        },
        orderBy: { createdAt: "desc" },
        take: DEAL_LOOKBACK
      }),
      this.prisma.ad.findMany({
        where: { workspaceId, status: "active" },
        select: { side: true, platformId: true }
      }),
      this.prisma.connectorLog.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 8
      }),
      this.prisma.notification.count({ where: { workspaceId, status: "unread" } }),
      this.prisma.automationRule.count({ where: { workspaceId, enabled: true } })
    ]);

    const platformById = new Map(platforms.map((p) => [p.id, p]));

    // --- Home fiat + valuation: only ever convert an asset using a CurrentRate row that was
    // actually configured for it (baseAsset -> homeFiat) — never invent a conversion, so an
    // asset with no configured rate simply shows as unpriced rather than a fabricated number.
    const quoteFrequency = new Map<string, number>();
    for (const r of rates) quoteFrequency.set(r.quoteAsset, (quoteFrequency.get(r.quoteAsset) ?? 0) + 1);
    const homeFiat = [...quoteFrequency.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const rateToHomeFiat = new Map(rates.filter((r) => r.quoteAsset === homeFiat).map((r) => [r.baseAsset, Number(r.mid)]));

    const priceOf = (asset: string): number | null => rateToHomeFiat.get(asset) ?? null;

    // --- Balances grouped by asset (across all accounts)
    const byAsset = new Map<string, { totalAmount: number; accountIds: Set<string> }>();
    for (const b of balances) {
      const entry = byAsset.get(b.asset) ?? { totalAmount: 0, accountIds: new Set<string>() };
      entry.totalAmount += Number(b.totalAmount);
      entry.accountIds.add(b.accountId);
      byAsset.set(b.asset, entry);
    }
    const balancesByAsset = [...byAsset.entries()]
      .map(([asset, v]) => {
        const price = priceOf(asset);
        return {
          asset,
          totalAmount: String(v.totalAmount),
          accountCount: v.accountIds.size,
          valuation: price !== null ? String(v.totalAmount * price) : null
        };
      })
      .sort((a, b) => Number(b.valuation ?? 0) - Number(a.valuation ?? 0) || b.totalAmount.localeCompare(a.totalAmount));

    // --- Balances grouped by account
    const byAccount = new Map<
      string,
      { name: string; color: string | null; status: string; platform: { slug: string; name: string }; assets: Map<string, number> }
    >();
    for (const b of balances) {
      if (!b.account) continue;
      const entry = byAccount.get(b.accountId) ?? {
        name: b.account.name,
        color: b.account.color,
        status: b.account.status,
        platform: b.account.platform,
        assets: new Map<string, number>()
      };
      entry.assets.set(b.asset, (entry.assets.get(b.asset) ?? 0) + Number(b.totalAmount));
      byAccount.set(b.accountId, entry);
    }
    const balancesByAccount = [...byAccount.entries()].map(([accountId, v]) => {
      const assetList = [...v.assets.entries()].map(([asset, totalAmount]) => ({ asset, totalAmount: String(totalAmount) }));
      const priced = assetList.map((a) => priceOf(a.asset) !== null ? Number(a.totalAmount) * (priceOf(a.asset) as number) : 0);
      const anyPriced = assetList.some((a) => priceOf(a.asset) !== null);
      return {
        accountId,
        accountName: v.name,
        accountColor: v.color,
        accountStatus: v.status,
        platform: v.platform,
        assets: assetList,
        totalValuation: anyPriced ? String(priced.reduce((a, b) => a + b, 0)) : null
      };
    });

    const pricedAssetCount = balancesByAsset.filter((a) => a.valuation !== null).length;
    const totalValuation = balancesByAsset.reduce((sum, a) => sum + Number(a.valuation ?? 0), 0);

    // --- Deal stats
    const volumeByFiat = new Map<string, number>();
    const profitByAsset = new Map<string, number>();
    const dealsByPlatform = new Map<string, number>();
    let buyCount = 0;
    let sellCount = 0;
    let terminal = 0; // completed + cancelled + expired + failed, for a completion-rate denominator

    for (const d of deals) {
      if (d.status === "completed") {
        volumeByFiat.set(d.fiatAsset, (volumeByFiat.get(d.fiatAsset) ?? 0) + Number(d.fiatAmount));
      }
      if (d.profitAmount !== null && d.profitAsset) {
        profitByAsset.set(d.profitAsset, (profitByAsset.get(d.profitAsset) ?? 0) + Number(d.profitAmount));
      }
      if (d.side === "buy") buyCount += 1;
      else sellCount += 1;
      if (["completed", "cancelled", "expired", "failed"].includes(d.status)) terminal += 1;

      const platform = platformById.get(d.platformId);
      const platformKey = platform?.name ?? "Неизвестно";
      dealsByPlatform.set(platformKey, (dealsByPlatform.get(platformKey) ?? 0) + 1);
    }

    const dealStats = {
      totalVolumeByFiat: [...volumeByFiat.entries()].map(([fiatAsset, amount]) => ({ fiatAsset, amount: String(amount) })),
      profitByAsset: [...profitByAsset.entries()].map(([asset, amount]) => ({ asset, amount: String(amount) })),
      buyCount,
      sellCount,
      completionRate: terminal > 0 ? Math.round((completedDeals / terminal) * 1000) / 10 : null,
      byPlatform: [...dealsByPlatform.entries()].map(([platform, count]) => ({ platform, count })).sort((a, b) => b.count - a.count)
    };

    // --- Deal trend: last TREND_DAYS days, total vs completed, bucketed by local date
    const trendBuckets = new Map<string, { total: number; completed: number }>();
    const today = new Date();
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      trendBuckets.set(d.toISOString().slice(0, 10), { total: 0, completed: 0 });
    }
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - TREND_DAYS);
    for (const d of deals) {
      if (d.createdAt < cutoff) continue;
      const key = d.createdAt.toISOString().slice(0, 10);
      const bucket = trendBuckets.get(key);
      if (!bucket) continue;
      bucket.total += 1;
      if (d.status === "completed") bucket.completed += 1;
    }
    const dealsTrend = [...trendBuckets.entries()].map(([date, v]) => ({ date, ...v }));

    // --- Ads by platform
    const adsByPlatformMap = new Map<string, { buy: number; sell: number }>();
    for (const ad of ads) {
      const platform = platformById.get(ad.platformId);
      const key = platform?.name ?? "Неизвестно";
      const entry = adsByPlatformMap.get(key) ?? { buy: 0, sell: 0 };
      if (ad.side === "buy") entry.buy += 1;
      else entry.sell += 1;
      adsByPlatformMap.set(key, entry);
    }
    const adsByPlatform = [...adsByPlatformMap.entries()].map(([platform, v]) => ({ platform, ...v }));

    // --- Per-account summary
    const accountsList = await this.prisma.account.findMany({
      where: { workspaceId, archivedAt: null },
      include: {
        platform: { select: { slug: true, name: true } },
        _count: { select: { deals: true, ads: true, balances: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    const accountsSummary = accountsList.map((a) => ({
      id: a.id,
      name: a.name,
      color: a.color,
      status: a.status,
      platform: a.platform,
      dealCount: a._count.deals,
      adCount: a._count.ads,
      balanceCount: a._count.balances,
      lastSyncAt: a.lastSyncAt,
      lastError: a.lastError
    }));

    return {
      workspace: { id: workspace.id, name: workspace.name, mode: workspace.mode, emergencyStop: workspace.emergencyStop },
      accounts,
      accountsNeedingAttention,
      activeDeals,
      completedDeals,
      openAds: ads.length,
      unreadNotifications,
      activeAutomationRules,
      recentLogs,

      portfolio: { homeFiat, totalValuation: String(totalValuation), pricedAssetCount, totalAssetCount: balancesByAsset.length },
      balancesByAsset,
      balancesByAccount,
      dealStats,
      dealsTrend,
      adsByPlatform,
      accountsSummary
    };
  }
}
