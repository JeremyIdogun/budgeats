"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { NavBudgetPill } from "@/components/navigation/NavBudgetPill";
import { createClient } from "@/lib/supabase/client";
import {
  clearPlannerSessionCache,
  flushPlannerStateToServer,
} from "@/lib/planner-persistence";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/planner", label: "Meal Planner" },
  { href: "/shopping", label: "Shopping List" },
  { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" },
  { href: "/rewards", label: "Rewards" },
  { href: "/admin", label: "Admin" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await flushPlannerStateToServer();
    clearPlannerSessionCache();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="mb-6">
      <div className="flex items-center justify-between gap-3">
        <BrandLogo href="/dashboard" variant="wordmark" />
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <NavBudgetPill />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-navy-muted transition-colors hover:text-navy"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="mt-3 sm:hidden">
        <NavBudgetPill />
      </div>

      <div className="mt-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <nav className="flex min-w-max flex-nowrap items-center gap-6">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap pb-3 text-sm transition-colors duration-150 ${
                  isActive
                    ? "font-medium text-navy"
                    : "font-normal text-navy-muted hover:text-navy"
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
