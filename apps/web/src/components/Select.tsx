import clsx from "clsx";
import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: ReactNode;
}

function extractOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((el) => ({ value: (el.props as { value: string }).value, label: (el.props as { children: ReactNode }).children }));
}

export function Select({
  value,
  onChange,
  children,
  className
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = extractOptions(children);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-glassBorder bg-glass px-3 py-1.5 text-left text-sm text-ink backdrop-blur-md transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
      >
        <span className="truncate">{selected?.label ?? "—"}</span>
        <ChevronDown size={14} className={clsx("flex-shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="glass-panel-strong absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-auto rounded-xl p-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={clsx(
                "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
                opt.value === value ? "bg-brand/15 text-brand" : "text-ink hover:bg-glassHi"
              )}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && <Check size={13} className="flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
