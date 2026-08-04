import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiFetch } from "../lib/api.js";
import type {
  Account,
  AccountDetail,
  Ad,
  AuditLogEntry,
  AutomationRule,
  Balance,
  ConnectorCommand,
  ConnectorLog,
  CurrentRate,
  DashboardSummary,
  Deal,
  DealDetail,
  MarketAd,
  MarkupRule,
  Notification,
  Paginated,
  PriceQuote,
  RateSource,
  RuleExecution,
  SyncJob
} from "../lib/types.js";

// ---------- Dashboard ----------

export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<DashboardSummary>("/dashboard/summary"), refetchInterval: 30000 });
}

// ---------- Platforms / connectors ----------

export function usePlatforms() {
  return useQuery({ queryKey: ["platforms"], queryFn: () => api.get<{ slug: string; name: string; category: string }[]>("/platforms") });
}

export function useConnectors() {
  return useQuery({
    queryKey: ["connectors"],
    queryFn: () =>
      api.get<{ slug: string; platform: string; displayName: string; capabilities: string[]; safetyLevel: number; authMethods: string[] }[]>(
        "/connectors"
      )
  });
}

// ---------- Accounts ----------

export function useAccounts() {
  return useQuery({ queryKey: ["accounts"], queryFn: () => api.get<Account[]>("/accounts") });
}

export function useAccount(id: string | undefined) {
  return useQuery({
    queryKey: ["accounts", id],
    queryFn: () => api.get<AccountDetail>(`/accounts/${id}`),
    enabled: !!id
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { platform: string; connector: string; name: string; color?: string; groupName?: string; tags?: string[] }) =>
      api.post<Account>("/accounts", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] })
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; name?: string; color?: string; groupName?: string; tags?: string[]; mode?: "manual" | "auto" }) =>
      api.patch<Account>(`/accounts/${id}`, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["accounts", variables.id] });
    }
  });
}

export function useDisableAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Account>(`/accounts/${id}/disable`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] })
  });
}

export function useArchiveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/accounts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] })
  });
}

export function useSyncAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<SyncJob>(`/accounts/${id}/sync`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["accounts", id] });
      qc.invalidateQueries({ queryKey: ["sync-jobs", id] });
    }
  });
}

export function useSyncJobs(accountId: string | undefined) {
  return useQuery({
    queryKey: ["sync-jobs", accountId],
    queryFn: () => api.get<SyncJob[]>(`/accounts/${accountId}/sync-jobs`),
    enabled: !!accountId
  });
}

export function useSetAccountSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kind, payload }: { id: string; kind: string; payload: Record<string, unknown> }) =>
      api.post(`/accounts/${id}/secrets`, { kind, payload }),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ["accounts", variables.id] })
  });
}

// ---------- Deals ----------

export interface DealsFilter {
  status?: string | undefined;
  accountId?: string | undefined;
  side?: string | undefined;
  cryptoAsset?: string | undefined;
  fiatAsset?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: string | undefined;
  sortDir?: "asc" | "desc" | undefined;
}

function toQueryString(params: object) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function useDeals(filter: DealsFilter) {
  return useQuery({
    queryKey: ["deals", filter],
    queryFn: () => api.get<Paginated<Deal>>(`/deals${toQueryString(filter)}`)
  });
}

export function useDeal(id: string | undefined) {
  return useQuery({ queryKey: ["deals", "detail", id], queryFn: () => api.get<DealDetail>(`/deals/${id}`), enabled: !!id });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; tags?: string[]; comment?: string }) => api.patch<Deal>(`/deals/${id}`, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["deals", "detail", variables.id] });
    }
  });
}

export function useAddDealNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => api.post(`/deals/${id}/notes`, { body }),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ["deals", "detail", variables.id] })
  });
}

export function useAddDealMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body, direction }: { id: string; body: string; direction: "inbound" | "outbound" }) =>
      api.post(`/deals/${id}/messages`, { body, direction }),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ["deals", "detail", variables.id] })
  });
}

