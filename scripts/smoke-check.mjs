const baseUrl = (process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const checks = [
  { path: "/", expectedStatuses: [200] },
  { path: "/login", expectedStatuses: [200] },
  { path: "/signup", expectedStatuses: [200] },
  { path: "/privacy", expectedStatuses: [200] },
  { path: "/terms", expectedStatuses: [200] },
  { path: "/support", expectedStatuses: [200] },
  { path: "/api/health", expectedStatuses: [200, 503], isHealth: true },
];

async function run() {
  console.log(`Smoke checking ${baseUrl}`);
  let failed = false;

  for (const check of checks) {
    const response = await fetch(`${baseUrl}${check.path}`, {
      redirect: "manual",
      headers: {
        "user-agent": "loavish-smoke-check/1.0",
      },
    });

    const ok = check.expectedStatuses.includes(response.status);
    if (!ok) {
      failed = true;
      console.error(`FAIL ${check.path} -> ${response.status}`);
      continue;
    }

    if (check.isHealth) {
      const payload = await response.json().catch(() => null);
      const overall = payload?.overall ?? "unknown";
      console.log(`OK   ${check.path} -> ${response.status} (${overall})`);
      if (overall === "blocked") {
        failed = true;
        console.error("Health endpoint reported blocked launch readiness.");
      }
      continue;
    }

    console.log(`OK   ${check.path} -> ${response.status}`);
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }

  console.log("Smoke check passed.");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
