import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Card } from "../components/Card.js";
import { ConnectAccountModal } from "../components/ConnectAccountModal.js";
import { ExchangeIcon } from "../components/ExchangeIcon.js";
import { IconAutomation as IconSettingsGear } from "../components/icons/NavIcons.js";
import { PageHeader } from "../components/PageHeader.js";
import { SegmentedFilter } from "../components/SegmentedFilter.js";
import { StatBar } from "../components/StatBar.js";
import { StatusChip } from "../components/StatusChip.js";
import { useAccounts, useSyncAccount } from "../hooks/api.js";
import type { Account } from "../lib/types.js";

const PROBLEM_STATUSES = new Set(["error", "reauth_required"]);
const ONLINE_STATUSES = new Set(["active", "connecting"]);

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

function AccountCard({ account, onSync, syncing }: { account: Account; onSync: () => void; syncing: boolean }) {
  const navigate = useNavigate();

  return (
    <Card className="cursor-pointer p-4 transition-transform hover:-translate-y-0.5" onClick={() => navigate(`/accounts/${account.id}`)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white"
              style={{ background: account.color ?? "#5b6675" }}
            >
              {initials(account.name)}
            </div>
            <div className="glass-panel-strong absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full p-0.5">
              <ExchangeIcon platform={account.platform.slug} size={14} />
            </div>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{account.name}</p>
            <p className="truncate text-xs text-muted">{account.platform.name}</p>
          </div>
        </div>
        <StatusChip status={account.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-glass py-2">
          <p className="text-base font-bold tabular-nums text-ink">{account._count.deals}</p>
          <p className="text-[10px] text-muted">сделок</p>
        </div>
        <div className="rounded-xl bg-glass py-2">
          <p className="text-base font-bold tabular-nums text-ink">{account._count.ads}</p>
          <p className="text-[10px] text-muted">объявл.</p>
        </div>
        <div className="rounded-xl bg-glass py-2">
          <p className="text-base font-bold tabular-nums text-ink">{account._count.balances}</p>
          <p className="text-[10px] text-muted">активов</p>
        </div>
      </div>

      {account.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {account.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-glass px-2 py-0.5 text-[10px] text-muted">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="text-xs text-muted">
          {account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString("ru-RU") : "Ещё не синхронизировано"}
        </span>
        <div className="flex items-center gap-1">
          <StatusChip status={account.mode} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSync();
            }}
            disabled={syncing}
            title="Синхронизировать"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-glassHi hover:text-brand disabled:opacity-40"
          >
            <IconSettingsGear size={14} />
          </button>
        </div>
      </div>

      {account.lastError && <p className="mt-2 text-xs text-danger">{account.lastError}</p>}
    </Card>
  );
}

export function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const syncAccount = useSyncAccount();
  const [filter, setFilter] = useState("all");
  const [showConnect, setShowConnect] = useState(false);

  const counts = useMemo(
    () => ({
      total: accounts.length,
      online: accounts.filter((a) => ONLINE_STATUSES.has(a.status)).length,
      problems: accounts.filter((a) => PROBLEM_STATUSES.has(a.status)).length
    }),
    [accounts]
  );

  const filtered = useMemo(() => {
    if (filter === "online") return accounts.filter((a) => ONLINE_STATUSES.has(a.status));
    if (filter === "problems") return accounts.filter((a) => PROBLEM_STATUSES.has(a.status));
    return accounts;
  }, [accounts, filter]);

  return (
    <div>
      <PageHeader
        title="Аккаунты"
        subtitle="Все биржи, боты и кошельки, которыми вы управляете, в одном месте."
        actions={
          <button
            onClick={() => setShowConnect(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-1.5 text-sm font-medium text-canvas shadow-glass transition-opacity hover:opacity-90"
          >
            <Plus size={14} />
            Подключить аккаунт
          </button>
        }
      />

      <div className="mb-4">
        <StatBar
          items={[
            { label: "Онлайн", value: `${counts.online}/${counts.total}` },
            { label: "Объявлений", value: accounts.reduce((sum, a) => sum + a._count.ads, 0) },
            { label: "Сделок", value: accounts.reduce((sum, a) => sum + a._count.deals, 0) },
            ...(counts.problems > 0
              ? [{ label: "Проблемы", value: counts.problems, tone: "danger" as const }]
              : [{ label: "Проблемы", value: counts.problems }])
          ]}
          {...(counts.problems > 0
            ? {
                notice: {
                  text: `${counts.problems} ${counts.problems === 1 ? "аккаунт требует" : "аккаунта требуют"} внимания`,
                  tone: "danger" as const
                }
              }
            : {})}
        />
      </div>

      <div className="mb-4">
        <SegmentedFilter
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Все", count: counts.total },
            { value: "online", label: "Онлайн", count: counts.online },
            { value: "problems", label: "Проблемы", count: counts.problems }
          ]}
        />
      </div>

      {isLoading && <p className="text-sm text-muted">Загрузка…</p>}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              syncing={syncAccount.isPending}
              onSync={() => syncAccount.mutate(account.id)}
            />
          ))}

          <button
            onClick={() => setShowConnect(true)}
            className="glass-panel flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-dashed text-muted transition-colors hover:text-brand"
          >
            <Plus size={22} />
            <span className="text-sm font-medium">Добавить аккаунт</span>
          </button>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted">Ничего не найдено по этому фильтру.</p>
      )}

      <ConnectAccountModal open={showConnect} onClose={() => setShowConnect(false)} />
    </div>
  );
}
