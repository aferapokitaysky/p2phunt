import { ArrowLeft, Power, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button.js";
import { Card, CardBody } from "../components/Card.js";
import { CoinIcon } from "../components/CoinIcon.js";
import { Field, Input } from "../components/Field.js";
import { PageHeader } from "../components/PageHeader.js";
import { StatusChip } from "../components/StatusChip.js";
import { useAccount, useDisableAccount, useSetAccountSecret, useSyncAccount, useSyncJobs } from "../hooks/api.js";
import clsx from "clsx";

const TABS = ["overview", "balances", "deals", "ads", "logs", "connection"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: "Обзор",
  balances: "Балансы",
  deals: "Сделки",
  ads: "Объявления",
  logs: "Журнал",
  connection: "Подключение"
};

function SecretForm({ accountId }: { accountId: string }) {
  const setSecret = useSetAccountSecret();
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  return (
    <div className="space-y-2">
      <Field label="API-ключ">
        <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Рекомендуется ключ только для чтения" />
      </Field>
      <Field label="API-секрет">
        <Input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} />
      </Field>
      <Button
        variant="primary"
        size="sm"
        loading={setSecret.isPending}
        disabled={!apiKey || !apiSecret}
        onClick={() =>
          setSecret.mutate(
            { id: accountId, kind: "api_key", payload: { apiKey, apiSecret } },
            { onSuccess: () => { setApiKey(""); setApiSecret(""); } }
          )
        }
      >
        Сохранить ключи (зашифровано)
      </Button>
      <p className="text-xs text-muted">Секреты хранятся в зашифрованном виде и никогда не возвращаются через API.</p>
    </div>
  );
}

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: account, isLoading } = useAccount(id);
  const { data: syncJobs = [] } = useSyncJobs(id);
  const syncAccount = useSyncAccount();
  const disableAccount = useDisableAccount();
  const [tab, setTab] = useState<Tab>("overview");

  if (isLoading || !account) return <div className="text-sm text-muted">Загрузка аккаунта…</div>;

  return (
    <div>
      <Link to="/accounts" className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
        <ArrowLeft size={13} /> Назад к аккаунтам
      </Link>

      <PageHeader
        title={account.name}
        subtitle={`${account.platform.name} · ${account.connectorDefinition.slug}`}
        actions={
          <>
            <Button onClick={() => syncAccount.mutate(account.id)} loading={syncAccount.isPending}>
              <RefreshCw size={14} /> Синхронизировать
            </Button>
            <Button variant="danger" onClick={() => disableAccount.mutate(account.id)}>
              <Power size={14} /> Отключить
            </Button>
          </>
        }
      >
        <div className="mt-2 flex gap-2">
          <StatusChip status={account.status} />
          <StatusChip status={account.mode} />
          {account.lastError && <span className="text-xs text-danger">{account.lastError}</span>}
        </div>
      </PageHeader>

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

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardBody>
              <h3 className="mb-2 text-sm font-semibold text-ink">История синхронизаций</h3>
              {syncJobs.length === 0 ? (
                <p className="text-sm text-muted">Синхронизаций ещё не было.</p>
              ) : (
                <ul className="space-y-2">
                  {syncJobs.slice(0, 8).map((job) => (
                    <li key={job.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted">{new Date(job.createdAt).toLocaleString("ru-RU")}</span>
                      <StatusChip status={job.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="mb-2 text-sm font-semibold text-ink">Теги</h3>
              <div className="flex flex-wrap gap-1">
                {account.tags.length === 0 && <span className="text-sm text-muted">Нет тегов</span>}
                {account.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-glass px-2 py-0.5 text-xs text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "balances" && (
        <Card>
          <CardBody>
            {account.balances.length === 0 ? (
              <p className="text-sm text-muted">Балансы ещё не синхронизированы.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {account.balances.map((b) => (
                    <tr key={b.id} className="border-b border-line/60 last:border-0">
                      <td className="flex items-center gap-2 py-2 font-medium text-ink">
                        <CoinIcon asset={b.asset} size={16} /> {b.asset}
                      </td>
                      <td className="py-2 tabular-nums text-muted">доступно {b.availableAmount}</td>
                      <td className="py-2 tabular-nums text-muted">заморожено {b.lockedAmount}</td>
                      <td className="py-2 tabular-nums text-ink">всего {b.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      )}

      {tab === "deals" && (
        <Card>
          <CardBody>
            {account.deals.length === 0 ? (
              <p className="text-sm text-muted">Сделки ещё не синхронизированы.</p>
            ) : (
              <ul className="space-y-2">
                {account.deals.map((d) => (
                  <li key={d.id} className="flex items-center justify-between border-b border-line/60 pb-2 text-sm last:border-0">
                    <span className="flex items-center gap-1.5">
                      <CoinIcon asset={d.cryptoAsset} size={14} />
                      {d.side === "buy" ? "покупка" : "продажа"} {d.cryptoAmount} {d.cryptoAsset} @ {d.price} {d.fiatAsset}
                    </span>
                    <StatusChip status={d.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {tab === "ads" && (
        <Card>
          <CardBody>
            {account.ads.length === 0 ? (
              <p className="text-sm text-muted">Объявления ещё не синхронизированы.</p>
            ) : (
              <ul className="space-y-2">
                {account.ads.map((ad) => (
                  <li key={ad.id} className="flex items-center justify-between border-b border-line/60 pb-2 text-sm last:border-0">
                    <span className="flex items-center gap-1.5">
                      <CoinIcon asset={ad.cryptoAsset} size={14} />
                      {ad.side === "buy" ? "покупка" : "продажа"} {ad.cryptoAsset}/{ad.fiatAsset} @ {ad.price}
                    </span>
                    <StatusChip status={ad.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {tab === "logs" && (
        <Card>
          <CardBody>
            {account.connectorLogs.length === 0 ? (
              <p className="text-sm text-muted">Журнал коннектора пуст.</p>
            ) : (
              <ul className="space-y-2">
                {account.connectorLogs.map((log) => (
                  <li key={log.id} className="flex items-center justify-between border-b border-line/60 pb-2 text-sm last:border-0">
                    <span className="text-ink">{log.message}</span>
                    <span className="flex items-center gap-2">
                      <StatusChip status={log.level} />
                      <span className="text-xs text-muted">{new Date(log.createdAt).toLocaleTimeString("ru-RU")}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {tab === "connection" && (
        <Card>
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold text-ink">Доступы</h3>
            {account.secrets.length > 0 && (
              <ul className="mb-4 space-y-1 text-sm text-muted">
                {account.secrets.map((s) => (
                  <li key={s.id}>
                    {s.kind} — <StatusChip status={s.status} /> — добавлено {new Date(s.createdAt).toLocaleDateString("ru-RU")}
                  </li>
                ))}
              </ul>
            )}
            <SecretForm accountId={account.id} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
