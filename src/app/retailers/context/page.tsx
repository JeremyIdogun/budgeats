"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/navigation/AppNav";

interface RetailerContextSummary {
  total: number;
  byRetailer: Record<string, number>;
  rows: Array<{
    user_id: string;
    retailer_id: string;
    postcode: string | null;
    context_json: unknown;
    updated_at: string;
  }>;
}

export default function RetailerContextPage() {
  const [summary, setSummary] = useState<RetailerContextSummary | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/retailers/context", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { data?: RetailerContextSummary };
      setSummary(payload.data ?? null);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-5xl">
        <AppNav />
        <h1 className="mb-4 text-2xl font-semibold text-navy md:text-3xl">Retailer Context</h1>
        <section className="rounded-lg border border-cream-dark bg-white p-4 text-sm">
          {!summary ? (
            <p className="text-navy-muted">Loading retailer context...</p>
          ) : (
            <div className="space-y-3">
              <p className="text-navy">Total context rows: <span className="font-semibold">{summary.total}</span></p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.byRetailer).map(([retailer, count]) => (
                  <span key={retailer} className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-navy">
                    {retailer}: {count}
                  </span>
                ))}
              </div>
              <div className="space-y-2">
                {summary.rows.map((row) => (
                  <article key={`${row.user_id}-${row.retailer_id}`} className="rounded-lg border border-cream-dark p-2">
                    <p className="font-semibold text-navy">{row.retailer_id}</p>
                    <p className="text-xs text-navy-muted">postcode: {row.postcode ?? "n/a"}</p>
                    <p className="text-xs text-navy-muted">{new Date(row.updated_at).toLocaleString("en-GB")}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
