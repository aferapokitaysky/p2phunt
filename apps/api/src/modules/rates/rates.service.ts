import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { EventsService } from "../events/events.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateRateSourceDto, ManualOverrideDto, UpdateRateSourceDto } from "./dto.js";

@Injectable()
export class RatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService
  ) {}

  async listSources(workspaceId: string) {
    return this.prisma.rateSource.findMany({ where: { workspaceId }, orderBy: { priority: "asc" } });
  }

  async createSource(workspaceId: string, dto: CreateRateSourceDto) {
    return this.prisma.rateSource.create({
      data: {
        workspaceId,
        slug: dto.slug,
        name: dto.name,
        priority: dto.priority,
        refreshIntervalMs: dto.refreshIntervalMs,
        config: dto.config as Prisma.InputJsonValue
      }
    });
  }

  async updateSource(workspaceId: string, id: string, dto: UpdateRateSourceDto) {
    await this.assertSourceOwnership(workspaceId, id);
    return this.prisma.rateSource.update({
      where: { id },
      data: dto
    });
  }

  async current(workspaceId: string, baseAsset?: string, quoteAsset?: string) {
    return this.prisma.currentRate.findMany({
      where: {
        workspaceId,
        ...(baseAsset ? { baseAsset: baseAsset.toUpperCase() } : {}),
        ...(quoteAsset ? { quoteAsset: quoteAsset.toUpperCase() } : {})
      },
      include: { source: { select: { slug: true, name: true, status: true } } },
      orderBy: [{ baseAsset: "asc" }, { quoteAsset: "asc" }]
    });
  }

  async history(workspaceId: string, baseAsset: string, quoteAsset: string, limit = 500) {
    return this.prisma.rateTick.findMany({
      where: { workspaceId, baseAsset: baseAsset.toUpperCase(), quoteAsset: quoteAsset.toUpperCase() },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 2000)
    });
  }

  async ingestTick(
    workspaceId: string,
    sourceId: string,
    input: { baseAsset: string; quoteAsset: string; bid?: string; ask?: string; mid: string; sourceTimestamp?: string }
  ) {
    const source = await this.prisma.rateSource.findFirstOrThrow({ where: { id: sourceId, workspaceId } });

    await this.prisma.rateTick.create({
      data: {
        workspaceId,
        sourceId,
        baseAsset: input.baseAsset.toUpperCase(),
        quoteAsset: input.quoteAsset.toUpperCase(),
        bid: input.bid ? new Prisma.Decimal(input.bid) : null,
        ask: input.ask ? new Prisma.Decimal(input.ask) : null,
        mid: new Prisma.Decimal(input.mid),
        sourceTimestamp: input.sourceTimestamp ? new Date(input.sourceTimestamp) : new Date()
      }
    });

    const existingCurrent = await this.prisma.currentRate.findUnique({
      where: {
        workspaceId_baseAsset_quoteAsset: {
          workspaceId,
          baseAsset: input.baseAsset.toUpperCase(),
          quoteAsset: input.quoteAsset.toUpperCase()
        }
      },
      include: { source: true }
    });

    if (existingCurrent && existingCurrent.selectedBy === "manual") {
      return existingCurrent;
    }
    if (existingCurrent && existingCurrent.source.priority < source.priority) {
      return existingCurrent;
    }

    const updated = await this.prisma.currentRate.upsert({
      where: {
        workspaceId_baseAsset_quoteAsset: {
          workspaceId,
          baseAsset: input.baseAsset.toUpperCase(),
          quoteAsset: input.quoteAsset.toUpperCase()
        }
      },
      create: {
        workspaceId,
        baseAsset: input.baseAsset.toUpperCase(),
        quoteAsset: input.quoteAsset.toUpperCase(),
        sourceId,
        bid: input.bid ? new Prisma.Decimal(input.bid) : null,
        ask: input.ask ? new Prisma.Decimal(input.ask) : null,
        mid: new Prisma.Decimal(input.mid),
        selectedBy: "source"
      },
      update: {
        sourceId,
        bid: input.bid ? new Prisma.Decimal(input.bid) : null,
        ask: input.ask ? new Prisma.Decimal(input.ask) : null,
        mid: new Prisma.Decimal(input.mid),
        selectedBy: "source"
      }
    });

    await this.events.publish(workspaceId, "rate.updated", {
      rate: {
        source: source.slug,
        baseAsset: updated.baseAsset,
        quoteAsset: updated.quoteAsset,
        bid: updated.bid?.toString() ?? null,
        ask: updated.ask?.toString() ?? null,
        mid: updated.mid.toString(),
        sourceTimestamp: new Date().toISOString()
      }
    });

    return updated;
  }

  async manualOverride(workspaceId: string, dto: ManualOverrideDto) {
    const fallbackSource = await this.prisma.rateSource.upsert({
      where: { workspaceId_slug: { workspaceId, slug: "manual" } },
      create: { workspaceId, slug: "manual", name: "Manual Override", priority: 0, refreshIntervalMs: 0 },
      update: {}
    });

    const updated = await this.prisma.currentRate.upsert({
      where: {
        workspaceId_baseAsset_quoteAsset: {
          workspaceId,
          baseAsset: dto.baseAsset.toUpperCase(),
          quoteAsset: dto.quoteAsset.toUpperCase()
        }
      },
      create: {
        workspaceId,
        baseAsset: dto.baseAsset.toUpperCase(),
        quoteAsset: dto.quoteAsset.toUpperCase(),
        sourceId: fallbackSource.id,
        bid: dto.bid ? new Prisma.Decimal(dto.bid) : null,
        ask: dto.ask ? new Prisma.Decimal(dto.ask) : null,
        mid: new Prisma.Decimal(dto.mid),
        selectedBy: "manual"
      },
      update: {
        sourceId: fallbackSource.id,
        bid: dto.bid ? new Prisma.Decimal(dto.bid) : null,
        ask: dto.ask ? new Prisma.Decimal(dto.ask) : null,
        mid: new Prisma.Decimal(dto.mid),
        selectedBy: "manual"
      }
    });

    await this.events.publish(workspaceId, "rate.updated", {
      rate: {
        source: "manual",
        baseAsset: updated.baseAsset,
        quoteAsset: updated.quoteAsset,
        bid: updated.bid?.toString() ?? null,
        ask: updated.ask?.toString() ?? null,
        mid: updated.mid.toString(),
        sourceTimestamp: new Date().toISOString()
      }
    });

    return updated;
  }

  private async assertSourceOwnership(workspaceId: string, id: string) {
    const source = await this.prisma.rateSource.findFirst({ where: { id, workspaceId } });
    if (!source) throw new NotFoundException("Источник курса не найден");
    return source;
  }
}
