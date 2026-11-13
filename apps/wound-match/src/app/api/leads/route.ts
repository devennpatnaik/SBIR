import { requireIdentity } from "../../../../cursor/identity";
import { listLeadsForViewer } from "@/lib/data";
import { splitSections } from "@/lib/rank";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  const leads = await listLeadsForViewer(identity.sub);
  const { unpicked, acted } = splitSections(leads);
  return Response.json(
    {
      viewer: { name: identity.name, email: identity.email, simulated: identity.simulated },
      total: leads.length,
      unpicked,
      acted,
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
