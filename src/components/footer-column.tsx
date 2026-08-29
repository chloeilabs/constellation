"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly (readonly [string, string])[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border lg:border-none">
      <h3 className="mb-3 hidden text-sm font-semibold text-header lg:block">{title}</h3>
      <button
        type="button"
        className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold text-header lg:hidden"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      <ul className={cn("flex-col gap-2 pb-3 text-sm text-muted lg:flex lg:pb-0", open ? "flex" : "hidden")}>
        {links.map(([href, label]) => (
          <li key={`${href}-${label}`}>
            <Link href={href} className="hover:text-link">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
