import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { AppEvent, EventPayloadMap, EventType } from "@p2phunt/shared";
import { notifiableEventTitles } from "@p2phunt/shared";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { WorkspaceGateway } from "../realtime/workspace.gateway.js";

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: WorkspaceGateway
  ) {}

  async publish<T extends EventType>(workspaceId: string, type: T, payload: EventPayloadMap[T]) {
    const event: AppEvent = {
      id: randomUUID(),
      type,
      workspaceId,
      occurredAt: new Date().toISOString(),
      version: 1,
      payload: payload as Record<string, unknown>
    };

    this.gateway.emitToWorkspace(workspaceId, type, event);

    const notifiable = notifiableEventTitles[type];
    if (notifiable) {
      await this.prisma.notification.create({
        data: {
          workspaceId,
          channel: "in_app",
          title: notifiable.title,
          body: JSON.stringify(payload),
          severity: notifiable.severity as never,
          metadata: payload as Prisma.InputJsonValue
        }
      });
    }

    return event;
  }
}
