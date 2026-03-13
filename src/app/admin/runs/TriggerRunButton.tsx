"use client";

import { useState } from "react";

type RetailerSlug = "tesco" | "asda" | "sainsburys";

interface TriggerResponse {
  data?: {
    status?: string;
    productsScraped?: number;
    errors?: string[];
  };
  explanation?: string;
  error?: string;
}

export function TriggerRunButton() {
  const [retailerSlug, setRetailerSlug] = useState<RetailerSlug>("tesco");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function triggerRun() {
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);
    try {
      const response = await fetch("/api/admin/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ retailerSlug }),
      });
      const payload = (await response.json()) as TriggerResponse;

      if (!response.ok) {
        setIsError(true);
        setMessage(payload.error ?? "Failed to trigger run");
        return;
      }

      const productsScraped = payload.data?.productsScraped ?? 0;
      const status = payload.data?.status ?? "queued";
      setMessage(`${retailerSlug} run ${status}. Scraped ${productsScraped} products.`);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Failed to trigger run");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={retailerSlug}
        onChange={(event) => setRetailerSlug(event.target.value as RetailerSlug)}
        className="rounded-md border border-cream-dark bg-white px-2.5 py-2 text-xs font-medium text-navy"
      >
        <option value="tesco">Tesco</option>
        <option value="asda">Asda</option>
        <option value="sainsburys">Sainsbury&apos;s</option>
      </select>
      <button
        disabled={isSubmitting}
        onClick={() => void triggerRun()}
        className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#172744] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Triggering..." : "Trigger Run"}
      </button>
      {message && (
        <span className={`text-xs ${isError ? "text-danger" : "text-teal"}`}>
          {message}
        </span>
      )}
    </div>
  );
}
