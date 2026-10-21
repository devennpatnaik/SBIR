import { ArrowRight, Landmark, FlaskConical, Wallet, ListChecks } from 'lucide-react';
import { enterTrack, navigate } from '../lib/router';
import { Button } from '../components/ui';
import { Dashboard } from './Dashboard';

/** Track A home — SBIR-eligible government R&D + process handholding. */
export function SbirHome({ signedIn }: { signedIn: boolean }) {
  if (signedIn) {
    return (
      <div className="track-home sbir-track-home">
        <TrackBanner />
        <div className="pursue-home-cta">
          <div>
            <p className="eyebrow">SELECT → PURSUE</p>
            <h2 className="editorial">Pick one thing. Move it forward.</h2>
            <p>Choose a government R&amp;D lead or SBIR process step from a list — no chat.</p>
          </div>
          <Button variant="primary" onClick={() => navigate('sbir/pursue')}>
            Open pursue list <ArrowRight size={16} />
          </Button>
        </div>
        <Dashboard />
      </div>
    );
  }
  return (
    <main className="track-home sbir-track-home guest">
      <TrackBanner />
      <p className="eyebrow">TRACK A · SBIR ROUTE</p>
      <h1 className="editorial">Get paid to bring<br/>government research<br/>to market.</h1>
      <p className="track-lede">
        This track is for <strong>SBIR-eligible government R&D</strong> — federal labs and agency-backed
        technology that can feed an SBIR/STTR application. We hand-hold you through the process:
        find a fit, follow up on rights, prepare funding steps, and log outcomes that matter for SBIR.
      </p>
      <div className="track-actions">
        <Button variant="primary" onClick={() => navigate('sbir/pursue')}>
          Pursue from a list <ArrowRight size={16} />
        </Button>
        <Button onClick={() => navigate('sbir/path')}>
          See the SBIR path <ArrowRight size={16} />
        </Button>
        <Button onClick={() => navigate('start/sbir')}>
          Start with three questions <ArrowRight size={16} />
        </Button>
        <Button onClick={() => navigate('signin')}>Sign in to your workspace</Button>
      </div>
      <ul className="track-pillars">
        <li><Landmark size={18} /><span><strong>Gov R&D focus</strong>Federal lab and agency-backed inventions that can feed SBIR/STTR.</span></li>
        <li><ListChecks size={18} /><span><strong>Process steps</strong>Eligibility, solicitation, licensing follow-ups, proposal prep.</span></li>
        <li><Wallet size={18} /><span><strong>Get paid to develop</strong>Commercialization coaching aimed at agency funding paths.</span></li>
        <li><FlaskConical size={18} /><span><strong>Layer 4 outcomes</strong>Log lab response, diligence, and SBIR award signals.</span></li>
      </ul>
      <p className="track-switch">
        Looking for patents registered anywhere that may not be SBIR-eligible?{' '}
        <button type="button" onClick={() => enterTrack('patents')}>Switch to worldwide patents →</button>
      </p>
    </main>
  );
}

function TrackBanner() {
  return (
    <div className="track-banner sbir" role="status">
      <Landmark size={16} />
      <span><strong>SBIR route</strong> — government R&D · process handholding · commercialization coaching</span>
      <button type="button" className="track-switch-btn" onClick={() => enterTrack('patents')}>Switch to patents</button>
    </div>
  );
}
