const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

interface Run {
  id: string;
  retailer_id: string;
  started_at: string;
  completed_at: string | null;
  status: "completed" | "failed" | "running" | "queued";
  products_scraped: number;
  errors_json: unknown;
}

function StatusBadge({ status }: { status: Run["status"] }) {
  const styles: Record<Run["status"], string> = {
    completed: "bg-teal/15 text-teal",
    failed: "bg-danger/15 text-danger",
    running: "bg-coral/15 text-coral",
    queued: "bg-navy-muted/15 text-navy-muted",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status] ?? "bg-cream-dark text-navy"}`}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RunsPage() {
  const res = await fetch(`${BASE_URL}/api/admin/runs`, { cache: "no-store" });
  const data = await res.json();
  const runs: Run[] = data.runs ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-navy">Ingestion Runs</h1>
        <button
          disabled
          className="rounded-md bg-navy-muted/30 px-4 py-2 text-sm font-semibold text-navy-muted cursor-not-allowed"
        >
          Trigger Run — coming soon
        </button>
      </div>

      {runs.length === 0 ? (
        <p className="font-body text-sm text-navy-muted">No runs found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-card">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-cream-dark text-navy text-sm font-semibold">
                <th className="py-3 px-4 text-left">Retailer</th>
                <th className="py-3 px-4 text-left">Started</th>
                <th className="py-3 px-4 text-left">Completed</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-right">Products Scraped</th>
                <th className="py-3 px-4 text-left">Errors</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-cream/60 transition-colors">
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body font-medium text-navy">
                    {run.retailer_id}
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body text-navy-muted">
                    {formatDate(run.started_at)}
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body text-navy-muted">
                    {formatDate(run.completed_at)}
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body text-navy text-right">
                    {run.products_scraped.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body text-navy-muted max-w-xs truncate">
                    {run.errors_json ? JSON.stringify(run.errors_json) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
