import clsx from "clsx";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

export function Checkbox({
  checked,
  onChange,
  label,
  className
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("inline-flex select-none items-center gap-2 cursor-pointer", className)}>
      <span
        className={clsx(
          "relative flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md border transition-colors",
          checked ? "border-brand bg-brand" : "border-glassBorder bg-glass hover:border-accent/60"
        )}
      >
        {checked && <Check size={11} strokeWidth={3} className="text-white" />}
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </span>
      {label !== undefined && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
}
