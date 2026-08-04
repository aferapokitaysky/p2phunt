import type { ColumnDef } from "@tanstack/react-table";
import { Download, Search } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../components/Button.js";
import { Card } from "../components/Card.js";
import { CoinIcon } from "../components/CoinIcon.js";
import { DataTable } from "../components/DataTable.js";
import { Drawer } from "../components/Drawer.js";
import { Input } from "../components/Field.js";
import { Select } from "../components/Select.js";
import { PageHeader } from "../components/PageHeader.js";
import { StatusChip, statusLabel } from "../components/StatusChip.js";
import { fetchDealsCsv, useAddDealMessage, useAddDealNote, useDeal, useDeals, useUpdateDeal, type DealsFilter } from "../hooks/api.js";
import type { Deal } from "../lib/types.js";

const STATUSES = ["", "new", "pending", "payment_pending", "paid", "appeal", "completed", "cancelled", "expired", "failed"];
const sideLabel = (side: string) => (side === "buy" ? "Покупка" : "Продажа");

function DealDrawer({ dealId, onClose }: { dealId: string; onClose: () => void }) {
  const { data: deal } = useDeal(dealId);
  const updateDeal = useUpdateDeal();
  const addNote = useAddDealNote();
  const addMessage = useAddDealMessage();
  const [noteText, setNoteText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [comment, setComment] = useState(deal?.comment ?? "");

  if (!deal) return <Drawer open onClose={onClose} title="Загрузка…">…</Drawer>;

  return (
    <Drawer open onClose={onClose} title={`${sideLabel(deal.side)} ${deal.cryptoAsset}/${deal.fiatAsset}`}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={deal.status} />
          {deal.externalStatus && <span className="text-xs text-muted">источник: {deal.externalStatus}</span>}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted">Сумма</p>
            <p className="tabular-nums text-ink">{deal.cryptoAmount} {deal.cryptoAsset}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Итого в фиате</p>
            <p className="tabular-nums text-ink">{deal.fiatAmount} {deal.fiatAsset}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Цена</p>
            <p className="tabular-nums text-ink">{deal.price}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Прибыль</p>
            <p className="tabular-nums text-ink">{deal.profitAmount ? `${deal.profitAmount} ${deal.profitAsset}` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Контрагент</p>
            <p className="text-ink">{deal.counterpartyName ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Открыта</p>
            <p className="text-ink">{deal.openedAt ? new Date(deal.openedAt).toLocaleString("ru-RU") : "—"}</p>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted">Комментарий</p>
          <div className="flex gap-2">
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Добавить приватный комментарий…" />
            <Button size="sm" onClick={() => updateDeal.mutate({ id: deal.id, comment })}>
              Сохранить
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted">Переписка</p>
          <p className="mb-2 text-xs text-subtle">
            У бирж нет API для чата. Здесь хранятся только внутренние заметки — для реального общения с контрагентом используйте саму биржу.
          </p>
          <div className="mb-2 max-h-52 space-y-2 overflow-y-auto rounded-lg border border-line bg-glass p-2">
            {deal.messages.length === 0 && <p className="text-xs text-muted">Сообщений пока нет.</p>}
            {deal.messages.map((m) => (
              <div key={m.id} className={m.direction === "outbound" ? "text-right" : "text-left"}>
                <span className="inline-block max-w-[85%] rounded-lg bg-glass px-2.5 py-1.5 text-xs text-ink">
                  <span className="mb-0.5 block text-[10px] text-subtle">
                    {m.senderName ?? (m.direction === "outbound" ? "вы" : "контрагент")} · {m.source} · {new Date(m.sentAt).toLocaleTimeString("ru-RU")}
                  </span>
                  {m.body}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Записать сообщение…" />
            <Button
              size="sm"
              onClick={() => {
                if (!messageText.trim()) return;
                addMessage.mutate({ id: deal.id, body: messageText, direction: "outbound" });
                setMessageText("");
              }}
            >
              Записать
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted">Внутренние заметки</p>
          <div className="mb-2 space-y-1">
            {deal.notes.map((n) => (
              <div key={n.id} className="rounded-lg bg-glass px-2.5 py-1.5 text-xs text-ink">
                {n.body}
                <span className="ml-2 text-subtle">{new Date(n.createdAt).toLocaleString("ru-RU")}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Добавить заметку…" />
            <Button
              size="sm"
              onClick={() => {
                if (!noteText.trim()) return;
                addNote.mutate({ id: deal.id, body: noteText });
                setNoteText("");
              }}
            >
              Добавить
            </Button>
          </div>
        </div>

        <details className="text-xs text-muted">
          <summary className="cursor-pointer select-none">Исходные данные коннектора</summary>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-glass p-2">{JSON.stringify(deal.rawPayload, null, 2)}</pre>
        </details>
      </div>
    </Drawer>
  );
}

export function DealsPage() {
  const [params, setParams] = useSearchParams();
  const [activeDeal, setActiveDeal] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const filter: DealsFilter = {
    status: params.get("status") ?? undefined,
    side: params.get("side") ?? undefined,
    search: params.get("search") ?? undefined,
    page: 1,
    limit: 100
  };

  const { data, isLoading } = useDeals(filter);

  const columns: ColumnDef<Deal, unknown>[] = [
    {
      accessorKey: "openedAt",
      header: "Дата",
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return <span className="text-muted">{v ? new Date(v).toLocaleString("ru-RU") : "—"}</span>;
      }
    },
    {
      id: "account",
      header: "Аккаунт",
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: row.original.account?.color ?? "#5b6675" }} />
          {row.original.account?.name}
        </span>
      )
    },
    { accessorKey: "side", header: "Сторона", cell: ({ getValue }) => <span>{sideLabel(String(getValue()))}</span> },
    {
      id: "amount",
      header: "Сумма",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <CoinIcon asset={row.original.cryptoAsset} size={14} />
          {row.original.cryptoAmount} {row.original.cryptoAsset}
        </span>
      )
    },
    {
      id: "total",
      header: "Итого",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <CoinIcon asset={row.original.fiatAsset} size={14} />
          {row.original.fiatAmount} {row.original.fiatAsset}
        </span>
      )
    },
    { accessorKey: "price", header: "Цена", cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span> },
    {
      accessorKey: "profitAmount",
      header: "Прибыль",
      cell: ({ row }) =>
        row.original.profitAmount ? (
          <span className="tabular-nums text-brand">
            +{row.original.profitAmount} {row.original.profitAsset}
          </span>
        ) : (
          <span className="text-subtle">—</span>
        )
    },
    { accessorKey: "counterpartyName", header: "Контрагент" },
    { accessorKey: "status", header: "Статус", cell: ({ getValue }) => <StatusChip status={String(getValue())} /> }
  ];

  return (
    <div>
      <PageHeader
        title="Сделки"
        subtitle="Единая лента по всем подключённым аккаунтам — больше не нужно переключаться между вкладками."
        actions={
          <Button
            loading={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                const csv = await fetchDealsCsv(filter);
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "deals.csv";
                link.click();
                URL.revokeObjectURL(url);
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download size={14} /> Экспорт в CSV
          </Button>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-2.5 text-subtle" />
            <Input
              className="w-56 pl-8"
              placeholder="Поиск по контрагенту, id, комментарию…"
              defaultValue={filter.search}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = (e.target as HTMLInputElement).value;
                  setParams((p) => {
                    if (value) p.set("search", value);
                    else p.delete("search");
                    return p;
                  });
                }
              }}
            />
          </div>
          <Select
            className="w-40"
            value={filter.status ?? ""}
            onChange={(value) =>
              setParams((p) => {
                if (value) p.set("status", value);
                else p.delete("status");
                return p;
              })
            }
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "" ? "Все статусы" : statusLabel(s)}
              </option>
            ))}
          </Select>
          <Select
            className="w-32"
            value={filter.side ?? ""}
            onChange={(value) =>
              setParams((p) => {
                if (value) p.set("side", value);
                else p.delete("side");
                return p;
              })
            }
          >
            <option value="">Любая сторона</option>
            <option value="buy">Покупка</option>
            <option value="sell">Продажа</option>
          </Select>
        </div>
      </PageHeader>

      <Card>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isLoading}
          onRowClick={(row) => setActiveDeal(row.id)}
          emptyMessage="Под эти фильтры пока ничего не попадает."
        />
      </Card>

      {data && (
        <p className="mt-2 text-xs text-muted">
          Показано {data.items.length} из {data.total} сделок
        </p>
      )}

      {activeDeal && <DealDrawer dealId={activeDeal} onClose={() => setActiveDeal(null)} />}
    </div>
  );
}
