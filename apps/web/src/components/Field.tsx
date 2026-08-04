import clsx from "clsx";
import { forwardRef, type InputHTMLAttributes, type PropsWithChildren } from "react";

export function Field({ label, error, children }: PropsWithChildren<{ label: string; error?: string | undefined }>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={clsx(
        "w-full rounded-xl border border-glassBorder bg-glass px-3 py-1.5 text-sm text-ink placeholder:text-subtle backdrop-blur-md focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25",
        props.className
      )}
    />
  );
});
