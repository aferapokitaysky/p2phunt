import { PrismaClient } from "@prisma/client";
import { MockConnector } from "@p2phunt/connectors";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const mockConnector = new MockConnector();

  const platform = await prisma.platform.upsert({
    where: { slug: mockConnector.definition.platform },
    create: {
      slug: mockConnector.definition.platform,
      name: mockConnector.definition.displayName,
      category: mockConnector.definition.platformCategory
    },
    update: {}
  });

  const connectorDefinition = await prisma.connectorDefinition.upsert({
    where: { slug: mockConnector.definition.slug },
    create: {
      platformId: platform.id,
      slug: mockConnector.definition.slug,
      version: mockConnector.definition.version,
      capabilities: mockConnector.definition.capabilities,
      authMethods: mockConnector.definition.authMethods
    },
    update: {}
  });

  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@p2phunt.local" },
    create: { email: "demo@p2phunt.local", passwordHash, displayName: "Демо-трейдер" },
    update: {}
  });

  let membership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
  let workspace;
  if (membership) {
    workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: membership.workspaceId } });
  } else {
    workspace = await prisma.workspace.create({ data: { name: "Демо рабочее пространство" } });
    membership = await prisma.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: user.id, role: "owner" }
    });
  }

  const account = await prisma.account.upsert({
    where: { id: "00000000-0000-4000-9000-000000000001" },
    create: {
      id: "00000000-0000-4000-9000-000000000001",
      workspaceId: workspace.id,
      platformId: platform.id,
      connectorDefinitionId: connectorDefinition.id,
      name: "Демо-аккаунт",
      color: "#7c5cff",
      tags: ["демо"],
      status: "active"
    },
    update: {}
  });

  const rateSource = await prisma.rateSource.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: "manual" } },
    create: {
      workspaceId: workspace.id,
      slug: "manual",
      name: "Ручное значение",
      priority: 0,
      refreshIntervalMs: 0
    },
    update: {}
  });

  await prisma.currentRate.upsert({
    where: {
      workspaceId_baseAsset_quoteAsset: { workspaceId: workspace.id, baseAsset: "USDT", quoteAsset: "UAH" }
    },
    create: {
      workspaceId: workspace.id,
      baseAsset: "USDT",
      quoteAsset: "UAH",
      sourceId: rateSource.id,
      bid: 39.72,
      ask: 39.88,
      mid: 39.8,
      selectedBy: "manual"
    },
    update: {}
  });

  await prisma.markupRule.create({
    data: {
      workspaceId: workspace.id,
      scopeType: "global",
      markupType: "percent",
      value: 1,
      priority: 100
    }
  });

  console.log("Seed complete:");
  console.log(`  user:      ${user.email} / password123`);
  console.log(`  workspace: ${workspace.name} (${workspace.id})`);
  console.log(`  account:   ${account.name} (${account.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
