import { getRetailerContextSummary } from "@/lib/server/admin-metrics";

interface RetailerContext {
  user_id: string;
  retailer_id: string;
  postcode: string | null;
  updated_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RetailersPage() {
  const summary = await getRetailerContextSummary();
  const contexts = (summary.rows ?? []) as RetailerContext[];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy mb-6">Retailers</h1>

      {contexts.length === 0 ? (
        <p className="font-body text-sm text-navy-muted">No retailer contexts found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-card">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-cream-dark text-navy text-sm font-semibold">
                <th className="py-3 px-4 text-left">Retailer ID</th>
                <th className="py-3 px-4 text-left">Postcode</th>
                <th className="py-3 px-4 text-left">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {contexts.map((ctx) => (
                <tr key={ctx.retailer_id} className="hover:bg-cream/60 transition-colors">
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body font-medium text-navy">
                    {ctx.retailer_id}
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body text-navy-muted">
                    {ctx.postcode ?? "—"}
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body text-navy-muted">
                    {formatDate(ctx.updated_at)}
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
