import type { ReactNode } from "react";

export function DownloadCsvLink({ href, children = "Download CSV" }: { href: string; children?: ReactNode }) {
  return (
    <a
      href={href}
      className="sa-btn sa-btn-secondary shrink-0"
    >
      {children}
    </a>
  );
}
