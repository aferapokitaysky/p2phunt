import clsx from "clsx";
import type { PropsWithChildren } from "react";

export function Card({
  children,
  className,
  onClick
}: PropsWithChildren<{ className?: string; onClick?: () => void }>) {
  return (
    <div className={clsx("glass-panel rounded-2xl", className)} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("flex items-center justify-between border-b border-line px-4 py-3", className)}>{children}</div>;
}

export function CardBody({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("p-4", className)}>{children}</div>;
}
