import { listDecisionLog } from "@/lib/logismos-ledger";
import { handle, jsonOk, parseSearchParams, z } from "@/lib/server/api";

const querySchema = z.object({
  accepted: z.enum(["accepted", "dismissed", "true", "false", ""]).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

function parseAcceptedFilter(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  if (value === "accepted" || value === "true") return true;
  if (value === "dismissed" || value === "false") return false;
  return undefined;
}

export const GET = handle({ event: "api.decisions.failed", auth: "user" }, async ({ request, user }) => {
  const query = parseSearchParams(request, querySchema);
  const rows = await listDecisionLog({
    userId: user.id,
    accepted: parseAcceptedFilter(query.accepted),
    limit: query.limit ?? 200,
  });
  return jsonOk(rows, { explanation: `Loaded ${rows.length} decision log entries.` });
});
