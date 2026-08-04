import { Card, CardBody } from "../components/Card.js";
import { CoinIcon } from "../components/CoinIcon.js";
import { PageHeader } from "../components/PageHeader.js";
import { useBalances } from "../hooks/api.js";

export function BalancesPage() {
  const { data, isLoading } = useBalances();

  return (
    <div>
      <PageHeader title="Балансы" subtitle="Все активы по всем подключённым аккаунтам — сгруппированы и оценены." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {data?.byAsset.map((entry) => (
          <Card key={entry.asset}>
            <CardBody>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <CoinIcon asset={entry.asset} size={14} /> {entry.asset}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
                {entry.totalAmount.toLocaleString("ru-RU", { maximumFractionDigits: 4 })}
              </p>
              {entry.valuationAmount > 0 && (
                <p className="text-xs text-muted">≈ ${entry.valuationAmount.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}</p>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody>
          {isLoading && <p className="text-sm text-muted">Загрузка…</p>}
          {!isLoading && (data?.items.length ?? 0) === 0 && <p className="text-sm text-muted">Балансы ещё не синхронизированы.</p>}
          {!!data?.items.length && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                  <th className="px-3 py-2 font-medium">Аккаунт</th>
                  <th className="px-3 py-2 font-medium">Актив</th>
                  <th className="px-3 py-2 font-medium">Доступно</th>
                  <th className="px-3 py-2 font-medium">Заморожено</th>
                  <th className="px-3 py-2 font-medium">Всего</th>
                  <th className="px-3 py-2 font-medium">Оценка</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((b) => (
                  <tr key={b.id} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: b.account?.color ?? "#5b6675" }} />
                        {b.account?.name}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-ink">
                      <span className="flex items-center gap-1.5">
                        <CoinIcon asset={b.asset} size={16} /> {b.asset}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-muted">{b.availableAmount}</td>
                    <td className="px-3 py-2 tabular-nums text-muted">{b.lockedAmount}</td>
                    <td className="px-3 py-2 tabular-nums text-ink">{b.totalAmount}</td>
                    <td className="px-3 py-2 tabular-nums text-muted">
                      {b.valuationAmount ? `${b.valuationAmount} ${b.valuationFiat}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
