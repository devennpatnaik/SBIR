import { requireIdentity } from "../../../../cursor/identity";
import { ensureSeeded } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  const total = await ensureSeeded();
  return Response.json(
    { message: "DFU seed leads ready", total },
    { headers: { "cache-control": "private, no-store" } },
  );
}