export async function fetchDealsCsv(filter: DealsFilter): Promise<string> {
  return apiFetch<string>(`/deals/export${toQueryString(filter)}`);
}

// ---------- Balances ----------

export function useBalances(accountId?: string, asset?: string) {
  return useQuery({
    queryKey: ["balances", accountId, asset],
    queryFn: () => api.get<{ items: Balance[]; byAsset: { asset: string; totalAmount: number; valuationAmount: number }[] }>(
      `/balances${toQueryString({ accountId, asset })}`
    )
  });
}

// ---------- Ads ----------

export function useAds(accountId?: string) {
  return useQuery({ queryKey: ["ads", accountId], queryFn: () => api.get<Ad[]>(`/ads${toQueryString({ accountId })}`) });
}

export function useUpdateAdPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, price }: { id: string; price: string }) => api.patch(`/ads/${id}/price`, { price }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ads"] })
  });
}

export function useSetAdEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => api.post(`/ads/${id}/${enabled ? "enable" : "disable"}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ads"] })
  });
}

export function useBulkPreview() {
  return useMutation({
    mutationFn: ({ adIds, priceDeltaPercent }: { adIds: string[]; priceDeltaPercent: number }) =>
      api.post<{ adId: string; externalId: string | null; currentPrice: number; newPrice: number; deltaPercent: number }[]>(
        "/ads/bulk-actions/preview",
        { adIds, priceDeltaPercent }
      )
  });
}

export function useBulkUpdatePrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ adIds, priceDeltaPercent }: { adIds: string[]; priceDeltaPercent: number }) =>
      api.post<{ adId: string; commandId: string }[]>("/ads/bulk-actions/update-prices", { adIds, priceDeltaPercent }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ads"] })
  });
}

// ---------- Market ----------

export function useMarketAds(cryptoAsset: string, fiatAsset: string, side: "buy" | "sell", enabled: boolean) {
  return useQuery({
    queryKey: ["market", cryptoAsset, fiatAsset, side],
    queryFn: () => api.get<{ ads: MarketAd[]; errors: { platform: string; error: string }[] }>(
      `/market/ads${toQueryString({ cryptoAsset, fiatAsset, side })}`
    ),
    enabled,
    refetchInterval: 15000
  });
}

// ---------- Rates ----------

export function useRateSources() {
  return useQuery({ queryKey: ["rate-sources"], queryFn: () => api.get<RateSource[]>("/rates/sources") });
}

export function useCreateRateSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { slug: string; name: string; priority: number; refreshIntervalMs: number }) =>
      api.post<RateSource>("/rates/sources", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rate-sources"] })
  });
}

export function useCurrentRates(baseAsset?: string, quoteAsset?: string) {
  return useQuery({
    queryKey: ["rates", "current", baseAsset, quoteAsset],
    queryFn: () => api.get<CurrentRate[]>(`/rates/current${toQueryString({ baseAsset, quoteAsset })}`),
    refetchInterval: 20000
  });
}

export function useRateHistory(baseAsset: string, quoteAsset: string, enabled: boolean) {
  return useQuery({
    queryKey: ["rates", "history", baseAsset, quoteAsset],
    queryFn: () => api.get<{ id: string; bid: string | null; ask: string | null; mid: string; createdAt: string }[]>(
      `/rates/history${toQueryString({ baseAsset, quoteAsset })}`
    ),
    enabled
  });
}

export function useManualOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { baseAsset: string; quoteAsset: string; mid: number; bid?: number; ask?: number }) =>
      api.post<CurrentRate>("/rates/manual-override", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rates"] })
  });
}

export function usePriceQuote(params: { baseAsset: string; quoteAsset: string; side: "buy" | "sell" }, enabled: boolean) {
  return useQuery({
    queryKey: ["rates", "quote", params],
    queryFn: () => api.get<PriceQuote>(`/rates/quote${toQueryString(params)}`),
    enabled,
    retry: false
  });
}

// ---------- Markups ----------

export function useMarkupRules() {
  return useQuery({ queryKey: ["markups"], queryFn: () => api.get<MarkupRule[]>("/markups") });
}

export function useCreateMarkupRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      scopeType: "global" | "platform" | "account" | "ad";
      scopeId?: string;
      baseAsset?: string;
      quoteAsset?: string;
      side?: "buy" | "sell";
      markupType: "percent" | "fixed";
      value: number;
      priority?: number;
    }) => api.post<MarkupRule>("/markups", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["markups"] })
  });
}

export function useUpdateMarkupRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; value?: number; priority?: number; enabled?: boolean }) =>
      api.patch<MarkupRule>(`/markups/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["markups"] })
  });
}

