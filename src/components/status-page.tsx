import type { ReactNode } from "react";
import Link from "next/link";
import { SearchBox } from "@/components/search-box";

export function StatusPage({
  kicker,
  title,
  message,
  showSearch = false,
  children,
}: {
  kicker?: string;
  title: string;
  message: string;
  showSearch?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      {kicker ? <p className="text-sm font-semibold text-brand">{kicker}</p> : null}
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-header text-balance">{title}</h1>
      <p className="mt-3 text-muted text-pretty">{message}</p>
      {showSearch ? (
        <div className="mx-auto mt-8 max-w-md text-left">
          <SearchBox large placeholder="Search a ticker or company" />
        </div>
      ) : null}
      {children ? <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div> : null}
    </div>
  );
}

export function StatusLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="sa-btn sa-btn-secondary">
      {children}
    </Link>
  );
}
