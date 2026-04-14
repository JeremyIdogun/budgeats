import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function configuredAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return configuredAdminEmails().includes(normalized);
}

async function currentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuthenticatedPage(nextPath: string): Promise<User> {
  const user = await currentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function requireAdminPage(nextPath = "/admin"): Promise<User> {
  const user = await requireAuthenticatedPage(nextPath);
  if (!isAdminEmail(user.email)) {
    redirect("/dashboard");
  }
  return user;
}

type ApiGuardResult =
  | { user: User; response?: never }
  | { user?: never; response: NextResponse<{ error: string }> };

export async function requireAuthenticatedApiUser(): Promise<ApiGuardResult> {
  const user = await currentUser();
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }

  return { user };
}

export async function requireAdminApiUser(): Promise<ApiGuardResult> {
  const auth = await requireAuthenticatedApiUser();
  if ("response" in auth) return auth;

  if (!isAdminEmail(auth.user.email)) {
    return {
      response: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      ),
    };
  }

  return auth;
}
