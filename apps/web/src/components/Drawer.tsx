import { X } from "lucide-react";
import type { PropsWithChildren } from "react";

export function Drawer({
  open,
  onClose,
  title,
  children
}: PropsWithChildren<{ open: boolean; onClose: () => void; title: string }>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-panel-strong relative flex h-full w-full max-w-xl flex-col rounded-3xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-glassHi hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
