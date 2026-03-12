import { assertNotBlocked, persistSnapshot, requiredSnapshotBucket, withExponentialBackoff } from "../runtime";
import type { RetailerContext } from "../types";
import type { SnapshotStore } from "../runtime";

interface PlaywrightModule {
  chromium: {
    launch: (input?: { headless?: boolean }) => Promise<{
      newContext: (input?: {
        userAgent?: string;
        locale?: string;
        extraHTTPHeaders?: Record<string, string>;
      }) => Promise<{
        addCookies: (cookies: Array<{ name: string; value: string; domain: string; path: string }>) => Promise<void>;
        newPage: () => Promise<{
          goto: (
            url: string,
            input?: { waitUntil?: "domcontentloaded" | "load"; timeout?: number },
          ) => Promise<{ status: () => number | null } | null>;
          content: () => Promise<string>;
          close: () => Promise<void>;
        }>;
        close: () => Promise<void>;
      }>;
      close: () => Promise<void>;
    }>;
  };
}

export async function scrapeWithPlaywright(input: {
  retailerId: string;
  url: string;
  context: RetailerContext;
  snapshotStore: SnapshotStore;
  resourceKey: string;
}): Promise<string> {
  requiredSnapshotBucket();
  const playwright = (await import("playwright")) as PlaywrightModule;

  return withExponentialBackoff(
    async () => {
      const browser = await playwright.chromium.launch({ headless: true });
      const browserContext = await browser.newContext({
        locale: input.context.locale,
        extraHTTPHeaders: input.context.headers,
      });

      try {
        const cookies = Object.entries(input.context.cookies ?? {}).map(([name, value]) => ({
          name,
          value,
          domain: ".groceries.example.com",
          path: "/",
        }));

        if (cookies.length > 0) {
          await browserContext.addCookies(cookies);
        }

        const page = await browserContext.newPage();
        try {
          const response = await page.goto(input.url, { waitUntil: "domcontentloaded", timeout: 45_000 });
          const body = await page.content();
          const status = response?.status() ?? 200;
          assertNotBlocked(input.retailerId, { status, body });

          await persistSnapshot({
            retailerId: input.retailerId,
            resource: input.resourceKey,
            body,
            contentType: "text/html",
            store: input.snapshotStore,
          });

          return body;
        } finally {
          await page.close();
        }
      } finally {
        await browserContext.close();
        await browser.close();
      }
    },
    {
      attempts: 3,
      baseDelayMs: 1000,
    },
  );
}
