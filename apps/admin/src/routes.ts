export interface AdminRouteDefinition {
  path:
    | "/runs"
    | "/products/unmatched"
    | "/products/review"
    | "/ingredients"
    | "/meals/cost-coverage"
    | "/retailers/context";
  description: string;
}

export const adminRoutes: AdminRouteDefinition[] = [
  { path: "/runs", description: "Ingestion run history with status and errors." },
  { path: "/products/unmatched", description: "Unmatched products with canonical suggestions." },
  { path: "/products/review", description: "Review queue for pending product matches." },
  { path: "/ingredients", description: "Canonical ingredient stats and coverage." },
  { path: "/meals/cost-coverage", description: "Meals with >=85% ingredient cost coverage." },
  { path: "/retailers/context", description: "Current retailer context snapshots." },
];
