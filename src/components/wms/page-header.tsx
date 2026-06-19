import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border bg-background px-7 pb-4 pt-5">
      <div>
        <h1 className="text-[22px] font-medium tracking-[-0.01em] text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
