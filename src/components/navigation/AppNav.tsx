"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { NavBudgetPill } from "@/components/navigation/NavBudgetPill";

const NAV_LINKS = [
  { href: "/planner", label: "Meal Planner" },
  { href: "/shopping", label: "Shopping List" },
  { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-6">
        <BrandLogo href="/dashboard" />

        <nav className="flex flex-wrap items-center gap-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-navy text-white"
                    : "text-navy-muted hover:bg-white hover:text-navy"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <NavBudgetPill />
    </header>
  );
}
