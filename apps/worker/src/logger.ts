export interface StructuredLog {
  event: string;
  retailer_id?: string;
  run_id?: string;
  duration_ms?: number;
  error?: string;
  [key: string]: unknown;
}

export function logEvent(input: StructuredLog): void {
  // JSON logs are parse-friendly for ingestion/observability tools.
  console.log(JSON.stringify(input));
}
