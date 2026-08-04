import type { PropsWithChildren, ReactNode } from "react";

export function PageHeader({ title, subtitle, actions, children }: PropsWithChildren<{ title: string; subtitle?: string; actions?: ReactNode }>) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
