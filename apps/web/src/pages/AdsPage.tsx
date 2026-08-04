import { Pause, Play, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button.js";
import { Card, CardBody } from "../components/Card.js";
import { CoinIcon } from "../components/CoinIcon.js";
import { ConfirmDialog } from "../components/ConfirmDialog.js";
import { Checkbox } from "../components/Checkbox.js";
import { Input } from "../components/Field.js";
import { PageHeader } from "../components/PageHeader.js";
import { StatusChip } from "../components/StatusChip.js";
import { useAds, useBulkPreview, useBulkUpdatePrice, useSetAdEnabled, useUpdateAdPrice } from "../hooks/api.js";

const sideLabel = (side: string) => (side === "buy" ? "Покупка" : "Продажа");

function pluralAds(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "объявление";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "объявления";
  return "объявлений";
}

export function AdsPage() {
  const { data: ads = [], isLoading } = useAds();
  const updatePrice = useUpdateAdPrice();
  const setEnabled = useSetAdEnabled();
  const bulkPreview = useBulkPreview();
  const bulkUpdate = useBulkUpdatePrice();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [delta, setDelta] = useState("0");
  const [preview, setPreview] = useState<{ adId: string; externalId: string | null; currentPrice: number; newPrice: number }[] | null>(null);
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runPreview = () => {
    if (selected.size === 0 || !delta) return;
    bulkPreview.mutate({ adIds: [...selected], priceDeltaPercent: Number(delta) }, { onSuccess: setPreview });
  };

  const confirmBulk = () => {
    bulkUpdate.mutate(
      { adIds: [...selected], priceDeltaPercent: Number(delta) },
      { onSuccess: () => { setPreview(null); setSelected(new Set()); } }
    );
  };

  return (
    <div>
      <PageHeader title="Объявления" subtitle="Управляйте своими живыми P2P-объявлениями по всем аккаунтам." />

      <Card className="mb-4">
        <CardBody className="flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-1 text-xs font-medium text-muted">Массовое изменение цены (%)</p>
            <Input className="w-32" type="number" step="0.1" value={delta} onChange={(e) => setDelta(e.target.value)} />
          </div>
          <Button disabled={selected.size === 0} onClick={runPreview}>
            Предпросмотр для {selected.size} {pluralAds(selected.size)}
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {isLoading && <p className="text-sm text-muted">Загрузка…</p>}
          {!isLoading && ads.length === 0 && <p className="text-sm text-muted">Объявления ещё не синхронизированы.</p>}
          {ads.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2 font-medium">Аккаунт</th>
                  <th className="px-3 py-2 font-medium">Пара</th>
                  <th className="px-3 py-2 font-medium">Сторона</th>
                  <th className="px-3 py-2 font-medium">Цена</th>
                  <th className="px-3 py-2 font-medium">Лимиты</th>
                  <th className="px-3 py-2 font-medium">Статус</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-2">
                      <Checkbox checked={selected.has(ad.id)} onChange={() => toggle(ad.id)} />
                    </td>
                    <td className="px-3 py-2">{ad.account?.name}</td>
                    <td className="px-3 py-2 font-medium text-ink">
                      <span className="flex items-center gap-1.5">
                        <CoinIcon asset={ad.cryptoAsset} size={16} />
                        {ad.cryptoAsset}/{ad.fiatAsset}
                      </span>
                    </td>
                    <td className="px-3 py-2">{sideLabel(ad.side)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Input
                          className="w-24"
                          value={editingPrice[ad.id] ?? ad.price}
                          onChange={(e) => setEditingPrice((p) => ({ ...p, [ad.id]: e.target.value }))}
                        />
                        <Button
                          size="sm"
                          onClick={() => updatePrice.mutate({ id: ad.id, price: editingPrice[ad.id] ?? ad.price })}
                          disabled={!editingPrice[ad.id] || editingPrice[ad.id] === ad.price}
                        >
                          <Send size={11} />
                        </Button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted tabular-nums">
                      {ad.minLimit ?? "—"}–{ad.maxLimit ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <StatusChip status={ad.status} />
                    </td>
                    <td className="px-3 py-2">
                      <Button size="sm" onClick={() => setEnabled.mutate({ id: ad.id, enabled: ad.status !== "active" })}>
                        {ad.status === "active" ? <Pause size={12} /> : <Play size={12} />}
                        {ad.status === "active" ? "Пауза" : "Включить"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={!!preview}
        title={`Обновить цену для ${preview?.length ?? 0} ${pluralAds(preview?.length ?? 0)}?`}
        description={
          preview?.map((p) => `${p.externalId ?? p.adId}: ${p.currentPrice} → ${p.newPrice}`).join("\n") ?? ""
        }
        confirmLabel="Применить изменения"
        onConfirm={confirmBulk}
        onCancel={() => setPreview(null)}
      />
    </div>
  );
}
