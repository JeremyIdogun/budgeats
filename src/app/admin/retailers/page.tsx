import { getPricingReadinessReport, type RetailerReadinessSummary } from "@/lib/server/pricing-readiness";

type BadgeTone = "ready" | "degraded" | "blocked" | "neutral";

function badgeClass(tone: BadgeTone) {
  if (tone === "ready") return "bg-teal/15 text-teal";
  if (tone === "degraded") return "bg-coral/15 text-coral";
  if (tone === "blocked") return "bg-danger/15 text-danger";
  return "bg-cream-dark text-navy";
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: BadgeTone;
}) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${badgeClass(tone)}`}>
      {label}
    </span>
  );
}

function freshnessTone(status: RetailerReadinessSummary["pricingFreshness"]): BadgeTone {
  if (status === "fresh") return "ready";
  if (status === "aging") return "degraded";
  if (status === "stale") return "blocked";
  return "neutral";
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

export default async function RetailersPage() {
  const report = await getPricingReadinessReport();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading mb-2 text-2xl font-bold text-navy">Retailers</h1>
        <p className="font-body max-w-3xl text-sm text-navy-muted">
          Launch-readiness view for pricing and ingestion. This page shows whether
          Loavish is using live retailer data, how fresh it is, and whether the
          ingestion pipeline is currently durable enough for public use.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-5 shadow-card">
          <p className="font-body text-xs uppercase tracking-[0.12em] text-navy-muted">Overall</p>
          <div className="mt-2">
            <StatusBadge label={report.overall} tone={report.overall} />
          </div>
          <p className="mt-3 font-body text-sm text-navy-muted">
            Generated {formatDate(report.generatedAt)}.
          </p>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-card">
          <p className="font-body text-xs uppercase tracking-[0.12em] text-navy-muted">Pricing source</p>
          <div className="mt-2">
            <StatusBadge
              label={report.sourceMode === "live" ? "live database" : "seed fallback"}
              tone={report.sourceMode === "live" ? "ready" : "blocked"}
            />
          </div>
          <p className="mt-3 font-body text-sm text-navy-muted">
            {report.livePriceRetailerCount} retailers with live price rows.
          </p>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-card">
          <p className="font-body text-xs uppercase tracking-[0.12em] text-navy-muted">Connector mode</p>
          <div className="mt-2">
            <StatusBadge
              label={report.connectorMode === "apify" ? "apify live" : "fixture html"}
              tone={report.connectorMode === "apify" ? "ready" : "degraded"}
            />
          </div>
          <p className="mt-3 font-body text-sm text-navy-muted">
            Snapshot store: {report.snapshotStoreMode}.
          </p>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-card">
          <p className="font-body text-xs uppercase tracking-[0.12em] text-navy-muted">Seed catalog</p>
          <p className="mt-2 font-heading text-2xl font-bold text-navy">
            {report.seedPriceCount.toLocaleString()}
          </p>
          <p className="mt-3 font-body text-sm text-navy-muted">
            Last seed update {formatDate(report.seedCatalogLastUpdated)}.
          </p>
        </div>
      </div>

      {report.notes.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-card">
          <h2 className="font-heading text-lg font-bold text-navy">Current constraints</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 font-body text-sm text-navy-muted">
            {report.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {report.retailers.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow-card">
          <p className="font-body text-sm text-navy">
            No live retailer records are available yet. Until the database and
            ingestion pipeline are configured, Loavish is operating on bundled seed
            pricing only.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-card">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-cream-dark text-left text-sm font-semibold text-navy">
                <th className="px-4 py-3">Retailer</th>
                <th className="px-4 py-3">Readiness</th>
                <th className="px-4 py-3">Pricing</th>
                <th className="px-4 py-3">Ingestion</th>
                <th className="px-4 py-3 text-right">Products</th>
                <th className="px-4 py-3 text-right">Prices</th>
                <th className="px-4 py-3">Latest live price</th>
                <th className="px-4 py-3">Latest completed run</th>
              </tr>
            </thead>
            <tbody>
              {report.retailers.map((retailer) => (
                <tr key={retailer.id} className="transition-colors hover:bg-cream/60">
                  <td className="border-b border-cream-dark px-4 py-3 align-top">
                    <div className="font-body text-sm font-medium text-navy">{retailer.name}</div>
                    <div className="font-body text-xs text-navy-muted">{retailer.slug}</div>
                  </td>
                  <td className="border-b border-cream-dark px-4 py-3 align-top">
                    <StatusBadge label={retailer.readiness} tone={retailer.readiness} />
                  </td>
                  <td className="border-b border-cream-dark px-4 py-3 align-top">
                    <StatusBadge
                      label={retailer.pricingFreshness}
                      tone={freshnessTone(retailer.pricingFreshness)}
                    />
                  </td>
                  <td className="border-b border-cream-dark px-4 py-3 align-top">
                    <StatusBadge
                      label={retailer.ingestionFreshness}
                      tone={freshnessTone(retailer.ingestionFreshness)}
                    />
                    {retailer.latestRunStatus && (
                      <p className="mt-2 font-body text-xs text-navy-muted">
                        Last run: {retailer.latestRunStatus}
                      </p>
                    )}
                  </td>
                  <td className="border-b border-cream-dark px-4 py-3 text-right align-top font-body text-sm text-navy">
                    {retailer.productCount.toLocaleString()}
                  </td>
                  <td className="border-b border-cream-dark px-4 py-3 text-right align-top font-body text-sm text-navy">
                    {retailer.priceCount.toLocaleString()}
                  </td>
                  <td className="border-b border-cream-dark px-4 py-3 align-top font-body text-sm text-navy-muted">
                    {formatDate(retailer.latestPriceObservedAt)}
                  </td>
                  <td className="border-b border-cream-dark px-4 py-3 align-top font-body text-sm text-navy-muted">
                    {formatDate(retailer.latestSuccessfulRunAt)}
                    {Boolean(retailer.latestRunErrors) && (
                      <p className="mt-2 max-w-xs truncate text-xs text-danger">
                        {JSON.stringify(retailer.latestRunErrors)}
                      </p>
                    )}
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
