import clsx from "clsx";

export interface SegmentOption {
  value: string;
  label: string;
  count?: number;
}

export function SegmentedFilter({
  options,
  value,
  onChange
}: {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="glass-panel inline-flex items-center gap-1 rounded-full p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            value === opt.value ? "bg-brand text-canvas" : "text-muted hover:text-ink"
          )}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span
              className={clsx(
                "rounded-full px-1.5 text-[10px] tabular-nums",
                value === opt.value ? "bg-black/15" : "bg-glassHi"
              )}
            >
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
