-- CreateEnum
CREATE TYPE "WorkspaceMode" AS ENUM ('manual', 'auto');

-- CreateEnum
CREATE TYPE "PlatformCategory" AS ENUM ('exchange', 'telegram', 'web', 'mock');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('draft', 'connecting', 'active', 'disabled', 'error', 'reauth_required', 'archived');

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('buy', 'sell');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('new', 'pending', 'payment_pending', 'paid', 'appeal', 'completed', 'cancelled', 'expired', 'failed', 'unknown');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('active', 'paused', 'disabled', 'out_of_balance', 'updating', 'error', 'unknown');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'retrying', 'cancelled');

-- CreateEnum
CREATE TYPE "RuleExecutionStatus" AS ENUM ('dry_run', 'skipped', 'succeeded', 'failed', 'blocked_by_mode', 'blocked_by_guard', 'cooldown');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('info', 'success', 'warning', 'error', 'critical');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" "WorkspaceMode" NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PlatformCategory" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorDefinition" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,
    "authMethods" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "connectorDefinitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "groupName" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mode" "WorkspaceMode" NOT NULL DEFAULT 'manual',
    "status" "AccountStatus" NOT NULL DEFAULT 'draft',
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountSecret" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "encryptionKeyVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rotatedAt" TIMESTAMP(3),

    CONSTRAINT "AccountSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "externalId" TEXT,
    "side" "TradeSide" NOT NULL,
    "cryptoAsset" TEXT NOT NULL,
    "fiatAsset" TEXT NOT NULL,
    "cryptoAmount" DECIMAL(36,18) NOT NULL,
    "fiatAmount" DECIMAL(36,18) NOT NULL,
    "price" DECIMAL(36,18) NOT NULL,
    "feeAmount" DECIMAL(36,18),
    "feeAsset" TEXT,
    "profitAmount" DECIMAL(36,18),
    "profitAsset" TEXT,
    "counterpartyName" TEXT,
    "counterpartyExternalId" TEXT,
    "status" "DealStatus" NOT NULL,
    "externalStatus" TEXT,
    "openedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "rawPayload" JSONB,
    "lastSyncJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "externalId" TEXT,
    "side" "TradeSide" NOT NULL,
    "cryptoAsset" TEXT NOT NULL,
    "fiatAsset" TEXT NOT NULL,
    "price" DECIMAL(36,18) NOT NULL,
    "minLimit" DECIMAL(36,18),
    "maxLimit" DECIMAL(36,18),
    "availableAmount" DECIMAL(36,18),
    "status" "AdStatus" NOT NULL,
    "externalStatus" TEXT,
    "markupRuleId" TEXT,
    "lastUpdateAt" TIMESTAMP(3),
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Balance" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "availableAmount" DECIMAL(36,18) NOT NULL,
    "lockedAmount" DECIMAL(36,18) NOT NULL,
    "totalAmount" DECIMAL(36,18) NOT NULL,
    "valuationFiat" TEXT,
    "valuationAmount" DECIMAL(36,18),
    "rawPayload" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateSource" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "refreshIntervalMs" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateTick" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "bid" DECIMAL(36,18),
    "ask" DECIMAL(36,18),
    "mid" DECIMAL(36,18) NOT NULL,
    "rawPayload" JSONB,
    "sourceTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateTick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrentRate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "bid" DECIMAL(36,18),
    "ask" DECIMAL(36,18),
    "mid" DECIMAL(36,18) NOT NULL,
    "selectedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrentRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkupRule" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT,
    "baseAsset" TEXT,
    "quoteAsset" TEXT,
    "side" "TradeSide",
    "markupType" TEXT NOT NULL,
    "value" DECIMAL(36,18) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarkupRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "trigger" JSONB NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "guards" JSONB,
    "cooldownSeconds" INTEGER,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleExecution" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "triggerEventId" TEXT,
    "status" "RuleExecutionStatus" NOT NULL,
    "input" JSONB,
    "conditionResults" JSONB,
    "actionResults" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "RuleExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'info',
    "status" TEXT NOT NULL DEFAULT 'unread',
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorSyncJob" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "connectorSlug" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "stats" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectorSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "accountId" TEXT,
    "connectorSlug" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_slug_key" ON "Platform"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectorDefinition_slug_key" ON "ConnectorDefinition"("slug");

