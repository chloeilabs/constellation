import Link from "next/link";
import { holdingQuoteHref } from "@/lib/listings";

export function HoldingTicker({
  asset,
  name,
  stackedName = false,
}: {
  asset?: string | null;
  name?: string | null;
  stackedName?: boolean;
}) {
  const href = holdingQuoteHref(asset, name);
  const ticker = asset?.trim() && asset.trim() !== "-" ? asset.trim() : "";
  return (
    <>
      {href ? (
        <Link href={href} className="text-link hover:underline">
          {ticker}
        </Link>
      ) : ticker ? (
        ticker
      ) : stackedName ? null : (
        "—"
      )}
      {stackedName && name ? (
        <span className="mt-0.5 block max-w-[280px] truncate text-xs text-muted">{name}</span>
      ) : null}
      {stackedName && !ticker && !name ? "—" : null}
    </>
  );
}
