import { useState } from "react";
import clsx from "clsx";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/Button.js";
import { Card, CardBody } from "../components/Card.js";
import { CoinIcon } from "../components/CoinIcon.js";
import { ExchangeIcon, exchangeLabel } from "../components/ExchangeIcon.js";
import { Field, Input } from "../components/Field.js";
import { PageHeader } from "../components/PageHeader.js";
import { Select } from "../components/Select.js";
import { StatusChip } from "../components/StatusChip.js";
import {
  useCreateRateSource,
  useCurrentRates,
  useManualOverride,
  useMarketAds,
  usePriceQuote,
  useRateHistory,
  useRateSources
} from "../hooks/api.js";
import { SCOPE_LABELS } from "../lib/labels.js";

const TABS = ["live", "rates"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = { live: "Живая лента", rates: "Курсы и наценки" };

function LiveMarketTab() {
  const [cryptoAsset, setCryptoAsset] = useState("USDT");
  const [fiatAsset, setFiatAsset] = useState("UAH");
  const [side, setSide] = useState<"buy" | "sell">("buy");

  const { data, isLoading, dataUpdatedAt } = useMarketAds(cryptoAsset, fiatAsset, side, cryptoAsset.length >= 2 && fiatAsset.length >= 2);

  return (
    <div>
      <Card className="mb-4">
        <CardBody className="flex flex-wrap items-end gap-3">
          <Field label="Криптоактив">
            <Input className="w-28" value={cryptoAsset} onChange={(e) => setCryptoAsset(e.target.value.toUpperCase())} />
          </Field>
          <Field label="Фиатная валюта">
            <Input className="w-28" value={fiatAsset} onChange={(e) => setFiatAsset(e.target.value.toUpperCase())} />
          </Field>
          <Field label="Я хочу">
            <Select className="w-40" value={side} onChange={(value) => setSide(value as "buy" | "sell")}>
              <option value="buy">Купить {cryptoAsset}</option>
              <option value="sell">Продать {cryptoAsset}</option>
            </Select>
          </Field>
          {dataUpdatedAt > 0 && <span className="text-xs text-subtle">обновлено {new Date(dataUpdatedAt).toLocaleTimeString("ru-RU")}</span>}
        </CardBody>
      </Card>

      {!!data?.errors.length && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle size={13} />
          {data.errors.map((e) => `${exchangeLabel(e.platform)}: ${e.error}`).join(" · ")}
        </div>
      )}

      <Card>
        <CardBody>
          {isLoading && <p className="text-sm text-muted">Загрузка живых предложений…</p>}
          {!isLoading && (data?.ads.length ?? 0) === 0 && <p className="text-sm text-muted">Сейчас нет предложений по этой паре.</p>}
          {!!data?.ads.length && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                  <th className="px-3 py-2 font-medium">Платформа</th>
                  <th className="px-3 py-2 font-medium">Цена</th>
                  <th className="px-3 py-2 font-medium">Лимиты</th>
                  <th className="px-3 py-2 font-medium">Продавец</th>
                  <th className="px-3 py-2 font-medium">Выполнение</th>
                  <th className="px-3 py-2 font-medium">Оплата</th>
                </tr>
              </thead>
              <tbody>
                {data.ads.map((ad) => (
                  <tr key={`${ad.platform}-${ad.externalId}`} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-glass px-2 py-0.5 text-xs font-medium text-ink">
                        <ExchangeIcon platform={ad.platform} size={16} />
                        {exchangeLabel(ad.platform)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-semibold tabular-nums text-ink">
                      <span className="inline-flex items-center gap-1.5">
                        <CoinIcon asset={ad.fiatAsset} size={14} />
                        {ad.price} {ad.fiatAsset}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-muted">
                      {ad.minLimit ?? "—"}–{ad.maxLimit ?? "—"} {ad.fiatAsset}
                    </td>
                    <td className="px-3 py-2 text-ink">{ad.advertiserName}</td>
                    <td className="px-3 py-2 text-muted">
                      {ad.advertiserOrderCount ?? "—"} сделок
                      {ad.advertiserCompletionRate !== null && ` · ${Math.round(ad.advertiserCompletionRate * 100)}%`}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">{ad.paymentMethods.slice(0, 2).join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <p className="mt-3 flex items-center gap-1 text-xs text-subtle">
        <ExternalLink size={12} /> Данные берутся напрямую с публичных P2P-страниц бирж — это не официальный партнёрский API, поэтому возможны
        задержки или сбои.
      </p>
    </div>
  );
}

function RatesTab() {
  const { data: sources = [] } = useRateSources();
  const { data: rates = [] } = useCurrentRates();
  const [selectedPair, setSelectedPair] = useState<{ base: string; quote: string } | null>(null);
  const { data: history = [] } = useRateHistory(selectedPair?.base ?? "", selectedPair?.quote ?? "", !!selectedPair);
  const manualOverride = useManualOverride();
  const createSource = useCreateRateSource();

  const [overrideForm, setOverrideForm] = useState({ baseAsset: "USDT", quoteAsset: "UAH", mid: "" });
  const [sourceForm, setSourceForm] = useState({ slug: "", name: "", priority: "100", refreshIntervalMs: "5000" });

  const { data: quote } = usePriceQuote(
    { baseAsset: overrideForm.baseAsset, quoteAsset: overrideForm.quoteAsset, side: "sell" },
    !!overrideForm.baseAsset && !!overrideForm.quoteAsset
  );

  const chartData = [...history].reverse().map((tick) => ({
    time: new Date(tick.createdAt).toLocaleTimeString("ru-RU"),
    mid: Number(tick.mid)
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardBody>
          <h2 className="mb-3 text-sm font-semibold text-ink">Текущие курсы</h2>
          {rates.length === 0 ? (
            <p className="text-sm text-muted">Курсов пока нет — добавьте источник или задайте ручное значение справа.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                  <th className="px-3 py-2 font-medium">Пара</th>
                  <th className="px-3 py-2 font-medium">Bid</th>
                  <th className="px-3 py-2 font-medium">Ask</th>
                  <th className="px-3 py-2 font-medium">Средняя</th>
                  <th className="px-3 py-2 font-medium">Источник</th>
                  <th className="px-3 py-2 font-medium">Обновлено</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-glassHi"
                    onClick={() => setSelectedPair({ base: r.baseAsset, quote: r.quoteAsset })}
                  >
                    <td className="px-3 py-2 font-medium text-ink">
                      <span className="flex items-center gap-1.5">
                        <CoinIcon asset={r.baseAsset} size={16} />
                        {r.baseAsset}/{r.quoteAsset}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-muted">{r.bid ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums text-muted">{r.ask ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums text-ink">{r.mid}</td>
                    <td className="px-3 py-2">
                      <StatusChip status={r.selectedBy} />
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">{new Date(r.updatedAt).toLocaleTimeString("ru-RU")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedPair && chartData.length > 1 && (
            <div className="mt-4 h-48">
              <p className="mb-2 text-xs text-muted">
                История: {selectedPair.base}/{selectedPair.quote}
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted)" }} width={50} />
                  <Tooltip contentStyle={{ background: "var(--glass-strong)", border: "1px solid var(--glass-border)", fontSize: 12, borderRadius: 12 }} />
                  <Line type="monotone" dataKey="mid" stroke="var(--brand)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardBody>
            <h2 className="mb-3 text-sm font-semibold text-ink">Ручное значение курса</h2>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Field label="Актив">
                  <Input value={overrideForm.baseAsset} onChange={(e) => setOverrideForm((f) => ({ ...f, baseAsset: e.target.value.toUpperCase() }))} />
                </Field>
                <Field label="Валюта">
                  <Input value={overrideForm.quoteAsset} onChange={(e) => setOverrideForm((f) => ({ ...f, quoteAsset: e.target.value.toUpperCase() }))} />
                </Field>
              </div>
              <Field label="Средняя цена">
                <Input value={overrideForm.mid} onChange={(e) => setOverrideForm((f) => ({ ...f, mid: e.target.value }))} />
              </Field>
              <Button
                variant="primary"
                size="sm"
                disabled={!overrideForm.mid}
                loading={manualOverride.isPending}
                onClick={() =>
                  manualOverride.mutate({
                    baseAsset: overrideForm.baseAsset,
                    quoteAsset: overrideForm.quoteAsset,
                    mid: Number(overrideForm.mid)
                  })
                }
              >
                Задать значение
              </Button>
            </div>

            {quote && (
              <div className="mt-3 rounded-lg bg-glass p-3 text-xs text-muted">
                <p>
                  Базовый курс: <span className="tabular-nums text-ink">{quote.baseRate}</span>
                </p>
                {quote.markup && (
                  <p>
                    Наценка: {quote.markup.value}
                    {quote.markup.markupType === "percent" ? "%" : ` ${overrideForm.quoteAsset}`} ({SCOPE_LABELS[quote.markup.scopeType] ?? quote.markup.scopeType})
                  </p>
                )}
                <p>
                  Итоговая цена продажи: <span className="tabular-nums text-brand">{quote.finalPrice}</span>
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-3 text-sm font-semibold text-ink">Источники курсов</h2>
            <ul className="mb-3 space-y-1">
              {sources.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{s.name}</span>
                  <span className="text-xs text-muted">приоритет {s.priority}</span>
                </li>
              ))}
              {sources.length === 0 && <p className="text-sm text-muted">Источники ещё не настроены.</p>}
            </ul>
            <div className="space-y-2 border-t border-line pt-3">
              <div className="flex gap-2">
                <Input placeholder="slug" value={sourceForm.slug} onChange={(e) => setSourceForm((f) => ({ ...f, slug: e.target.value }))} />
                <Input placeholder="название" value={sourceForm.name} onChange={(e) => setSourceForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="приоритет"
                  value={sourceForm.priority}
                  onChange={(e) => setSourceForm((f) => ({ ...f, priority: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="интервал, мс"
                  value={sourceForm.refreshIntervalMs}
                  onChange={(e) => setSourceForm((f) => ({ ...f, refreshIntervalMs: e.target.value }))}
                />
              </div>
              <Button
                size="sm"
                disabled={!sourceForm.slug || !sourceForm.name}
                onClick={() =>
                  createSource.mutate(
                    {
                      slug: sourceForm.slug,
                      name: sourceForm.name,
                      priority: Number(sourceForm.priority),
                      refreshIntervalMs: Number(sourceForm.refreshIntervalMs)
                    },
                    { onSuccess: () => setSourceForm({ slug: "", name: "", priority: "100", refreshIntervalMs: "5000" }) }
                  )
                }
              >
                Добавить источник
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function MarketPage() {
  const [tab, setTab] = useState<Tab>("live");

  return (
    <div>
      <PageHeader
        title="Рынок"
        subtitle="Живые публичные P2P-объявления и ваши собственные курсы с наценками — в одном месте."
      />

      <div className="mb-4 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "border-b-2 px-3 py-2 text-sm font-medium",
              tab === t ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"
            )}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "live" ? <LiveMarketTab /> : <RatesTab />}
    </div>
  );
}
