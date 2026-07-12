import type { ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-500 shadow-sm shadow-brand-600/20 hover:shadow-brand-500/30 active:translate-y-0",
  secondary:
    "bg-white text-ink border border-line hover:border-line-hover hover:bg-inset/60 shadow-sm",
  ghost:
    "text-ink-secondary hover:text-ink hover:bg-inset",
  danger:
    "bg-white text-red-600 border border-line hover:border-red-200 hover:bg-red-50",
};

const SIZES: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  );
}
