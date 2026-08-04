import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CONNECTOR_QUEUE_NAME,
  EXECUTE_COMMAND_JOB_NAME,
  SYNC_ACCOUNT_JOB_NAME,
  type ExecuteCommandJobData,
  type SyncAccountJobData
} from "@p2phunt/shared";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly connection: Redis;
  readonly connectorQueue: Queue<SyncAccountJobData | ExecuteCommandJobData>;

  constructor(config: ConfigService) {
    const redisUrl = config.get<string>("REDIS_URL", "redis://localhost:6379");
    this.connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
    this.connectorQueue = new Queue(CONNECTOR_QUEUE_NAME, { connection: this.connection });
  }

  async enqueueSync(data: SyncAccountJobData) {
    return this.connectorQueue.add(SYNC_ACCOUNT_JOB_NAME, data, {
      removeOnComplete: 100,
      removeOnFail: 100
    });
  }

  async enqueueCommand(data: ExecuteCommandJobData) {
    return this.connectorQueue.add(EXECUTE_COMMAND_JOB_NAME, data, {
      removeOnComplete: 100,
      removeOnFail: 100
    });
  }

  async onModuleDestroy() {
    await this.connectorQueue.close();
    await this.connection.quit();
  }
}
