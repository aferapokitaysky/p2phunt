import { Button } from "./Button.js";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Подтвердить",
  danger,
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="glass-panel-strong relative w-full max-w-sm rounded-3xl p-5">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-2 max-h-52 overflow-y-auto whitespace-pre-line text-sm text-muted">{description}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant={danger ? "danger" : "primary"} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
