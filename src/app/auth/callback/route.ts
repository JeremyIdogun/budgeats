import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function sanitizeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/")) return "/dashboard";
  return next;
}

function redirectWithCookies(
  source: NextResponse,
  destination: URL,
): NextResponse {
  const target = NextResponse.redirect(destination);
  source.cookies.getAll().forEach(({ name, value }) => {
    target.cookies.set(name, value);
  });
  return target;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));
  let response = NextResponse.redirect(new URL(nextPath, requestUrl.origin));

  if (!code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    response = redirectWithCookies(
      response,
      new URL("/login?error=oauth_callback", requestUrl.origin),
    );
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileError && !profile) {
      response = redirectWithCookies(
        response,
        new URL("/onboarding", requestUrl.origin),
      );
    }
  }

  return response;
}
