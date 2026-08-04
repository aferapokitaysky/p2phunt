import { AlertTriangle, ArrowUpRight, CheckCircle2, ListChecks, Megaphone, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardBody } from "../components/Card.js";
import { CoinIcon } from "../components/CoinIcon.js";
import { PageHeader } from "../components/PageHeader.js";
import { StatusChip } from "../components/StatusChip.js";
import { useDashboard } from "../hooks/api.js";

function StatCard({
  icon: Icon,
  label,
  value,
  to,
  tone
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  to: string;
  tone?: "warning" | undefined;
}) {
  return (
    <Link to={to}>
      <Card className="transition-colors hover:border-accent/40">
        <CardBody className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone === "warning" ? "text-warning" : "text-ink"}`}>{value}</p>
          </div>
          <Icon size={20} className={tone === "warning" ? "text-warning" : "text-subtle"} />
        </CardBody>
      </Card>
    </Link>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <div className="text-sm text-muted">Загрузка дашборда…</div>;
  }

  return (
    <div>
      <PageHeader title="Дашборд" subtitle="Всё самое важное прямо сейчас, по всем подключённым аккаунтам." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Аккаунты" value={data.accounts} to="/accounts" />
        <StatCard
          icon={AlertTriangle}
          label="Требуют внимания"
          value={data.accountsNeedingAttention}
          to="/accounts"
          tone={data.accountsNeedingAttention > 0 ? "warning" : undefined}
        />
        <StatCard icon={ListChecks} label="Активные сделки" value={data.activeDeals} to="/deals?status=pending" />
        <StatCard icon={CheckCircle2} label="Завершённые сделки" value={data.completedDeals} to="/deals?status=completed" />
        <StatCard icon={Megaphone} label="Открытые объявления" value={data.openAds} to="/ads" />
        <StatCard icon={ArrowUpRight} label="Активные автоправила" value={data.activeAutomationRules} to="/automation" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody>
            <h2 className="mb-3 text-sm font-semibold text-ink">Балансы по активам</h2>
            {Object.keys(data.balancesByAsset).length === 0 ? (
              <p className="text-sm text-muted">Балансы ещё не синхронизированы.</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(data.balancesByAsset).map(([asset, amount]) => (
                  <li key={asset} className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 text-ink">
                      <CoinIcon asset={asset} size={16} />
                      {asset}
                    </span>
                    <span className="tabular-nums text-muted">{Number(amount).toLocaleString("ru-RU", { maximumFractionDigits: 2 })}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Последняя активность коннекторов</h2>
              <Link to="/logs" className="text-xs text-accent hover:underline">
                Все журналы
              </Link>
            </div>
            {data.recentLogs.length === 0 ? (
              <p className="text-sm text-muted">Пока ничего нет — синхронизируйте аккаунт, чтобы начать.</p>
            ) : (
              <ul className="space-y-2">
                {data.recentLogs.map((log) => (
                  <li key={log.id} className="flex items-center justify-between border-b border-line/60 pb-2 text-sm last:border-0 last:pb-0">
                    <span className="text-ink">{log.message}</span>
                    <StatusChip status={log.level} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
