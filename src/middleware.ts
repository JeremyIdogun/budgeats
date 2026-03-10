import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COMING_SOON = process.env.NEXT_PUBLIC_COMING_SOON === "true";

// Routes allowed through in coming-soon mode
const ALLOWED_PREFIXES = ["/_next", "/api", "/favicon", "/robots", "/sitemap"];
const STATIC_FILE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".css",
  ".js",
  ".map",
  ".txt",
  ".xml",
  ".json",
];

export function middleware(request: NextRequest) {
  if (!COMING_SOON) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Allow root and static/system paths
  if (
    pathname === "/" ||
    STATIC_FILE_EXTENSIONS.some((extension) => pathname.endsWith(extension)) ||
    ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  // Redirect everything else (app routes) to the coming soon page
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static files.
     * This is the standard Next.js middleware matcher pattern.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
