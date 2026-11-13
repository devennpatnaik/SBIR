import { requireIdentity } from "../../../../../../cursor/identity";
import { setOutcome } from "@/lib/data";

export const dynamic = "force-dynamic";

const CONTACTED = new Set(["unknown", "pending", "yes", "no"]);
const REPLY = new Set(["unknown", "pending", "yes", "no"]);
const INTEREST = new Set(["unknown", "none", "weak", "strong"]);
const SBIR = new Set(["unknown", "not_pursued", "pending", "yes", "no"]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    contacted?: string;
    reply?: string;
    interest?: string;
    sbir_status?: string;
    notes?: string;
  };

  if (body.contacted !== undefined && !CONTACTED.has(body.contacted)) {
    return Response.json({ error: "invalid_contacted" }, { status: 400 });
  }
  if (body.reply !== undefined && !REPLY.has(body.reply)) {
    return Response.json({ error: "invalid_reply" }, { status: 400 });
  }
  if (body.interest !== undefined && !INTEREST.has(body.interest)) {
    return Response.json({ error: "invalid_interest" }, { status: 400 });
  }
  if (body.sbir_status !== undefined && !SBIR.has(body.sbir_status)) {
    return Response.json({ error: "invalid_sbir_status" }, { status: 400 });
  }

  const lead = await setOutcome(identity.sub, id, {
    contacted: body.contacted,
    reply: body.reply,
    interest: body.interest,
    sbir_status: body.sbir_status,
    notes: typeof body.notes === "string" ? body.notes.slice(0, 2000) : undefined,
  });
  if (!lead) {
    return Response.json({ error: "not_found" }, { status: 404, headers: { "cache-control": "private, no-store" } });
  }
  return Response.json({ lead }, { headers: { "cache-control": "private, no-store" } });
}
