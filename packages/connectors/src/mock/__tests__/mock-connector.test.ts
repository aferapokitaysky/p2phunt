import { describe, expect, it } from "vitest";
import { MockConnector } from "../mock-connector.js";
import type { ConnectorContext, ConnectorLogger } from "../../core/connector.js";

const silentLogger: ConnectorLogger = { info: () => {}, warn: () => {}, error: () => {} };

function makeCtx(accountId = "acct-1"): ConnectorContext {
  return { workspaceId: "ws-1", accountId, logger: silentLogger };
}

describe("MockConnector", () => {
  it("declares capabilities that it actually implements", () => {
    const connector = new MockConnector();
    for (const capability of connector.definition.capabilities) {
      if (capability === "ads.update_price") expect(connector.updateAdPrice).toBeTypeOf("function");
      if (capability === "ads.enable") expect(connector.enableAd).toBeTypeOf("function");
      if (capability === "ads.disable") expect(connector.disableAd).toBeTypeOf("function");
    }
  });

  it("validateCredentials always succeeds", async () => {
    const connector = new MockConnector();
    await expect(connector.validateCredentials(makeCtx())).resolves.toEqual({ ok: true });
  });

  it("syncBalances returns well-formed balances scoped to the account", async () => {
    const connector = new MockConnector();
    const balances = await connector.syncBalances(makeCtx("acct-42"));

    expect(balances.length).toBeGreaterThan(0);
    for (const balance of balances) {
      expect(balance.accountId).toBe("acct-42");
      expect(Number(balance.totalAmount)).toBeGreaterThan(0);
      expect(Number(balance.availableAmount) + Number(balance.lockedAmount)).toBeCloseTo(Number(balance.totalAmount), 2);
    }
  });

  it("produces stable jitter for the same account within a time bucket", async () => {
    const connector = new MockConnector();
    const first = await connector.syncBalances(makeCtx("stable-account"));
    const second = await connector.syncBalances(makeCtx("stable-account"));
    expect(first[0]?.totalAmount).toBe(second[0]?.totalAmount);
  });

  it("produces different balances for different accounts", async () => {
    const connector = new MockConnector();
    const a = await connector.syncBalances(makeCtx("account-a"));
    const b = await connector.syncBalances(makeCtx("account-b"));
    expect(a[0]?.totalAmount).not.toBe(b[0]?.totalAmount);
  });

  it("updateAdPrice / enableAd / disableAd resolve with ok:true", async () => {
    const connector = new MockConnector();
    const ctx = makeCtx();

    await expect(connector.updateAdPrice!(ctx, { adExternalId: "ad-1", price: "40.00", reason: "manual" })).resolves.toMatchObject({ ok: true });
    await expect(connector.enableAd!(ctx, { adExternalId: "ad-1", reason: "manual" })).resolves.toMatchObject({ ok: true });
    await expect(connector.disableAd!(ctx, { adExternalId: "ad-1", reason: "manual" })).resolves.toMatchObject({ ok: true });
  });

  it("syncDeals returns deals with matching accountId", async () => {
    const connector = new MockConnector();
    const result = await connector.syncDeals!(makeCtx("acct-7"));
    expect(result.hasMore).toBe(false);
    expect(result.items.every((deal) => deal.accountId === "acct-7")).toBe(true);
  });

  it("never simulates failures unless credentials opt in", async () => {
    const connector = new MockConnector();
    const ctx = makeCtx();
    for (let i = 0; i < 50; i += 1) {
      await expect(connector.syncBalances(ctx)).resolves.toBeDefined();
    }
  });
});
