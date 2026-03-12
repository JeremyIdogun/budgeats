"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/navigation/AppNav";

interface IngestionRunRow {
  id: string;
  retailer_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  products_scraped: number;
  errors_json: unknown;
}

export default function RunsPage() {
  const [rows, setRows] = useState<IngestionRunRow[]>([]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/runs", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { data?: IngestionRunRow[] };
      setRows(payload.data ?? []);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-5xl">
        <AppNav />
        <h1 className="mb-4 text-2xl font-semibold text-navy md:text-3xl">Ingestion Runs</h1>
        <div className="space-y-2">
          {rows.map((row) => (
            <article key={row.id} className="rounded-xl border border-cream-dark bg-white p-3 text-sm">
              <p className="font-semibold text-navy">{row.retailer_id}</p>
              <p className="text-xs text-navy-muted">{new Date(row.started_at).toLocaleString("en-GB")}</p>
              <p className="text-xs text-navy-muted">{row.status} · {row.products_scraped} products</p>
            </article>
          ))}
          {rows.length === 0 && (
            <p className="rounded-xl border border-cream-dark bg-white p-3 text-sm text-navy-muted">
              No ingestion runs available.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