-- CreateIndex
CREATE INDEX "Account_workspaceId_status_idx" ON "Account"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "Account_workspaceId_platformId_idx" ON "Account"("workspaceId", "platformId");

-- CreateIndex
CREATE INDEX "Account_workspaceId_groupName_idx" ON "Account"("workspaceId", "groupName");

-- CreateIndex
CREATE INDEX "Deal_workspaceId_openedAt_idx" ON "Deal"("workspaceId", "openedAt");

-- CreateIndex
CREATE INDEX "Deal_workspaceId_status_idx" ON "Deal"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "Deal_workspaceId_platformId_idx" ON "Deal"("workspaceId", "platformId");

-- CreateIndex
CREATE INDEX "Deal_workspaceId_accountId_idx" ON "Deal"("workspaceId", "accountId");

-- CreateIndex
CREATE INDEX "Deal_workspaceId_cryptoAsset_fiatAsset_idx" ON "Deal"("workspaceId", "cryptoAsset", "fiatAsset");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_accountId_externalId_key" ON "Deal"("accountId", "externalId");

-- CreateIndex
CREATE INDEX "Ad_workspaceId_accountId_idx" ON "Ad"("workspaceId", "accountId");

-- CreateIndex
CREATE INDEX "Ad_workspaceId_status_idx" ON "Ad"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Ad_accountId_externalId_key" ON "Ad"("accountId", "externalId");

-- CreateIndex
CREATE INDEX "Balance_workspaceId_asset_idx" ON "Balance"("workspaceId", "asset");

-- CreateIndex
CREATE INDEX "Balance_workspaceId_accountId_idx" ON "Balance"("workspaceId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_accountId_asset_key" ON "Balance"("accountId", "asset");

-- CreateIndex
CREATE UNIQUE INDEX "RateSource_workspaceId_slug_key" ON "RateSource"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "RateTick_workspaceId_baseAsset_quoteAsset_createdAt_idx" ON "RateTick"("workspaceId", "baseAsset", "quoteAsset", "createdAt");

-- CreateIndex
CREATE INDEX "RateTick_sourceId_baseAsset_quoteAsset_createdAt_idx" ON "RateTick"("sourceId", "baseAsset", "quoteAsset", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentRate_workspaceId_baseAsset_quoteAsset_key" ON "CurrentRate"("workspaceId", "baseAsset", "quoteAsset");

-- CreateIndex
CREATE INDEX "MarkupRule_workspaceId_scopeType_scopeId_idx" ON "MarkupRule"("workspaceId", "scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "Notification_workspaceId_createdAt_idx" ON "Notification"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_entityType_entityId_idx" ON "AuditLog"("workspaceId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "ConnectorSyncJob_workspaceId_createdAt_idx" ON "ConnectorSyncJob"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "ConnectorSyncJob_workspaceId_accountId_idx" ON "ConnectorSyncJob"("workspaceId", "accountId");

-- CreateIndex
CREATE INDEX "ConnectorLog_workspaceId_createdAt_idx" ON "ConnectorLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "ConnectorLog_workspaceId_accountId_idx" ON "ConnectorLog"("workspaceId", "accountId");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorDefinition" ADD CONSTRAINT "ConnectorDefinition_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_connectorDefinitionId_fkey" FOREIGN KEY ("connectorDefinitionId") REFERENCES "ConnectorDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountSecret" ADD CONSTRAINT "AccountSecret_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateSource" ADD CONSTRAINT "RateSource_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateTick" ADD CONSTRAINT "RateTick_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateTick" ADD CONSTRAINT "RateTick_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RateSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentRate" ADD CONSTRAINT "CurrentRate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentRate" ADD CONSTRAINT "CurrentRate_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RateSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkupRule" ADD CONSTRAINT "MarkupRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleExecution" ADD CONSTRAINT "RuleExecution_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorSyncJob" ADD CONSTRAINT "ConnectorSyncJob_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorSyncJob" ADD CONSTRAINT "ConnectorSyncJob_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorLog" ADD CONSTRAINT "ConnectorLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorLog" ADD CONSTRAINT "ConnectorLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
