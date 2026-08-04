import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppEvent } from "@p2phunt/shared";
import { WORKER_EVENTS_CHANNEL } from "@p2phunt/shared";
import { Redis } from "ioredis";
import { WorkspaceGateway } from "../realtime/workspace.gateway.js";

@Injectable()
export class RedisEventsSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisEventsSubscriber.name);
  private subscriber?: Redis;

  constructor(
    private readonly config: ConfigService,
    private readonly gateway: WorkspaceGateway
  ) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>("REDIS_URL", "redis://localhost:6379");
    this.subscriber = new Redis(redisUrl, { maxRetriesPerRequest: null });

    this.subscriber.subscribe(WORKER_EVENTS_CHANNEL).catch((error) => {
      this.logger.error(`Failed to subscribe to ${WORKER_EVENTS_CHANNEL}`, error);
    });

    this.subscriber.on("message", (_channel, message) => {
      try {
        const event = JSON.parse(message) as AppEvent;
        this.gateway.emitToWorkspace(event.workspaceId, event.type, event);
      } catch (error) {
        this.logger.error("Failed to relay worker event", error);
      }
    });
  }

  async onModuleDestroy() {
    await this.subscriber?.quit();
  }
}
