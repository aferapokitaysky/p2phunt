import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand-gradient text-onPrimary hover:brightness-110 border-transparent shadow-glass",
  secondary: "bg-glass hover:bg-glassHi text-ink border-glassBorder",
  danger: "bg-danger/15 text-danger hover:bg-danger/25 border-danger/30",
  ghost: "bg-transparent text-muted hover:text-ink hover:bg-glassHi border-transparent"
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3.5 py-1.5 text-sm"
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  disabled,
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-xl border font-medium backdrop-blur-md transition-all disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      {loading ? "…" : props.children}
    </button>
  );
}
