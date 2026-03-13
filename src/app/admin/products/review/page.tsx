"use client";

import { useEffect, useState } from "react";

interface ReviewProduct {
  retailerProductId: string;
  name: string;
  retailerId: string;
  matchScore: number;
  suggestedCanonicalId: string | null;
}

export default function ReviewQueuePage() {
  const [products, setProducts] = useState<ReviewProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/v1/products/review")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function decide(retailerProductId: string, decision: "approved" | "rejected") {
    setProcessing((p) => ({ ...p, [retailerProductId]: true }));
    try {
      const res = await fetch("/api/v1/products/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retailerProductId, decision }),
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.retailerProductId !== retailerProductId));
      }
    } finally {
      setProcessing((p) => ({ ...p, [retailerProductId]: false }));
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy mb-6">Review Queue</h1>

      {loading ? (
        <p className="font-body text-sm text-navy-muted">Loading...</p>
      ) : products.length === 0 ? (
        <div className="rounded-lg bg-white shadow-card p-8 text-center">
          <p className="font-body text-sm text-navy-muted">Review queue is empty — nothing to action.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => {
            const busy = processing[product.retailerProductId] ?? false;
            return (
              <div
                key={product.retailerProductId}
                className="bg-white rounded-lg shadow-card px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-navy text-sm truncate">{product.name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-navy-muted font-body">
                    <span>Retailer: <span className="font-medium text-navy">{product.retailerId}</span></span>
                    <span>Match: <span className="font-medium text-navy">{Math.round(product.matchScore * 100)}%</span></span>
                    <span>
                      Suggested:{" "}
                      <span className="font-medium text-navy">
                        {product.suggestedCanonicalId ?? "—"}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    disabled={busy}
                    onClick={() => decide(product.retailerProductId, "approved")}
                    className="rounded-md bg-teal px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => decide(product.retailerProductId, "rejected")}
                    className="rounded-md border border-danger px-4 py-1.5 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
