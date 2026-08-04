import {
  CONNECTOR_QUEUE_NAME,
  EXECUTE_COMMAND_JOB_NAME,
  SYNC_ACCOUNT_JOB_NAME,
  type ExecuteCommandJobData,
  type SyncAccountJobData
} from "@p2phunt/shared";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { EventPublisher } from "./events/publisher.js";
import { processExecuteCommand } from "./jobs/execute-command.js";
import { processSyncAccount } from "./jobs/sync-account.js";
import { prisma } from "./prisma/client.js";
import { connectorQueue, queueConnection } from "./queues/connector-queue.js";

/**
 * ENCRYPTION_KEY falls back to a well-known dev default (see connectors/credentials.ts) when
 * unset, so local `pnpm dev` works with zero setup. In production that default would let
 * anyone who's read this public repo decrypt every stored exchange API key. Refuse to boot.
 */
if (process.env.NODE_ENV === "production" && process.env.ENCRYPTION_KEY === "change-me-32-byte-minimum-development-key") {
  throw new Error("Refusing to start in production with the dev-default ENCRYPTION_KEY. Set a real value for this environment variable before deploying.");
}

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const workerConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });
const publisherConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });
const publisher = new EventPublisher(publisherConnection);

const worker = new Worker<SyncAccountJobData | ExecuteCommandJobData>(
  CONNECTOR_QUEUE_NAME,
  async (job) => {
    if (job.name === SYNC_ACCOUNT_JOB_NAME) {
      await processSyncAccount(publisher, job.data as SyncAccountJobData);
      return { ok: true, jobId: job.id, processedAt: new Date().toISOString() };
    }
    if (job.name === EXECUTE_COMMAND_JOB_NAME) {
      await processExecuteCommand(publisher, job.data as ExecuteCommandJobData);
      return { ok: true, jobId: job.id, processedAt: new Date().toISOString() };
    }
    throw new Error(`Unknown connector job: ${job.name}`);
  },
  { connection: workerConnection, concurrency: 5 }
);

worker.on("completed", (job) => {
  console.log(`job completed: ${job.name}:${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`job failed: ${job?.name}:${job?.id}`, error);
});

async function shutdown() {
  console.log("P2PHunt worker shutting down...");
  await worker.close();
  await connectorQueue.close();
  await queueConnection.quit();
  await workerConnection.quit();
  await publisherConnection.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

console.log("P2PHunt worker is running");
