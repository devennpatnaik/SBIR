import { requireIdentity } from "../../../../../cursor/identity";
import { getLeadForViewer } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  const { id } = await context.params;
  const lead = await getLeadForViewer(identity.sub, id);
  if (!lead) {
    return Response.json({ error: "not_found" }, { status: 404, headers: { "cache-control": "private, no-store" } });
  }
  return Response.json(
    { lead, viewer: { name: identity.name, simulated: identity.simulated } },
    { headers: { "cache-control": "private, no-store" } },
  );
}
