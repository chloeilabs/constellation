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

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
      <h2 className="font-semibold text-header">{title}</h2>
      <p className="mt-1 text-sm text-muted">{message}</p>
    </div>
  );
}
