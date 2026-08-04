import { Octagon, Zap } from "lucide-react";
import { useState } from "react";
import { useEmergencyStop, useSetWorkspaceMode } from "../hooks/api.js";
import { useAuthStore } from "../store/auth.js";
import { ConfirmDialog } from "./ConfirmDialog.js";
import clsx from "clsx";

export function ModeControls() {
  const workspace = useAuthStore((s) => s.workspace);
  const patchWorkspace = useAuthStore((s) => s.patchWorkspace);
  const setMode = useSetWorkspaceMode();
  const emergencyStop = useEmergencyStop();
  const [confirmStop, setConfirmStop] = useState(false);

  if (!workspace) return null;

  const toggleMode = () => {
    const next = workspace.mode === "manual" ? "auto" : "manual";
    setMode.mutate(next, { onSuccess: () => patchWorkspace({ mode: next }) });
  };

  const doStop = (active: boolean) => {
    emergencyStop.mutate(active, { onSuccess: () => patchWorkspace({ emergencyStop: active }) });
    setConfirmStop(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleMode}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
          workspace.mode === "auto" ? "border-brand/40 bg-brand/15 text-brand" : "border-line bg-glass text-muted"
        )}
        title="Переключить режим Ручной/Авто"
      >
        <Zap size={13} />
        {workspace.mode === "auto" ? "Авторежим" : "Ручной режим"}
      </button>

      {workspace.emergencyStop ? (
        <button
          onClick={() => doStop(false)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-danger/40 bg-danger/15 px-3 py-1.5 text-xs font-semibold text-danger"
        >
          <Octagon size={13} />
          Остановлено — возобновить
        </button>
      ) : (
        <button
          onClick={() => setConfirmStop(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-glass px-3 py-1.5 text-xs font-semibold text-muted hover:text-danger"
        >
          <Octagon size={13} />
          Экстренная остановка
        </button>
      )}

      <ConfirmDialog
        open={confirmStop}
        title="Активировать экстренную остановку?"
        description="Это немедленно заблокирует все действия автоматизации в рабочем пространстве, пока вы не возобновите работу."
        confirmLabel="Остановить всё"
        danger
        onConfirm={() => doStop(true)}
        onCancel={() => setConfirmStop(false)}
      />
    </div>
  );
}
