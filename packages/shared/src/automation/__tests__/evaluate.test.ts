import { describe, expect, it } from "vitest";
import { evaluateConditions, type RuleCondition } from "../evaluate.js";

describe("evaluateConditions", () => {
  it("matches when all conditions pass", () => {
    const conditions: RuleCondition[] = [
      { field: "asset", operator: "eq", value: "USDT" },
      { field: "totalAmount", operator: "lt", value: 1000 }
    ];
    const result = evaluateConditions(conditions, { asset: "USDT", totalAmount: 500 });
    expect(result.matched).toBe(true);
    expect(result.results).toHaveLength(2);
    expect(result.results.every((r) => r.passed)).toBe(true);
  });

  it("fails when any condition fails", () => {
    const conditions: RuleCondition[] = [
      { field: "asset", operator: "eq", value: "USDT" },
      { field: "totalAmount", operator: "lt", value: 100 }
    ];
    const result = evaluateConditions(conditions, { asset: "USDT", totalAmount: 500 });
    expect(result.matched).toBe(false);
    expect(result.results[1]?.passed).toBe(false);
  });

  it("supports nested field paths", () => {
    const conditions: RuleCondition[] = [{ field: "account.status", operator: "eq", value: "active" }];
    const result = evaluateConditions(conditions, { account: { status: "active" } });
    expect(result.matched).toBe(true);
  });

  it.each([
    ["eq", 5, 5, true],
    ["eq", 5, 6, false],
    ["neq", 5, 6, true],
    ["gt", 5, 4, true],
    ["gt", 5, 5, false],
    ["gte", 5, 5, true],
    ["lt", 4, 5, true],
    ["lte", 5, 5, true]
  ] as const)("operator %s: %s vs %s -> %s", (operator, actual, expected, shouldPass) => {
    const result = evaluateConditions([{ field: "x", operator, value: expected }], { x: actual });
    expect(result.matched).toBe(shouldPass);
  });

  it("supports in / not_in", () => {
    expect(evaluateConditions([{ field: "x", operator: "in", value: ["a", "b"] }], { x: "a" }).matched).toBe(true);
    expect(evaluateConditions([{ field: "x", operator: "in", value: ["a", "b"] }], { x: "c" }).matched).toBe(false);
    expect(evaluateConditions([{ field: "x", operator: "not_in", value: ["a", "b"] }], { x: "c" }).matched).toBe(true);
  });

  it("supports contains", () => {
    expect(evaluateConditions([{ field: "x", operator: "contains", value: "lo" }], { x: "hello" }).matched).toBe(true);
    expect(evaluateConditions([{ field: "x", operator: "contains", value: "zz" }], { x: "hello" }).matched).toBe(false);
  });

  it("supports changed_by_percent using a previousField", () => {
    const conditions: RuleCondition[] = [
      { field: "price", operator: "changed_by_percent", value: 5, previousField: "previousPrice" }
    ];
    expect(evaluateConditions(conditions, { price: 110, previousPrice: 100 }).matched).toBe(true);
    expect(evaluateConditions(conditions, { price: 102, previousPrice: 100 }).matched).toBe(false);
  });

  it("supports changed_by_amount using a previousField", () => {
    const conditions: RuleCondition[] = [
      { field: "balance", operator: "changed_by_amount", value: 50, previousField: "previousBalance" }
    ];
    expect(evaluateConditions(conditions, { balance: 200, previousBalance: 100 }).matched).toBe(true);
    expect(evaluateConditions(conditions, { balance: 120, previousBalance: 100 }).matched).toBe(false);
  });

  it("returns matched=true for an empty condition list (unconditional trigger)", () => {
    expect(evaluateConditions([], {}).matched).toBe(true);
  });
});
