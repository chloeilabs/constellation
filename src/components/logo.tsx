import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Stock Analysis home"
      className={`flex shrink-0 items-center gap-2 font-bold tracking-tight text-header ${className}`}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <rect x="3" y="18" width="5" height="11" rx="1" fill="#22c55e" />
        <rect x="10" y="10" width="5" height="19" rx="1" fill="#16a34a" />
        <rect x="17" y="4" width="5" height="25" rx="1" fill="#15803d" />
        <rect x="24" y="13" width="5" height="16" rx="1" fill="#22c55e" />
      </svg>
      <span className="hidden text-[17px] leading-none min-[380px]:inline">
        Stock<span className="font-semibold text-brand">Analysis</span>
      </span>
    </Link>
  );
}
