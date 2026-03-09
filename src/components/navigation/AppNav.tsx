"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { NavBudgetPill } from "@/components/navigation/NavBudgetPill";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/planner", label: "Meal Planner" },
  { href: "/shopping", label: "Shopping List" },
  { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="mb-6">
      <div className="flex items-center justify-between gap-3">
        <BrandLogo href="/dashboard" />
        <div className="hidden sm:block">
          <NavBudgetPill />
        </div>
      </div>

      <div className="mt-3 sm:hidden">
        <NavBudgetPill />
      </div>

      <div className="mt-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <nav className="flex min-w-max flex-nowrap items-center gap-6 border-b border-cream-dark">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative whitespace-nowrap pb-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-navy after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-teal"
                    : "text-navy-muted hover:text-navy"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
