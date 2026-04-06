export default function RetailersPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy mb-6">Retailers</h1>
      <div className="max-w-2xl rounded-lg bg-white p-6 shadow-card">
        <p className="font-body text-sm text-navy">
          Retailer context persistence is temporarily disabled until it is backed by durable storage.
        </p>
        <p className="mt-2 font-body text-sm text-navy-muted">
          This avoids showing misleading admin data from in-memory state that would be lost between requests or deploys.
        </p>
      </div>
    </div>
  );
}
