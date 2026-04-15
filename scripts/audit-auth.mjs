#!/usr/bin/env node
/**
 * Auth coverage audit for Next.js API routes.
 *
 * Walks src/app/api/** /route.ts, classifies each route by the auth guard used:
 *   - "admin"  — requireAdminApiUser / handle({ auth: "admin" })
 *   - "user"   — requireAuthenticatedApiUser / handle({ auth: "user" })
 *   - "public" — handle({ auth: "public" }) or explicit allowlist below
 *   - "unprotected" — none of the above (flagged)
 *
 * Exits non-zero if any route is "unprotected" and not on the allowlist.
 * Intended to run in CI as a pre-merge gate.
 *
 * Usage:
 *   node scripts/audit-auth.mjs
 *   node scripts/audit-auth.mjs --json       # machine-readable
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = process.cwd();
const API_ROOT = join(REPO_ROOT, "src/app/api");

/**
 * Routes that are intentionally public. Add entries with a short reason.
 * Keep this list small — prefer gating with `handle({ auth: "public" })`
 * in the route itself, which is auto-detected below.
 */
const PUBLIC_ALLOWLIST = new Set([
  "src/app/api/health/route.ts",
  "src/app/api/waitlist/route.ts",
]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...walk(path));
    else if (entry === "route.ts" || entry === "route.tsx") out.push(path);
  }
  return out;
}

function classify(source) {
  if (/\bhandle\s*\(\s*\{[^}]*auth\s*:\s*"admin"/s.test(source)) return "admin";
  if (/requireAdminApiUser\s*\(/.test(source)) return "admin";
  if (/\bhandle\s*\(\s*\{[^}]*auth\s*:\s*"user"/s.test(source)) return "user";
  if (/requireAuthenticatedApiUser\s*\(/.test(source)) return "user";
  if (/\bhandle\s*\(\s*\{[^}]*auth\s*:\s*"public"/s.test(source)) return "public";
  return "unprotected";
}

function main() {
  const files = walk(API_ROOT).sort();
  const rows = files.map((absPath) => {
    const rel = relative(REPO_ROOT, absPath);
    const source = readFileSync(absPath, "utf8");
    let kind = classify(source);
    if (kind === "unprotected" && PUBLIC_ALLOWLIST.has(rel)) {
      kind = "public (allowlisted)";
    }
    return { route: rel, auth: kind };
  });

  const failures = rows.filter((r) => r.auth === "unprotected");
  const jsonMode = process.argv.includes("--json");

  if (jsonMode) {
    console.log(JSON.stringify({ rows, failures }, null, 2));
  } else {
    const widest = Math.max(...rows.map((r) => r.route.length));
    for (const { route, auth } of rows) {
      const pad = " ".repeat(widest - route.length + 2);
      const tag =
        auth === "unprotected" ? `\x1b[31m${auth}\x1b[0m`
        : auth === "admin" ? `\x1b[35m${auth}\x1b[0m`
        : auth === "user" ? `\x1b[32m${auth}\x1b[0m`
        : `\x1b[90m${auth}\x1b[0m`;
      console.log(`  ${route}${pad}${tag}`);
    }
    console.log("");
    console.log(`  total:       ${rows.length}`);
    console.log(`  admin:       ${rows.filter((r) => r.auth === "admin").length}`);
    console.log(`  user:        ${rows.filter((r) => r.auth === "user").length}`);
    console.log(`  public:      ${rows.filter((r) => r.auth.startsWith("public")).length}`);
    console.log(`  unprotected: ${failures.length}`);
  }

  if (failures.length > 0) {
    if (!jsonMode) {
      console.error("\n✖ Unprotected routes detected. Add auth or allowlist with a reason.");
    }
    process.exit(1);
  }
}

main();
