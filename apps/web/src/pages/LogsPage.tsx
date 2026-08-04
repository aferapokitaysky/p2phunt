import { useState } from "react";
import { Card, CardBody } from "../components/Card.js";
import { PageHeader } from "../components/PageHeader.js";
import { StatusChip } from "../components/StatusChip.js";
import { useAuditLogs, useConnectorLogs, useSyncJobLogs } from "../hooks/api.js";
import clsx from "clsx";

const TABS = ["audit", "connector", "sync-jobs"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  audit: "Аудит",
  connector: "Коннектор",
  "sync-jobs": "Синхронизации"
};

export function LogsPage() {
  const [tab, setTab] = useState<Tab>("audit");
  const { data: audit = [] } = useAuditLogs();
  const { data: connector = [] } = useConnectorLogs();
  const { data: syncJobs = [] } = useSyncJobLogs();

  return (
    <div>
      <PageHeader title="Журналы" subtitle="Полный аудит-трейл — каждое действие, каждый вызов коннектора, каждая синхронизация." />

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

      <Card>
        <CardBody className="divide-y divide-line/60">
          {tab === "audit" &&
            (audit.length === 0 ? (
              <p className="py-4 text-sm text-muted">Записей аудита пока нет.</p>
            ) : (
              audit.map((entry) => (
                <div key={entry.id} className="py-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-ink">
                      {entry.action} <span className="text-muted">· {entry.entityType}</span>
                    </span>
                    <span className="text-xs text-muted">{new Date(entry.createdAt).toLocaleString("ru-RU")}</span>
                  </div>
                </div>
              ))
            ))}

          {tab === "connector" &&
            (connector.length === 0 ? (
              <p className="py-4 text-sm text-muted">Журнал коннектора пуст.</p>
            ) : (
              connector.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink">
                    {log.message} <span className="text-muted">· {log.connectorSlug}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusChip status={log.level} />
                    <span className="text-xs text-muted">{new Date(log.createdAt).toLocaleTimeString("ru-RU")}</span>
                  </div>
                </div>
              ))
            ))}

          {tab === "sync-jobs" &&
            (syncJobs.length === 0 ? (
              <p className="py-4 text-sm text-muted">Синхронизаций пока не было.</p>
            ) : (
              syncJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink">
                    {job.connectorSlug} · {job.jobType}
                    {job.stats && (
                      <span className="text-muted">
                        {" "}
                        — балансов: {job.stats.balances}, сделок: {job.stats.deals}, объявлений: {job.stats.ads}
                      </span>
                    )}
                    {job.error && <span className="text-danger"> — {job.error}</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusChip status={job.status} />
                    <span className="text-xs text-muted">{new Date(job.createdAt).toLocaleTimeString("ru-RU")}</span>
                  </div>
                </div>
              ))
            ))}
        </CardBody>
      </Card>
    </div>
  );
}
