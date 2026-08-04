import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service.js";
import { CryptoService } from "../crypto/crypto.service.js";
import { EventsService } from "../events/events.service.js";
import { PlatformsService } from "../platforms/platforms.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { QueueService } from "../queue/queue.service.js";
import { ConnectAccountSecretDto, CreateAccountDto, UpdateAccountDto } from "./dto.js";

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platforms: PlatformsService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
    private readonly queue: QueueService
  ) {}

  async ensurePlatformAndConnector(platformSlug: string, connectorSlug: string) {
    const connector = this.platforms.getConnector(connectorSlug);

    const platform = await this.prisma.platform.upsert({
      where: { slug: platformSlug },
      create: {
        slug: platformSlug,
        name: connector.definition.displayName,
        category: connector.definition.platformCategory
      },
      update: {}
    });

    const connectorDefinition = await this.prisma.connectorDefinition.upsert({
      where: { slug: connectorSlug },
      create: {
        platformId: platform.id,
        slug: connectorSlug,
        version: connector.definition.version,
        capabilities: connector.definition.capabilities,
        authMethods: connector.definition.authMethods
      },
      update: {
        version: connector.definition.version,
        capabilities: connector.definition.capabilities,
        authMethods: connector.definition.authMethods
      }
    });

    return { platform, connectorDefinition };
  }

  async listAccounts(workspaceId: string) {
    return this.prisma.account.findMany({
      where: { workspaceId, archivedAt: null },
      include: {
        platform: true,
        connectorDefinition: true,
        _count: { select: { deals: true, ads: true, balances: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async createAccount(workspaceId: string, actorUserId: string, input: CreateAccountDto) {
    const { platform, connectorDefinition } = await this.ensurePlatformAndConnector(
      input.platform,
      input.connector
    );
    const data: Prisma.AccountUncheckedCreateInput = {
      workspaceId,
      platformId: platform.id,
      connectorDefinitionId: connectorDefinition.id,
      name: input.name,
      color: input.color ?? null,
      groupName: input.groupName ?? null,
      tags: input.tags ?? [],
      status: "active"
    };

    const account = await this.prisma.account.create({
      data,
      include: { platform: true, connectorDefinition: true }
    });

    await this.audit.record({
      workspaceId,
      actorUserId,
      actorType: "user",
      action: "account.created",
      entityType: "Account",
      entityId: account.id,
      after: { name: account.name, platform: input.platform }
    });

    await this.events.publish(workspaceId, "account.created", {
      accountId: account.id,
      platform: input.platform
    });

    return account;
  }

  async getAccount(workspaceId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, workspaceId, archivedAt: null },
      include: {
        platform: true,
        connectorDefinition: true,
        balances: true,
        deals: { orderBy: { createdAt: "desc" }, take: 20 },
        ads: true,
        connectorLogs: { orderBy: { createdAt: "desc" }, take: 50 },
        secrets: { select: { id: true, kind: true, status: true, createdAt: true, rotatedAt: true } }
      }
    });

    if (!account) {
      throw new NotFoundException("Аккаунт не найден");
    }

    return account;
  }

  async updateAccount(workspaceId: string, actorUserId: string, id: string, input: UpdateAccountDto) {
    await this.assertOwnership(workspaceId, id);

    const data: Prisma.AccountUpdateInput = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.color !== undefined) data.color = input.color;
    if (input.groupName !== undefined) data.groupName = input.groupName;
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.mode !== undefined) data.mode = input.mode;

    const account = await this.prisma.account.update({
      where: { id },
      data,
      include: { platform: true, connectorDefinition: true }
    });

    await this.audit.record({
      workspaceId,
      actorUserId,
      actorType: "user",
      action: "account.updated",
      entityType: "Account",
      entityId: id,
      after: input as Record<string, unknown>
    });

    if (input.mode !== undefined) {
      await this.events.publish(workspaceId, "account.status_changed", {
        accountId: id,
        status: account.status
      });
    }

    return account;
  }

  async disableAccount(workspaceId: string, actorUserId: string, id: string) {
    await this.assertOwnership(workspaceId, id);
    const account = await this.prisma.account.update({
      where: { id },
      data: { status: "disabled" }
    });

    await this.audit.record({
      workspaceId,
      actorUserId,
      actorType: "user",
      action: "account.disabled",
      entityType: "Account",
      entityId: id
    });

    await this.events.publish(workspaceId, "account.status_changed", { accountId: id, status: "disabled" });
    return account;
  }

  async archiveAccount(workspaceId: string, actorUserId: string, id: string) {
    await this.assertOwnership(workspaceId, id);
    await this.prisma.account.update({
      where: { id },
      data: { archivedAt: new Date(), status: "archived" }
    });

    await this.audit.record({
      workspaceId,
      actorUserId,
      actorType: "user",
      action: "account.archived",
      entityType: "Account",
      entityId: id
    });

    await this.events.publish(workspaceId, "account.status_changed", { accountId: id, status: "archived" });
    return { ok: true };
  }

  /**
   * Saves the encrypted secret, then immediately calls the connector's own
   * validateCredentials() (a lightweight read-only request against the real API) so a bad
   * key is rejected synchronously in the connect flow instead of only surfacing later as a
   * silent "error" status after the worker's next async sync attempt.
   */
  async setSecret(workspaceId: string, actorUserId: string, id: string, input: ConnectAccountSecretDto) {
    const account = await this.prisma.account.findFirst({
      where: { id, workspaceId },
      include: { connectorDefinition: true }
    });
    if (!account) {
      throw new NotFoundException("Аккаунт не найден");
    }

    const encrypted = this.crypto.encryptToString(JSON.stringify(input.payload));

    const secret = await this.prisma.accountSecret.create({
      data: {
        accountId: id,
        kind: input.kind,
        encryptedPayload: encrypted,
        encryptionKeyVersion: this.crypto.keyVersion
      }
    });

    await this.audit.record({
      workspaceId,
      actorUserId,
      actorType: "user",
      action: "account.secret_set",
      entityType: "AccountSecret",
      entityId: secret.id,
      metadata: { kind: input.kind }
    });

    const connectorSlug = account.connectorDefinition.slug;
    const connector = this.platforms.getConnector(connectorSlug);
    const logger = {
      info: (message: string, metadata?: Record<string, unknown>) => this.logConnector(workspaceId, id, connectorSlug, "info", message, metadata),
      warn: (message: string, metadata?: Record<string, unknown>) => this.logConnector(workspaceId, id, connectorSlug, "warn", message, metadata),
      error: (message: string, metadata?: Record<string, unknown>) => this.logConnector(workspaceId, id, connectorSlug, "error", message, metadata)
    };

    const validation = await connector.validateCredentials({ workspaceId, accountId: id, credentials: input.payload, logger });

    if (!validation.ok) {
      await this.prisma.account.update({
        where: { id },
        data: { status: "error", lastError: validation.reason ?? "Не удалось подтвердить ключ" }
      });
      await this.events.publish(workspaceId, "account.status_changed", { accountId: id, status: "error" });
      throw new BadRequestException(validation.reason ?? "Не удалось подтвердить ключ");
    }

    await this.prisma.account.update({
      where: { id },
      data: { status: "active", lastError: null }
    });
    await this.events.publish(workspaceId, "account.status_changed", { accountId: id, status: "active" });

    return { id: secret.id, kind: secret.kind, status: secret.status, createdAt: secret.createdAt, validated: true };
  }

  private logConnector(
    workspaceId: string,
    accountId: string,
    connectorSlug: string,
    level: string,
    message: string,
    metadata?: Record<string, unknown>
  ) {
    void this.prisma.connectorLog.create({
      data: {
        workspaceId,
        accountId,
        connectorSlug,
        level,
        message,
        ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {})
      }
    });
  }

  async listSyncJobs(workspaceId: string, id: string) {
    await this.assertOwnership(workspaceId, id);
    return this.prisma.connectorSyncJob.findMany({
      where: { workspaceId, accountId: id },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }

  /**
   * Enqueues the actual sync onto the "connector" BullMQ queue instead of running it inline —
   * connector calls can be slow/rate-limited and shouldn't block the HTTP request. The worker
   * picks up the job, does the real work, and reports progress via account.sync_* events
   * relayed over WebSocket (see RedisEventsSubscriber).
   */
  async requestSync(workspaceId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, workspaceId },
      include: { connectorDefinition: true }
    });

    if (!account) {
      throw new NotFoundException("Аккаунт не найден");
    }

    const syncJob = await this.prisma.connectorSyncJob.create({
      data: {
        workspaceId: account.workspaceId,
        accountId: account.id,
        connectorSlug: account.connectorDefinition.slug,
        jobType: "manual_sync",
        status: "queued"
      }
    });

    await this.queue.enqueueSync({ workspaceId: account.workspaceId, accountId: account.id, syncJobId: syncJob.id });

    return syncJob;
  }

  private async assertOwnership(workspaceId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({ where: { id: accountId, workspaceId } });
    if (!account) {
      throw new NotFoundException("Аккаунт не найден");
    }
    return account;
  }
}
