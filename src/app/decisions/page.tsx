"use client";

import { AppNav } from "@/components/navigation/AppNav";
import { useDecisionStore } from "@/store/decisions";
import { formatPence } from "@/utils/currency";

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }) + " · " + date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function DecisionsPage() {
  const entries = useDecisionStore((s) => s.entries);

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-3xl">
        <AppNav />

        <section className="mb-4">
          <h1 className="text-2xl font-semibold text-navy md:text-3xl">Decision History</h1>
          <p className="text-sm text-navy-muted">Your Logismos recommendations over time.</p>
        </section>

        {entries.length === 0 ? (
          <section className="rounded-2xl border border-cream-dark bg-white p-8 text-center">
            <p className="text-lg font-semibold text-navy">No decisions yet.</p>
            <p className="mt-2 text-sm text-navy-muted">
              Accept or dismiss a Logismos recommendation on the dashboard to start your history.
            </p>
          </section>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.decision_id}
                className="rounded-2xl border border-cream-dark bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-navy-muted">{formatTimestamp(entry.timestamp)}</p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          entry.recommendation_type === "cook"
                            ? "bg-teal/10 text-teal"
                            : "bg-coral/10 text-coral"
                        }`}
                      >
                        {entry.recommendation_type === "cook" ? "Cook" : "Eat out"}
                      </span>
                      <span className="text-sm font-semibold text-navy">
                        {formatPence(entry.estimated_cost_pence)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-lg">
                      {entry.recommendation_accepted ? "✅" : "✗"}
                    </span>
                    {entry.recommendation_accepted && entry.points_awarded > 0 && (
                      <span className="text-xs font-semibold text-teal">
                        +{entry.points_awarded} pts
                      </span>
                    )}
                    {!entry.recommendation_accepted && (
                      <span className="text-xs text-navy-muted">—</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
