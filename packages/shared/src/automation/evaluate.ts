export type ConditionOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "not_in"
  | "contains"
  | "changed_by_percent"
  | "changed_by_amount";

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  /** Only used by changed_by_* operators; the field holding the previous value in the input. */
  previousField?: string;
}

export interface ConditionResult {
  condition: RuleCondition;
  actualValue: unknown;
  passed: boolean;
}

function getField(input: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, input);
}

function evaluateOperator(operator: ConditionOperator, actual: unknown, expected: unknown, previous?: unknown): boolean {
  switch (operator) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "gt":
      return Number(actual) > Number(expected);
    case "gte":
      return Number(actual) >= Number(expected);
    case "lt":
      return Number(actual) < Number(expected);
    case "lte":
      return Number(actual) <= Number(expected);
    case "in":
      return Array.isArray(expected) && expected.includes(actual);
    case "not_in":
      return Array.isArray(expected) && !expected.includes(actual);
    case "contains":
      return typeof actual === "string" && typeof expected === "string" && actual.includes(expected);
    case "changed_by_percent": {
      if (previous === undefined || previous === null || Number(previous) === 0) return false;
      const delta = ((Number(actual) - Number(previous)) / Number(previous)) * 100;
      return Math.abs(delta) >= Number(expected);
    }
    case "changed_by_amount": {
      if (previous === undefined || previous === null) return false;
      return Math.abs(Number(actual) - Number(previous)) >= Number(expected);
    }
    default:
      return false;
  }
}

export function evaluateConditions(
  conditions: RuleCondition[],
  input: Record<string, unknown>
): { matched: boolean; results: ConditionResult[] } {
  const results = conditions.map((condition) => {
    const actualValue = getField(input, condition.field);
    const previousValue = condition.previousField ? getField(input, condition.previousField) : undefined;
    const passed = evaluateOperator(condition.operator, actualValue, condition.value, previousValue);
    return { condition, actualValue, passed };
  });

  return { matched: results.every((result) => result.passed), results };
}
