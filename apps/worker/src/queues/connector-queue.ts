import { CONNECTOR_QUEUE_NAME, EXECUTE_COMMAND_JOB_NAME, type ExecuteCommandJobData } from "@p2phunt/shared";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
export const queueConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });
export const connectorQueue = new Queue(CONNECTOR_QUEUE_NAME, { connection: queueConnection });

export async function enqueueCommand(data: ExecuteCommandJobData) {
  return connectorQueue.add(EXECUTE_COMMAND_JOB_NAME, data, { removeOnComplete: 100, removeOnFail: 100 });
}
