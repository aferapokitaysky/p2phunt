import { AlertTriangle, ArrowUpRight, CheckCircle2, ListChecks, Megaphone, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardBody } from "../components/Card.js";
import { CoinIcon } from "../components/CoinIcon.js";
import { ExchangeIcon } from "../components/ExchangeIcon.js";
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
  tone?: "warning" | "danger" | "success" | undefined;
}) {
  const toneClass = tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-ink";
  return (
    <Link to={to}>
      <Card className="transition-colors hover:border-accent/40">
        <CardBody className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted">{label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
          </div>
          <Icon size={20} className={toneClass === "text-ink" ? "text-subtle" : toneClass} />
        </CardBody>
      </Card>
    </Link>
  );
}

function fmtNumber(value: number | string, maximumFractionDigits = 2) {
  return Number(value).toLocaleString("ru-RU", { maximumFractionDigits });
}

function fmtMoney(value: number | string, currency: string) {
  return `${fmtNumber(value, 2)} ${currency}`;
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <div className="text-sm text-muted">Загрузка дашборда…</div>;
  }

  const { portfolio, balancesByAsset, balancesByAccount, dealStats, dealsTrend, adsByPlatform, accountsSummary } = data;
  const maxAssetValuation = Math.max(1, ...balancesByAsset.map((a) => Number(a.valuation ?? a.totalAmount)));
  const totalDealSides = dealStats.buyCount + dealStats.sellCount;
  const buyShare = totalDealSides > 0 ? Math.round((dealStats.buyCount / totalDealSides) * 100) : 0;
  const maxPlatformDeals = Math.max(1, ...dealStats.byPlatform.map((p) => p.count));

  return (
    <div className="space-y-5">
      <PageHeader title="Дашборд" subtitle="Всё самое важное прямо сейчас, по всем подключённым аккаунтам." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Аккаунты" value={data.accounts} to="/accounts" />
        <StatCard
          icon={AlertTriangle}
          label="Требуют внимания"
          value={data.accountsNeedingAttention}
          to="/accounts"
          tone={data.accountsNeedingAttention > 0 ? "danger" : undefined}
        />
        <StatCard icon={ListChecks} label="Активные сделки" value={data.activeDeals} to="/deals?status=pending" />
        <StatCard icon={CheckCircle2} label="Завершённые сделки" value={data.completedDeals} to="/deals?status=completed" />
        <StatCard icon={Megaphone} label="Открытые объявления" value={data.openAds} to="/ads" />
        <StatCard icon={ArrowUpRight} label="Активные автоправила" value={data.activeAutomationRules} to="/automation" />
        <StatCard
          icon={TrendingUp}
          label="Выполнение сделок"
          value={dealStats.completionRate !== null ? `${dealStats.completionRate}%` : "—"}
          to="/deals"
          tone={dealStats.completionRate !== null && dealStats.completionRate >= 80 ? "success" : undefined}
        />
        <StatCard icon={Wallet} label="Оценено активов" value={`${portfolio.pricedAssetCount}/${portfolio.totalAssetCount}`} to="/balances" />
      </div>

      {/* Portfolio value */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody>
            <p className="text-xs font-medium text-muted">Общая стоимость портфеля</p>
            {portfolio.homeFiat ? (
              <>
                <p className="mt-1 text-3xl font-bold tabular-nums text-ink">{fmtMoney(portfolio.totalValuation, portfolio.homeFiat)}</p>
                <p className="mt-1 text-xs text-subtle">
                  Оценено {portfolio.pricedAssetCount} из {portfolio.totalAssetCount} активов по курсам из раздела «Рынок и курсы»
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Настройте курс к домашней валюте на странице{" "}
                <Link to="/market" className="text-brand hover:underline">
                  «Рынок и курсы»
                </Link>
                , чтобы увидеть общую стоимость.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <SectionTitle
              action={
                <Link to="/balances" className="text-xs text-accent hover:underline">
                  Все балансы
                </Link>
              }
            >
              Балансы по активам
            </SectionTitle>
            {balancesByAsset.length === 0 ? (
              <p className="text-sm text-muted">Балансы ещё не синхронизированы.</p>
            ) : (
              <ul className="space-y-2.5">
                {balancesByAsset.slice(0, 6).map((a) => (
                  <li key={a.asset}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2 text-ink">
                        <CoinIcon asset={a.asset} size={16} />
                        {a.asset}
                        <span className="text-xs text-subtle">
                          {a.accountCount} {a.accountCount === 1 ? "аккаунт" : "аккаунта"}
                        </span>
                      </span>
                      <span className="tabular-nums text-ink">
                        {fmtNumber(a.totalAmount, 6)}
                        {a.valuation !== null && portfolio.homeFiat && (
                          <span className="ml-2 text-xs text-muted">≈ {fmtMoney(a.valuation, portfolio.homeFiat)}</span>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-glass">
                      <div
                        className="h-full rounded-full bg-brand-gradient"
                        style={{ width: `${(Number(a.valuation ?? a.totalAmount) / maxAssetValuation) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Deal trend + stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <SectionTitle
              action={
                <Link to="/deals" className="text-xs text-accent hover:underline">
                  Все сделки
                </Link>
              }
            >
              Динамика сделок за 14 дней
            </SectionTitle>
            {dealsTrend.every((d) => d.total === 0) ? (
              <p className="text-sm text-muted">Сделок за этот период пока нет.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dealsTrend.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted)" }} width={28} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "var(--glass-strong)", border: "1px solid var(--glass-border)", fontSize: 12, borderRadius: 12 }}
                      labelStyle={{ color: "var(--ink)" }}
                    />
                    <Line type="monotone" dataKey="total" name="Всего" stroke="var(--muted)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="completed" name="Завершено" stroke="var(--brand)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <SectionTitle>Покупка / продажа</SectionTitle>
            {totalDealSides === 0 ? (
              <p className="text-sm text-muted">Пока нет данных.</p>
            ) : (
              <>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-glass">
                  <div className="h-full bg-success" style={{ width: `${buyShare}%` }} />
                  <div className="h-full bg-danger" style={{ width: `${100 - buyShare}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-success">Покупка {dealStats.buyCount}</span>
                  <span className="text-danger">Продажа {dealStats.sellCount}</span>
                </div>
              </>
            )}

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-xs font-medium text-muted">Объём завершённых сделок</p>
              {dealStats.totalVolumeByFiat.length === 0 ? (
                <p className="text-sm text-muted">Нет завершённых сделок.</p>
              ) : (
                <ul className="space-y-1">
                  {dealStats.totalVolumeByFiat.map((v) => (
                    <li key={v.fiatAsset} className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-1.5 text-ink">
                        <CoinIcon asset={v.fiatAsset} size={14} />
                        {v.fiatAsset}
                      </span>
                      <span className="tabular-nums text-ink">{fmtNumber(v.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {dealStats.profitByAsset.length > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 text-xs font-medium text-muted">Прибыль</p>
                <ul className="space-y-1">
                  {dealStats.profitByAsset.map((p) => {
                    const positive = Number(p.amount) >= 0;
                    return (
                      <li key={p.asset} className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-1.5 text-ink">
                          {positive ? <TrendingUp size={13} className="text-success" /> : <TrendingDown size={13} className="text-danger" />}
                          {p.asset}
                        </span>
                        <span className={`tabular-nums ${positive ? "text-success" : "text-danger"}`}>
                          {positive ? "+" : ""}
                          {fmtNumber(p.amount)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Per-account breakdown + platform activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <SectionTitle>Балансы по аккаунтам</SectionTitle>
            {balancesByAccount.length === 0 ? (
              <p className="text-sm text-muted">Балансы ещё не синхронизированы.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {balancesByAccount.map((acc) => (
                  <Link
                    key={acc.accountId}
                    to={`/accounts/${acc.accountId}`}
                    className="rounded-xl bg-glass p-3 transition-colors hover:bg-glassHi"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                        <ExchangeIcon platform={acc.platform.slug} size={16} />
                        {acc.accountName}
                      </span>
                      <StatusChip status={acc.accountStatus} />
                    </div>
                    <p className="mt-1.5 text-lg font-semibold tabular-nums text-ink">
                      {acc.totalValuation !== null && portfolio.homeFiat ? fmtMoney(acc.totalValuation, portfolio.homeFiat) : "—"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {acc.assets.map((a) => `${fmtNumber(a.totalAmount, 4)} ${a.asset}`).join(" · ") || "нет активов"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <SectionTitle>Сделки по площадкам</SectionTitle>
            {dealStats.byPlatform.length === 0 ? (
              <p className="text-sm text-muted">Пока нет данных.</p>
            ) : (
              <ul className="space-y-2.5">
                {dealStats.byPlatform.map((p) => (
                  <li key={p.platform}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-ink">{p.platform}</span>
                      <span className="tabular-nums text-muted">{p.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-glass">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(p.count / maxPlatformDeals) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {adsByPlatform.length > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 text-xs font-medium text-muted">Активные объявления</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adsByPlatform} layout="vertical" margin={{ left: 0 }}>
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="platform" tick={{ fontSize: 10, fill: "var(--muted)" }} width={70} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "var(--glass-strong)", border: "1px solid var(--glass-border)", fontSize: 12, borderRadius: 12 }} />
                      <Bar dataKey="buy" name="Покупка" stackId="a" fill="var(--success)" radius={[4, 0, 0, 4]} />
                      <Bar dataKey="sell" name="Продажа" stackId="a" fill="var(--danger)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Accounts health + activity log */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <SectionTitle
              action={
                <Link to="/accounts" className="text-xs text-accent hover:underline">
                  Все аккаунты
                </Link>
              }
            >
              Состояние аккаунтов
            </SectionTitle>
            {accountsSummary.length === 0 ? (
              <p className="text-sm text-muted">Аккаунты ещё не подключены.</p>
            ) : (
              <ul className="divide-y divide-line/60">
                {accountsSummary.map((acc) => (
                  <li key={acc.id}>
                    <Link to={`/accounts/${acc.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <ExchangeIcon platform={acc.platform.slug} size={16} />
                        <span className="truncate text-sm text-ink">{acc.name}</span>
                      </span>
                      <span className="flex flex-shrink-0 items-center gap-3 text-xs text-muted">
                        <span>{acc.dealCount} сделок</span>
                        <span>{acc.adCount} объявл.</span>
                        <span>{acc.lastSyncAt ? new Date(acc.lastSyncAt).toLocaleString("ru-RU") : "не синхронизирован"}</span>
                        <StatusChip status={acc.status} />
                      </span>
                    </Link>
                    {acc.lastError && <p className="pb-2 text-xs text-danger">{acc.lastError}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <SectionTitle
              action={
                <Link to="/activity" className="text-xs text-accent hover:underline">
                  Вся активность
                </Link>
              }
            >
              Последняя активность
            </SectionTitle>
            {data.recentLogs.length === 0 ? (
              <p className="text-sm text-muted">Пока ничего нет — синхронизируйте аккаунт, чтобы начать.</p>
            ) : (
              <ul className="space-y-2">
                {data.recentLogs.map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-2 border-b border-line/60 pb-2 text-sm last:border-0 last:pb-0">
                    <span className="truncate text-ink">{log.message}</span>
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
