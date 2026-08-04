import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateMarkupRuleDto, UpdateMarkupRuleDto } from "./dto.js";

@Injectable()
export class MarkupsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string) {
    return this.prisma.markupRule.findMany({ where: { workspaceId }, orderBy: [{ scopeType: "asc" }, { priority: "asc" }] });
  }

  async create(workspaceId: string, dto: CreateMarkupRuleDto) {
    return this.prisma.markupRule.create({
      data: {
        workspaceId,
        scopeType: dto.scopeType,
        ...(dto.scopeId !== undefined ? { scopeId: dto.scopeId } : {}),
        ...(dto.baseAsset !== undefined ? { baseAsset: dto.baseAsset.toUpperCase() } : {}),
        ...(dto.quoteAsset !== undefined ? { quoteAsset: dto.quoteAsset.toUpperCase() } : {}),
        ...(dto.side !== undefined ? { side: dto.side } : {}),
        markupType: dto.markupType,
        value: new Prisma.Decimal(dto.value),
        priority: dto.priority ?? 100
      }
    });
  }

  async update(workspaceId: string, id: string, dto: UpdateMarkupRuleDto) {
    await this.assertOwnership(workspaceId, id);
    return this.prisma.markupRule.update({
      where: { id },
      data: {
        ...(dto.value !== undefined ? { value: new Prisma.Decimal(dto.value) } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {})
      }
    });
  }

  async remove(workspaceId: string, id: string) {
    await this.assertOwnership(workspaceId, id);
    await this.prisma.markupRule.delete({ where: { id } });
    return { ok: true };
  }

  private async assertOwnership(workspaceId: string, id: string) {
    const rule = await this.prisma.markupRule.findFirst({ where: { id, workspaceId } });
    if (!rule) throw new NotFoundException("Правило наценки не найдено");
    return rule;
  }
}
