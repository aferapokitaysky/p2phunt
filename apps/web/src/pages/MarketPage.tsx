import { AlertTriangle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Card, CardBody } from "../components/Card.js";
import { CoinIcon } from "../components/CoinIcon.js";
import { ExchangeIcon, exchangeLabel } from "../components/ExchangeIcon.js";
import { Field, Input } from "../components/Field.js";
import { Select } from "../components/Select.js";
import { PageHeader } from "../components/PageHeader.js";
import { useMarketAds } from "../hooks/api.js";

export function MarketPage() {
  const [cryptoAsset, setCryptoAsset] = useState("USDT");
  const [fiatAsset, setFiatAsset] = useState("UAH");
  const [side, setSide] = useState<"buy" | "sell">("buy");

  const { data, isLoading, dataUpdatedAt } = useMarketAds(cryptoAsset, fiatAsset, side, cryptoAsset.length >= 2 && fiatAsset.length >= 2);

  return (
    <div>
      <PageHeader
        title="Рынок"
        subtitle="Живые публичные P2P-объявления с Binance и Bybit — без аккаунта и API-ключа."
      />

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
