import { ArrowRight, Bandage, ListChecks } from 'lucide-react';
import { navigate } from '../lib/router';
import { PROBLEM_SPACE_LABEL } from '../lib/dfu';
import { Button } from '../components/ui';

/** Default track home — DFU match loop, not SBIR curriculum. */
export function SbirHome({ signedIn }: { signedIn: boolean }) {
  return (
    <main className={`track-home sbir-track-home dfu-home${signedIn ? '' : ' guest'}`}>
      <div className="track-banner dfu" role="status">
        <Bandage size={16} />
        <span><strong>{PROBLEM_SPACE_LABEL}</strong> — innovation → commercialization match (v1)</span>
      </div>
      <p className="eyebrow">LAB TO MARKET · MVP</p>
      <h1 className="editorial">Match overlooked<br />wound-care research<br />to a next move.</h1>
      <p className="track-lede">
        One problem space: diabetic foot ulcers and chronic non-healing wounds.
        Discover PubMed-shaped and NIH/VA/DoD leads, rank the most promising unpicked,
        pick a path card (outreach, SBIR topic, or skip), and log the outcome.
        Not an SBIR curriculum. Not a patents browser.
      </p>
      <div className="track-actions">
        <Button variant="primary" onClick={() => navigate('sbir/pursue')}>
          Open DFU pursue queue <ArrowRight size={16} />
        </Button>
        {signedIn ? null : <Button onClick={() => navigate('signin')}>Sign in to save outcomes</Button>}
      </div>
      <ul className="track-pillars">
        <li><ListChecks size={18} /><span><strong>One ranked queue</strong>Most promising unpicked DFU / wound leads first.</span></li>
        <li><Bandage size={18} /><span><strong>Three path cards</strong>Inventor/TTO outreach · matching SBIR topic · skip.</span></li>
        <li><ListChecks size={18} /><span><strong>Outcome lite</strong>Log contacted / reply / interest — feed the ranking.</span></li>
      </ul>
      <p className="track-switch demoted">
        Need the old SBIR path walk or patents search?{' '}
        <button type="button" onClick={() => navigate('sbir/path')}>SBIR path (demoted)</button>
        {' · '}
        <button type="button" onClick={() => navigate('patents/home')}>Patents (demoted)</button>
      </p>
    </main>
  );
}
