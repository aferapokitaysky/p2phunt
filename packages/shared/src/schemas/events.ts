import { z } from "zod";
import { accountStatusSchema, adDtoSchema, balanceDtoSchema, dealDtoSchema, rateDtoSchema } from "./domain.js";

export const eventTypeSchema = z.enum([
  "account.created",
  "account.sync_started",
  "account.sync_finished",
  "account.sync_failed",
  "account.status_changed",
  "deal.created",
  "deal.updated",
  "balance.updated",
  "rate.updated",
  "ad.updated",
  "rule.triggered",
  "rule.executed",
  "notification.created",
  "connector.command_updated",
  "connector.command_failed"
]);

export const appEventSchema = z.object({
  id: z.string().uuid(),
  type: eventTypeSchema,
  workspaceId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  version: z.literal(1),
  payload: z.record(z.string(), z.unknown())
});

export type EventType = z.infer<typeof eventTypeSchema>;
export type AppEvent = z.infer<typeof appEventSchema>;

/** Redis pub/sub channel used to relay events from the worker process to the API's WebSocket gateway. */
export const WORKER_EVENTS_CHANNEL = "p2phunt:events";

/**
 * Per-event-type payload shapes. The wire envelope (`appEventSchema`) keeps `payload`
 * loosely typed for forward-compatibility, but producers/consumers within the app
 * should construct/read payloads through this map for type safety.
 */
export const eventPayloadSchemas = {
  "account.created": z.object({ accountId: z.string().uuid(), platform: z.string() }),
  "account.sync_started": z.object({ accountId: z.string().uuid(), syncJobId: z.string().uuid() }),
  "account.sync_finished": z.object({
    accountId: z.string().uuid(),
    syncJobId: z.string().uuid(),
    stats: z.object({ balances: z.number(), deals: z.number(), ads: z.number() })
  }),
  "account.sync_failed": z.object({
    accountId: z.string().uuid(),
    syncJobId: z.string().uuid().optional(),
    error: z.string()
  }),
  "account.status_changed": z.object({
    accountId: z.string().uuid(),
    status: accountStatusSchema
  }),
  "deal.created": z.object({ deal: dealDtoSchema }),
  "deal.updated": z.object({ deal: dealDtoSchema, changedFields: z.array(z.string()).optional() }),
  "balance.updated": z.object({ balance: balanceDtoSchema }),
  "rate.updated": z.object({ rate: rateDtoSchema }),
  "ad.updated": z.object({ ad: adDtoSchema }),
  "rule.triggered": z.object({ ruleId: z.string().uuid(), triggerType: z.string() }),
  "rule.executed": z.object({
    ruleId: z.string().uuid(),
    executionId: z.string().uuid(),
    status: z.string()
  }),
  "notification.created": z.object({ notificationId: z.string().uuid(), severity: z.string(), title: z.string() }),
  "connector.command_updated": z.object({ commandId: z.string().uuid(), status: z.string() }),
  "connector.command_failed": z.object({ commandId: z.string().uuid(), error: z.string() })
} as const satisfies Partial<Record<EventType, z.ZodTypeAny>>;

export type EventPayloadMap = {
  [K in keyof typeof eventPayloadSchemas]: z.infer<(typeof eventPayloadSchemas)[K]>;
};

/**
 * Events that should also create a persisted in-app Notification. Shared between the API
 * (events originating in-process) and the worker (events originating from background jobs)
 * so the notification rules stay consistent regardless of which process publishes the event.
 */
export const notifiableEventTitles: Partial<Record<EventType, { title: string; severity: string }>> = {
  "account.sync_failed": { title: "Ошибка синхронизации аккаунта", severity: "error" },
  "account.status_changed": { title: "Статус аккаунта изменён", severity: "warning" },
  "connector.command_failed": { title: "Ошибка команды коннектора", severity: "error" },
  "rule.executed": { title: "Правило автоматизации выполнено", severity: "info" }
};
