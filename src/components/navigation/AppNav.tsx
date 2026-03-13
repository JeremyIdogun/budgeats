"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { NavBudgetPill } from "@/components/navigation/NavBudgetPill";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: null },
  { href: "/planner", label: "Meal Planner", icon: null },
  { href: "/shopping", label: "Shopping List", icon: null },
  { href: "/insights", label: "Insights", icon: null },
  { href: "/settings", label: "Settings", icon: null },
  { href: "/rewards", label: "Rewards", icon: "⭐" },
  { href: "/admin", label: "Admin", icon: null },
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
                {link.icon ? (
                  <>
                    <span className="sm:hidden">{link.icon}</span>
                    <span className="hidden sm:inline">{link.icon} {link.label}</span>
                  </>
                ) : (
                  link.label
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
