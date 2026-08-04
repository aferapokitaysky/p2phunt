import { useState } from "react";
import clsx from "clsx";
import { CheckCheck } from "lucide-react";
import { Button } from "../components/Button.js";
import { Card, CardBody } from "../components/Card.js";
import { PageHeader } from "../components/PageHeader.js";
import { StatusChip } from "../components/StatusChip.js";
import {
  useAuditLogs,
  useConnectorLogs,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useSyncJobLogs
} from "../hooks/api.js";

const TABS = ["notifications", "audit", "connector", "sync-jobs"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  notifications: "Уведомления",
  audit: "Аудит",
  connector: "Коннектор",
  "sync-jobs": "Синхронизации"
};

export function ActivityPage() {
  const [tab, setTab] = useState<Tab>("notifications");
  const { data: notifications = [], isLoading: notificationsLoading } = useNotifications();
  const { data: audit = [] } = useAuditLogs();
  const { data: connector = [] } = useConnectorLogs();
  const { data: syncJobs = [] } = useSyncJobLogs();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <div>
      <PageHeader
        title="Активность"
        subtitle="Уведомления, аудит-трейл, вызовы коннекторов и синхронизации — вся история в одном месте."
        actions={
          tab === "notifications" && unreadCount > 0 ? (
            <Button onClick={() => markAllRead.mutate()}>
              <CheckCheck size={14} /> Отметить все прочитанными
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium",
              tab === t ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"
            )}
          >
            {TAB_LABELS[t]}
            {t === "notifications" && unreadCount > 0 && (
              <span className="rounded-full bg-danger/15 px-1.5 text-[10px] font-bold text-danger">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardBody className="divide-y divide-line/60">
          {tab === "notifications" &&
            (notificationsLoading ? (
              <p className="py-4 text-sm text-muted">Загрузка…</p>
            ) : notifications.length === 0 ? (
              <p className="py-4 text-sm text-muted">Уведомлений пока нет.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusChip status={n.severity} />
                      <span className="text-sm font-medium text-ink">{n.title}</span>
                      {n.status === "unread" && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </div>
                    <p className="mt-1 text-xs text-muted">{new Date(n.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                  {n.status === "unread" && (
                    <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}>
                      Прочитано
                    </Button>
                  )}
                </div>
              ))
            ))}

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
