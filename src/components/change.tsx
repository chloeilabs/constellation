import { changeClass, formatPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ChangeValue({
  change,
  percent,
  alreadyPercent = true,
  className,
}: {
  change?: number | null;
  percent?: number | null;
  alreadyPercent?: boolean;
  className?: string;
}) {
  const value = percent ?? change ?? 0;
  return (
    <span className={cn("tabular font-medium", changeClass(value), className)}>
      {change != null ? `${change > 0 ? "+" : ""}${formatPrice(change)} ` : null}
      {percent != null ? (
        <span>
          {change != null ? "(" : null}
          {formatPercent(percent, { alreadyPercent })}
          {change != null ? ")" : null}
        </span>
      ) : null}
    </span>
  );
}

export function ChangePercent({
  value,
  alreadyPercent = true,
  className,
}: {
  value: number | null | undefined;
  alreadyPercent?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("tabular font-medium", changeClass(value), className)}>
      {formatPercent(value, { alreadyPercent })}
    </span>
  );
}
