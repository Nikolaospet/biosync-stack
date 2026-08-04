import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  right,
  children,
}: {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 glass px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{title}</h1>
        </div>
        {right}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  );
}
