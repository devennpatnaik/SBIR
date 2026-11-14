import { Shell, LoopBanner } from "@/components/Shell";
import { LeadWorkspace } from "@/components/LeadWorkspace";

export default async function LeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Shell>
      <LoopBanner active="path" />
      <LeadWorkspace leadId={id} />
    </Shell>
  );
}
