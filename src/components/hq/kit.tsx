import type { ReactNode, ComponentType } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared building blocks for HQ and the POS so every screen feels like one product:
 * quiet stone background, crisp white panels, ink type, red only for primary actions.
 */

export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
    <div className="min-w-0">
      <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight text-ink md:text-[32px]">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink/55">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Panel = ({ title, action, children, className, padded = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) => (
  <section className={cn("overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,16,20,0.04)]", className)}>
    {(title || action) && (
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {action}
      </header>
    )}
    <div className={padded ? "p-5" : ""}>{children}</div>
  </section>
);

export const StatCard = ({ label, value, sub, icon: Icon, tone = "neutral" }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ComponentType<{ className?: string }>; tone?: "neutral" | "good" | "warn" | "accent" }) => {
  const chip = { neutral: "bg-stone-100 text-ink/70", good: "bg-emerald-50 text-emerald-700", warn: "bg-amber-50 text-amber-700", accent: "bg-primary/10 text-primary" }[tone];
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-ink/55">{label}</p>
        {Icon && <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", chip)}><Icon className="h-4 w-4" /></span>}
      </div>
      <p className="mt-2 font-display text-[26px] font-extrabold leading-none tracking-tight text-ink tabular-nums">{value}</p>
      {sub && <p className="mt-2 text-xs text-ink/50">{sub}</p>}
    </div>
  );
};

type Tone = "neutral" | "good" | "warn" | "bad" | "info" | "accent";
const toneCls: Record<Tone, string> = {
  neutral: "bg-stone-100 text-ink/70 ring-stone-200",
  good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warn: "bg-amber-50 text-amber-800 ring-amber-200",
  bad: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  accent: "bg-primary/10 text-primary ring-primary/20",
};
export const Pill = ({ tone = "neutral", children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) => (
  <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", toneCls[tone])}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

export const Kbd = ({ children, dark }: { children: ReactNode; dark?: boolean }) => (
  <kbd className={cn("rounded-md border px-1.5 py-0.5 font-sans text-[10px] font-semibold", dark ? "border-white/25 bg-white/10 text-white/80" : "border-line bg-stone-50 text-ink/55")}>{children}</kbd>
);

export const Segmented = <T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) => (
  <div role="tablist" className="inline-flex rounded-xl border border-line bg-white p-1 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
    {options.map((o) => (
      <button
        key={o.value}
        role="tab"
        aria-selected={value === o.value}
        onClick={() => onChange(o.value)}
        className={cn("rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition", value === o.value ? "bg-ink text-white shadow-sm" : "text-ink/60 hover:text-ink")}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const EmptyState = ({ icon: Icon, title, children, action }: { icon?: ComponentType<{ className?: string }>; title: string; children?: ReactNode; action?: ReactNode }) => (
  <div className="flex flex-col items-center px-6 py-14 text-center">
    {Icon && <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-ink/50"><Icon className="h-6 w-6" /></span>}
    <p className="font-bold text-ink">{title}</p>
    {children && <p className="mt-1 max-w-sm text-sm text-ink/55">{children}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const SkeletonRows = ({ rows = 5 }: { rows?: number }) => (
  <div className="divide-y divide-line">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-5 py-4">
        <div className="h-9 w-9 animate-pulse rounded-lg bg-stone-100" />
        <div className="flex-1 space-y-2"><div className="h-3 w-1/3 animate-pulse rounded bg-stone-100" /><div className="h-2.5 w-1/5 animate-pulse rounded bg-stone-100" /></div>
        <div className="h-3 w-16 animate-pulse rounded bg-stone-100" />
      </div>
    ))}
  </div>
);

/** Buttons and fields shared by HQ and POS. */
export const btn = {
  primary: "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_1px_2px_rgba(225,20,20,0.3)] transition hover:brightness-110 active:brightness-95 disabled:opacity-50",
  dark: "inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50",
  secondary: "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-[0_1px_2px_rgba(16,16,20,0.04)] transition hover:border-ink/25 hover:bg-stone-50 disabled:opacity-50",
  ghost: "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink/70 transition hover:bg-stone-100 hover:text-ink",
  danger: "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50",
};
export const field = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-ink/35 focus:border-ink/40 focus:ring-4 focus:ring-ink/5";
export const label = "block text-[13px] font-semibold text-ink/80";

/** Table classes: sticky header, quiet dividers, right-aligned numbers. */
export const table = {
  wrap: "overflow-x-auto",
  table: "w-full text-left text-sm",
  thead: "sticky top-0 z-10 bg-stone-50/95 text-xs font-semibold text-ink/50 backdrop-blur",
  th: "px-5 py-3 font-semibold",
  tr: "border-t border-line transition hover:bg-stone-50/70",
  td: "px-5 py-3.5 align-middle",
  num: "px-5 py-3.5 text-right font-semibold tabular-nums",
};
