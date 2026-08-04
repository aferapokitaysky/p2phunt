import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/Button.js";
import { Card, CardBody } from "../components/Card.js";
import { CoinIcon } from "../components/CoinIcon.js";
import { Field, Input } from "../components/Field.js";
import { PageHeader } from "../components/PageHeader.js";
import { StatusChip } from "../components/StatusChip.js";
import { useCreateRateSource, useCurrentRates, useManualOverride, usePriceQuote, useRateHistory, useRateSources } from "../hooks/api.js";
import { SCOPE_LABELS } from "../lib/labels.js";

export function RatesPage() {
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
    <div>
      <PageHeader title="Курсы" subtitle="Все источники цен, наценки и итоговая цена, которая пойдёт в ваши объявления." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <h2 className="mb-3 text-sm font-semibold text-ink">Текущие курсы</h2>
            {rates.length === 0 ? (
              <p className="text-sm text-muted">Курсов пока нет — добавьте источник или задайте ручное значение ниже.</p>
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
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#8b96a5" }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#8b96a5" }} width={50} />
                    <Tooltip contentStyle={{ background: "#151b23", border: "1px solid #242c37", fontSize: 12 }} />
                    <Line type="monotone" dataKey="mid" stroke="#3ddc97" strokeWidth={2} dot={false} />
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
    </div>
  );
}
