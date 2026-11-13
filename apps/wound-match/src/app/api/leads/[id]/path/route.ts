import { requireIdentity } from "../../../../../../cursor/identity";
import { setPath } from "@/lib/data";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["outreach", "sbir_topic", "skip"]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { match_path?: string };
  const matchPath = body.match_path ?? "";
  if (!ALLOWED.has(matchPath)) {
    return Response.json(
      { error: "invalid_path" },
      { status: 400, headers: { "cache-control": "private, no-store" } },
    );
  }

  const lead = await setPath(
    identity.sub,
    id,
    matchPath as "outreach" | "sbir_topic" | "skip",
  );
  if (!lead) {
    return Response.json({ error: "not_found" }, { status: 404, headers: { "cache-control": "private, no-store" } });
  }
  return Response.json({ lead }, { headers: { "cache-control": "private, no-store" } });
}
