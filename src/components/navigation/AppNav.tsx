"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { NavBudgetPill } from "@/components/navigation/NavBudgetPill";
import { launchFlags } from "@/lib/launch-flags";
import { createClient } from "@/lib/supabase/client";
import {
  clearPlannerSessionCache,
  flushPlannerStateToServer,
} from "@/lib/planner-persistence";
import { useBudgeAtsStore } from "@/store";
import { useDecisionStore } from "@/store/decisions";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/planner", label: "Meal Planner" },
  { href: "/shopping", label: "Shopping List" },
  { href: "/pantry", label: "Pantry" },
  { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" },
  ...(launchFlags.rewards ? [{ href: "/rewards", label: "Rewards" }] : []),
  { href: "/admin", label: "Admin" },
];

interface AppNavProps {
  isAdmin?: boolean;
}

export function AppNav({ isAdmin }: AppNavProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [resolvedIsAdmin, setResolvedIsAdmin] = useState<boolean>(Boolean(isAdmin));
  const explicitIsAdmin = typeof isAdmin === "boolean" ? isAdmin : null;
  const adminEmails = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    [],
  );

  const showAdminLinks = explicitIsAdmin ?? resolvedIsAdmin;

  const visibleLinks = showAdminLinks
    ? NAV_LINKS
    : NAV_LINKS.filter((link) => link.href !== "/admin");

  useEffect(() => {
    if (explicitIsAdmin !== null) {
      return;
    }

    let cancelled = false;
    async function resolveAdminState() {
      if (adminEmails.length === 0) {
        if (!cancelled) setResolvedIsAdmin(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const email = (user?.email ?? "").trim().toLowerCase();
      if (!cancelled) setResolvedIsAdmin(adminEmails.includes(email));
    }

    void resolveAdminState();
    return () => {
      cancelled = true;
    };
  }, [explicitIsAdmin, adminEmails]);

  async function handleLogout() {
    await flushPlannerStateToServer();
    clearPlannerSessionCache();
    useBudgeAtsStore.getState().clearUserSession();
    useDecisionStore.getState().setActiveUser(null);
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
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap border-b-2 pb-3 text-sm transition-colors duration-150 ${
                  isActive
                    ? "border-teal font-medium text-navy"
                    : "border-transparent font-normal text-navy-muted hover:text-navy"
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
