import Link from "next/link";

export function QuoteHeaderStats({
  items,
}: {
  items: { label: string; value: string; href?: string }[];
}) {
  const visible = items.filter((item) => item.value && item.value !== "—");
  if (visible.length === 0) return null;
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
      {visible.map((item) => (
        <div key={item.label}>
          <dt className="text-muted">{item.label}</dt>
          <dd className="font-medium tabular text-header">
            {item.href ? (
              <Link href={item.href} className="hover:text-link hover:underline">
                {item.value}
              </Link>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
