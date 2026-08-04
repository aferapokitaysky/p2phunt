import clsx from "clsx";

const TONE_MAP: Record<string, string> = {
  // deal / job / generic positive
  completed: "bg-success/15 text-success border-success/30",
  succeeded: "bg-success/15 text-success border-success/30",
  active: "bg-success/15 text-success border-success/30",
  online: "bg-success/15 text-success border-success/30",
  success: "bg-success/15 text-success border-success/30",
  read: "bg-subtle/15 text-subtle border-subtle/30",
  // pending / in-progress
  pending: "bg-warning/15 text-warning border-warning/30",
  queued: "bg-warning/15 text-warning border-warning/30",
  running: "bg-accent/15 text-accent border-accent/30",
  connecting: "bg-accent/15 text-accent border-accent/30",
  payment_pending: "bg-warning/15 text-warning border-warning/30",
  paid: "bg-accent/15 text-accent border-accent/30",
  appeal: "bg-warning/15 text-warning border-warning/30",
  unread: "bg-accent/15 text-accent border-accent/30",
  dry_run: "bg-accent/15 text-accent border-accent/30",
  new: "bg-accent/15 text-accent border-accent/30",
  // negative
  error: "bg-danger/15 text-danger border-danger/30",
  failed: "bg-danger/15 text-danger border-danger/30",
  cancelled: "bg-danger/15 text-danger border-danger/30",
  expired: "bg-danger/15 text-danger border-danger/30",
  critical: "bg-danger/15 text-danger border-danger/30",
  reauth_required: "bg-danger/15 text-danger border-danger/30",
  blocked_by_mode: "bg-danger/15 text-danger border-danger/30",
  blocked_by_guard: "bg-danger/15 text-danger border-danger/30",
  cooldown: "bg-subtle/15 text-subtle border-subtle/30",
  // neutral
  draft: "bg-subtle/15 text-subtle border-subtle/30",
  disabled: "bg-subtle/15 text-subtle border-subtle/30",
  paused: "bg-subtle/15 text-subtle border-subtle/30",
  archived: "bg-subtle/15 text-subtle border-subtle/30",
  skipped: "bg-subtle/15 text-subtle border-subtle/30",
  unknown: "bg-subtle/15 text-subtle border-subtle/30",
  out_of_balance: "bg-warning/15 text-warning border-warning/30",
  updating: "bg-accent/15 text-accent border-accent/30",
  info: "bg-accent/15 text-accent border-accent/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  // modes
  manual: "bg-subtle/15 text-subtle border-subtle/30",
  auto: "bg-brand/15 text-brand border-brand/30",
  // log level aliases
  warn: "bg-warning/15 text-warning border-warning/30"
};

const LABELS: Record<string, string> = {
  // deal statuses
  new: "новая",
  pending: "в ожидании",
  payment_pending: "ждёт оплаты",
  paid: "оплачено",
  appeal: "апелляция",
  completed: "завершена",
  cancelled: "отменена",
  expired: "истекла",
  failed: "ошибка",
  unknown: "неизвестно",
  // account statuses
  draft: "черновик",
  connecting: "подключение",
  active: "активен",
  disabled: "отключён",
  error: "ошибка",
  reauth_required: "нужна переавторизация",
  archived: "архивирован",
  // ad statuses
  paused: "приостановлено",
  out_of_balance: "нет баланса",
  updating: "обновляется",
  online: "онлайн",
  // job / sync statuses
  queued: "в очереди",
  running: "выполняется",
  succeeded: "успешно",
  retrying: "повтор",
  // automation execution statuses
  dry_run: "пробный запуск",
  skipped: "пропущено",
  blocked_by_mode: "заблокировано режимом",
  blocked_by_guard: "заблокировано защитой",
  cooldown: "остывание",
  // notifications
  unread: "непрочитано",
  read: "прочитано",
  info: "инфо",
  success: "успех",
  warning: "внимание",
  critical: "критично",
  // modes
  manual: "ручной",
  auto: "авто",
  // log level
  warn: "предупреждение"
};

export function statusLabel(status: string): string {
  return LABELS[status] ?? status.replace(/_/g, " ");
}

export function StatusChip({ status, className }: { status: string; className?: string }) {
  const tone = TONE_MAP[status] ?? "bg-subtle/15 text-subtle border-subtle/30";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums",
        tone,
        className
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