export function useDeleteMarkupRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/markups/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["markups"] })
  });
}

// ---------- Automation ----------

export function useAutomationRules() {
  return useQuery({ queryKey: ["automation", "rules"], queryFn: () => api.get<AutomationRule[]>("/automation/rules") });
}

export function useCreateAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      trigger: Record<string, unknown>;
      conditions: Record<string, unknown>[];
      actions: Record<string, unknown>[];
      guards?: Record<string, unknown>;
      cooldownSeconds?: number;
    }) => api.post<AutomationRule>("/automation/rules", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation", "rules"] })
  });
}

export function useUpdateAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; enabled?: boolean; [key: string]: unknown }) =>
      api.patch<AutomationRule>(`/automation/rules/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation", "rules"] })
  });
}

export function useDeleteAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/automation/rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation", "rules"] })
  });
}

export function useTestAutomationRule() {
  return useMutation({
    mutationFn: ({ id, sampleInput }: { id: string; sampleInput: Record<string, unknown> }) =>
      api.post<{
        executionId: string;
        matched: boolean;
        conditionResults: { condition: unknown; actualValue: unknown; passed: boolean }[];
        plannedActions: { type: string; params?: Record<string, unknown>; wouldExecute: boolean; blockedReason: string | null }[];
      }>(`/automation/rules/${id}/test`, { sampleInput })
  });
}

export function useAutomationExecutions(ruleId?: string) {
  return useQuery({
    queryKey: ["automation", "executions", ruleId],
    queryFn: () => api.get<RuleExecution[]>(`/automation/executions${toQueryString({ ruleId })}`)
  });
}

export function useSetWorkspaceMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mode: "manual" | "auto") => api.post<{ mode: "manual" | "auto" }>("/automation/mode", { mode }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] })
  });
}

export function useEmergencyStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (active: boolean) => api.post<{ emergencyStop: boolean }>("/automation/emergency-stop", { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] })
  });
}

// ---------- Notifications ----------

export function useNotifications(status?: string) {
  return useQuery({ queryKey: ["notifications", status], queryFn: () => api.get<Notification[]>(`/notifications${toQueryString({ status })}`) });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

// ---------- Logs ----------

export function useAuditLogs(limit = 200) {
  return useQuery({ queryKey: ["logs", "audit", limit], queryFn: () => api.get<AuditLogEntry[]>(`/logs/audit${toQueryString({ limit })}`) });
}

export function useConnectorLogs(accountId?: string, limit = 200) {
  return useQuery({
    queryKey: ["logs", "connector", accountId, limit],
    queryFn: () => api.get<ConnectorLog[]>(`/logs/connector${toQueryString({ accountId, limit })}`)
  });
}

export function useSyncJobLogs(accountId?: string, limit = 200) {
  return useQuery({
    queryKey: ["logs", "sync-jobs", accountId, limit],
    queryFn: () => api.get<SyncJob[]>(`/logs/sync-jobs${toQueryString({ accountId, limit })}`)
  });
}

// ---------- Commands ----------

export function useCommands(accountId?: string) {
  return useQuery({ queryKey: ["commands", accountId], queryFn: () => api.get<ConnectorCommand[]>(`/commands${toQueryString({ accountId })}`) });
}
