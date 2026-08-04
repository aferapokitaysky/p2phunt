import clsx from "clsx";

export interface StatBarItem {
  label: string;
  value: string | number;
  tone?: "warning" | "danger";
}

const TONE_TEXT: Record<string, string> = {
  warning: "text-warning",
  danger: "text-danger"
};

export function StatBar({
  items,
  notice
}: {
  items: StatBarItem[];
  notice?: { text: string; tone?: "warning" | "danger" };
}) {
  return (
    <div className="glass-panel flex flex-wrap items-center gap-x-7 gap-y-3 rounded-2xl px-5 py-3.5">
      {items.map((item, i) => (
        <div key={item.label} className={clsx("flex items-baseline gap-2", i > 0 && "border-l border-line pl-7")}>
          <span className={clsx("text-xl font-bold tabular-nums", item.tone ? TONE_TEXT[item.tone] : "text-ink")}>{item.value}</span>
          <span className="text-xs text-muted">{item.label}</span>
        </div>
      ))}
      {notice && (
        <div
          className={clsx(
            "ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
            notice.tone === "danger" ? "bg-danger/12 text-danger" : "bg-warning/12 text-warning"
          )}
        >
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current" />
          {notice.text}
        </div>
      )}
    </div>
  );
}
