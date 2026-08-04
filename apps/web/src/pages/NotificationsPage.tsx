import { CheckCheck } from "lucide-react";
import { Button } from "../components/Button.js";
import { Card, CardBody } from "../components/Card.js";
import { PageHeader } from "../components/PageHeader.js";
import { StatusChip } from "../components/StatusChip.js";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "../hooks/api.js";

export function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <div>
      <PageHeader
        title="Уведомления"
        subtitle="Все оповещения платформы — события по сделкам, сбои синхронизации, запуски автоматизации."
        actions={
          <Button onClick={() => markAllRead.mutate()}>
            <CheckCheck size={14} /> Отметить все прочитанными
          </Button>
        }
      />

      <Card>
        <CardBody className="divide-y divide-line/60">
          {isLoading && <p className="py-4 text-sm text-muted">Загрузка…</p>}
          {!isLoading && notifications.length === 0 && <p className="py-4 text-sm text-muted">Уведомлений пока нет.</p>}
          {notifications.map((n) => (
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
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
