"use client";

import { toCsv } from "@/lib/csv";

export function DownloadCsvButton({
  filename,
  headers,
  rows,
}: {
  filename: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
}) {
  function onClick() {
    const csv = toCsv(headers, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium hover:bg-muted-bg"
    >
      Download CSV
    </button>
  );
}
