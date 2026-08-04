import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateChannelDto, UpdateChannelDto } from "./dto.js";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string, status?: string) {
    return this.prisma.notification.findMany({
      where: { workspaceId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take: 200
    });
  }

  async markRead(workspaceId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, workspaceId } });
    if (!notification) throw new NotFoundException("Уведомление не найдено");
    return this.prisma.notification.update({ where: { id }, data: { status: "read", readAt: new Date() } });
  }

  async markAllRead(workspaceId: string) {
    await this.prisma.notification.updateMany({
      where: { workspaceId, status: "unread" },
      data: { status: "read", readAt: new Date() }
    });
    return { ok: true };
  }

  async listChannels(workspaceId: string) {
    return this.prisma.notificationChannel.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  }

  async createChannel(workspaceId: string, dto: CreateChannelDto) {
    return this.prisma.notificationChannel.create({
      data: { workspaceId, type: dto.type, name: dto.name, config: dto.config as Prisma.InputJsonValue }
    });
  }

  async updateChannel(workspaceId: string, id: string, dto: UpdateChannelDto) {
    const channel = await this.prisma.notificationChannel.findFirst({ where: { id, workspaceId } });
    if (!channel) throw new NotFoundException("Канал не найден");
    return this.prisma.notificationChannel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.config !== undefined ? { config: dto.config as Prisma.InputJsonValue } : {}),
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {})
      }
    });
  }

  async removeChannel(workspaceId: string, id: string) {
    const channel = await this.prisma.notificationChannel.findFirst({ where: { id, workspaceId } });
    if (!channel) throw new NotFoundException("Канал не найден");
    await this.prisma.notificationChannel.delete({ where: { id } });
    return { ok: true };
  }
}
