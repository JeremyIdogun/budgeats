import posthog from "posthog-js";

let initialized = false;

function hasAnalyticsKey(): boolean {
  return typeof window !== "undefined" && Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function initAnalytics() {
  if (typeof window === "undefined" || initialized || !hasAnalyticsKey()) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    capture_pageview: true,
    persistence: "localStorage",
  });
  initialized = true;
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined" || !hasAnalyticsKey()) return;
  if (!initialized) initAnalytics();
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined" || !hasAnalyticsKey()) return;
  if (!initialized) initAnalytics();
  posthog.identify(userId, traits);
}
