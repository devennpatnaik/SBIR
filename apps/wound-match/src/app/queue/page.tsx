import { Shell, LoopBanner } from "@/components/Shell";
import { PursueQueue } from "@/components/PursueQueue";

export default function QueuePage() {
  return (
    <Shell>
      <LoopBanner active="rank" />
      <p className="eyebrow">SELECT → PURSUE</p>
      <h1 className="editorial" style={{ fontSize: "clamp(32px, 5vw, 46px)", margin: "0 0 10px", lineHeight: 1.1 }}>
        DFU / chronic wounds
        <br />
        pursue queue.
      </h1>
      <p className="lede">
        One ranked list of PubMed-shaped and NIH/VA/DoD leads. Open a lead, pick outreach / SBIR topic /
        skip, then log what happened.
      </p>
      <PursueQueue />
    </Shell>
  );
}
