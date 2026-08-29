export function DownloadCsvLink({ href, children = "Download CSV" }: { href: string; children?: React.ReactNode }) {
  return (
    <a
      href={href}
      className="shrink-0 rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
    >
      {children}
    </a>
  );
}
