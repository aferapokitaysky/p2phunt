import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

export interface PriceQuoteInput {
  baseAsset: string;
  quoteAsset: string;
  side: "buy" | "sell";
  accountId?: string | undefined;
  adId?: string | undefined;
}

const SCOPE_RANK: Record<string, number> = { global: 1, platform: 2, account: 3, ad: 4 };

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveMarkup(workspaceId: string, input: PriceQuoteInput) {
    const rules = await this.prisma.markupRule.findMany({
      where: {
        workspaceId,
        enabled: true,
        AND: [
          { OR: [{ baseAsset: null }, { baseAsset: input.baseAsset.toUpperCase() }] },
          { OR: [{ quoteAsset: null }, { quoteAsset: input.quoteAsset.toUpperCase() }] },
          { OR: [{ side: null }, { side: input.side }] }
        ]
      }
    });

    const applicable = rules.filter((rule) => {
      if (rule.scopeType === "ad") return rule.scopeId === input.adId;
      if (rule.scopeType === "account") return rule.scopeId === input.accountId;
      return true;
    });

    applicable.sort((a, b) => {
      const rankDiff = (SCOPE_RANK[b.scopeType] ?? 0) - (SCOPE_RANK[a.scopeType] ?? 0);
      if (rankDiff !== 0) return rankDiff;
      return a.priority - b.priority;
    });

    return applicable[0] ?? null;
  }

  async quote(workspaceId: string, input: PriceQuoteInput) {
    const currentRate = await this.prisma.currentRate.findUnique({
      where: {
        workspaceId_baseAsset_quoteAsset: {
          workspaceId,
          baseAsset: input.baseAsset.toUpperCase(),
          quoteAsset: input.quoteAsset.toUpperCase()
        }
      }
    });

    if (!currentRate) {
      throw new NotFoundException(`Нет текущего курса для ${input.baseAsset}/${input.quoteAsset}`);
    }

    const markup = await this.resolveMarkup(workspaceId, input);

    const sideRate =
      input.side === "buy"
        ? (currentRate.bid ?? currentRate.mid)
        : (currentRate.ask ?? currentRate.mid);
    const base = Number(sideRate);

    const finalPrice = markup
      ? markup.markupType === "fixed"
        ? base + Number(markup.value)
        : base * (1 + Number(markup.value) / 100)
      : base;

    return {
      baseAsset: input.baseAsset.toUpperCase(),
      quoteAsset: input.quoteAsset.toUpperCase(),
      side: input.side,
      baseRate: base,
      selectedBy: currentRate.selectedBy,
      rateUpdatedAt: currentRate.updatedAt,
      ageMs: Date.now() - currentRate.updatedAt.getTime(),
      markup: markup ? { id: markup.id, scopeType: markup.scopeType, markupType: markup.markupType, value: Number(markup.value) } : null,
      finalPrice: Number(finalPrice.toFixed(8))
    };
  }
}
