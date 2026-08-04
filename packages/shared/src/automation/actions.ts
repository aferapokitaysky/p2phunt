/**
 * Action-type risk tiers per docs/09-automation.md. High-risk actions are never executed by
 * the automation engine regardless of mode/guards — they require a dedicated, separately
 * reviewed money-movement feature. Shared between the API (dry-run preview) and the worker
 * (real execution) so both enforce the exact same allowlist.
 */
export const HIGH_RISK_ACTION_TYPES = new Set([
  "transfer.send",
  "payment.confirm",
  "asset.release",
  "ad.create"
]);

export const WRITE_ACTION_TYPES = new Set(["ads.update_price", "ads.enable", "ads.disable"]);

export function isHighRiskAction(type: string): boolean {
  return HIGH_RISK_ACTION_TYPES.has(type);
}
