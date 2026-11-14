import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function HomePage() {
  return (
    <Shell>
      <main className="welcome">
        <div className="sprout" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 20V11" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 14C7 14 5 9 6.5 5.5C10 5.2 12.5 8 12 14Z" fill="currentColor" opacity="0.35" />
            <path d="M12 14C17.2 14 19 10 17.8 7C14.2 6.8 12.2 9.5 12 14Z" fill="currentColor" opacity="0.55" />
          </svg>
        </div>
        <p className="eyebrow">WOUND MATCH · DFU MVP</p>
        <h1>wound match.</h1>
        <p className="lede">
          Match overlooked diabetic foot ulcer and chronic-wound research to a next commercialization
          move — discover, rank, path cards, act, log.
        </p>
        <div className="hero-cta">
          <Link href="/queue" className="hero-card">
            <div className="tag">V1 · DFU / CHRONIC WOUNDS</div>
            <h2>Open the ranked pursue queue</h2>
            <p>
              PubMed-shaped + NIH/VA/DoD leads. Three path cards per lead: inventor/TTO outreach,
              matching SBIR topic, or skip.
            </p>
            <span className="cta">Enter DFU match loop →</span>
          </Link>
        </div>
        <p className="fine">No chat. Ranked list → pursue. Sample seed data locally; Postgres on publish.</p>
      </main>
    </Shell>
  );
}
