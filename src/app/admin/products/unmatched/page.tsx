import Link from "next/link";
import { listUnmatchedProducts } from "@/lib/product-match-review";

interface UnmatchedProduct {
  retailerProductId: string;
  name: string;
  retailerId: string;
  suggestedCanonicalId: string | null;
  matchScore: number;
}

export default async function UnmatchedPage() {
  const products: UnmatchedProduct[] = (listUnmatchedProducts() ?? []).map((item) => ({
    retailerProductId: item.retailerProductId,
    name: item.retailerProductName,
    retailerId: item.retailerId,
    suggestedCanonicalId: item.suggestedCanonical[0]?.ingredientId ?? null,
    matchScore: item.matchScore,
  }));

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy mb-6">Unmatched Products</h1>

      {products.length === 0 ? (
        <div className="rounded-lg bg-white shadow-card p-8 text-center">
          <p className="font-body text-sm text-navy-muted">No unmatched products — all products have been reviewed.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-card">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-cream-dark text-navy text-sm font-semibold">
                <th className="py-3 px-4 text-left">Product Name</th>
                <th className="py-3 px-4 text-left">Retailer</th>
                <th className="py-3 px-4 text-right">Match Score</th>
                <th className="py-3 px-4 text-left">Suggested Match</th>
                <th className="py-3 px-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.retailerProductId} className="hover:bg-cream/60 transition-colors">
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body font-medium text-navy">
                    {product.name}
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body text-navy-muted">
                    {product.retailerId}
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body text-navy text-right">
                    {Math.round(product.matchScore * 100)}%
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body text-navy-muted">
                    {product.suggestedCanonicalId ?? "—"}
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body">
                    <Link
                      href="/admin/products/review"
                      className="text-teal font-semibold hover:underline"
                    >
                      Review
                    </Link>
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
