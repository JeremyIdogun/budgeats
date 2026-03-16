import { runPriceAlertsCheck } from "../../../src/lib/server/price-alerts";
import { logEvent } from "./logger";

export async function runPriceAlertSweep() {
  const startedAt = Date.now();
  const result = await runPriceAlertsCheck();
  const durationMs = Date.now() - startedAt;

  logEvent({
    event: "price_alerts.sweep.completed",
    duration_ms: durationMs,
    checked: result.checked,
    triggered: result.triggered,
  });

  return result;
}
