import { randomUUID } from "node:crypto";
import type { AppEvent, EventPayloadMap, EventType } from "@p2phunt/shared";
import { notifiableEventTitles, WORKER_EVENTS_CHANNEL } from "@p2phunt/shared";
import type { Prisma } from "@prisma/client";
import type { Redis } from "ioredis";
import { prisma } from "../prisma/client.js";

export class EventPublisher {
  constructor(private readonly redis: Redis) {}

  async publish<T extends EventType>(workspaceId: string, type: T, payload: EventPayloadMap[T]): Promise<AppEvent> {
    const event: AppEvent = {
      id: randomUUID(),
      type,
      workspaceId,
      occurredAt: new Date().toISOString(),
      version: 1,
      payload: payload as Record<string, unknown>
    };

    await this.redis.publish(WORKER_EVENTS_CHANNEL, JSON.stringify(event));

    const notifiable = notifiableEventTitles[type];
    if (notifiable) {
      await prisma.notification.create({
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
