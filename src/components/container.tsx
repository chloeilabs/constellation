import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto max-w-7xl px-4 py-6 ${className}`}>{children}</div>;
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-muted-bg/40 px-4 py-12 text-center">
      <h2 className="font-semibold text-header">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted text-pretty">{message}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
