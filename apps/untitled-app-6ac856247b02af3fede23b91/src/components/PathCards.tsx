import { useState } from 'react';
import { Check, Copy, ExternalLink, Mail, SkipForward, Wallet } from 'lucide-react';
import { buildOutreachDraft, parseSbirStub, type MatchPath } from '../lib/dfu';
import { invalidate, nowIso, updateRow } from '../lib/data';
import { saveOutcome } from '../lib/learning';
import type { Technology } from '../lib/types';
import { Button, Notice } from './ui';

type Props = {
  tech: Technology;
  projectId?: string | null;
  onActed?: (path: MatchPath) => void;
};

/** Exactly three commercialization path cards for a DFU lead. */
export function PathCards({ tech, projectId, onActed }: Props) {
  const [busy, setBusy] = useState<MatchPath | null>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const stub = parseSbirStub(tech.sbir_relevance || '');
  const draft = buildOutreachDraft(tech);
  const chosen = (tech.match_path || '') as MatchPath;

  const act = async (path: Exclude<MatchPath, ''>) => {
    setBusy(path);
    setError('');
    setMessage('');
    try {
      const archived = path === 'skip';
      const shortlisted = path === 'outreach' || path === 'sbir_topic';
      await updateRow('technologies', tech.id, {
        match_path: path,
        match_acted_at: nowIso(),
        archived,
        shortlisted: shortlisted || tech.shortlisted,
        updated_at: nowIso(),
      });

      // Lite Layer 4: contacted / reply / interest scaffolding from the path choice.
      if (path === 'outreach') {
        await saveOutcome({
          technologyId: tech.id,
          projectId: projectId ?? null,
          answers: {
            lab_responded: 'pending',
            license_available: 'unknown',
            tech_dd_result: 'not_started',
            sbir_award: 'unknown',
            customer_interest: 'unknown',
            notes: 'Path: inventor/TTO outreach draft prepared.',
            pathway_key: 'dfu_outreach',
            contribute_to_learning: !tech.is_sample,
          },
        }).catch(() => undefined);
        setMessage('Outreach path logged. Copy the draft, send it yourself, then update reply/interest below.');
      } else if (path === 'sbir_topic') {
        await saveOutcome({
          technologyId: tech.id,
          projectId: projectId ?? null,
          answers: {
            lab_responded: 'unknown',
            license_available: 'unknown',
            tech_dd_result: 'not_started',
            sbir_award: 'pending',
            customer_interest: 'unknown',
            notes: `Path: opened SBIR topic stub — ${stub.title}`,
            evidence_url: stub.url.startsWith('http') ? stub.url : '',
            pathway_key: 'dfu_sbir_topic',
            contribute_to_learning: !tech.is_sample,
          },
        }).catch(() => undefined);
        setMessage('SBIR topic path logged. Confirm the live solicitation before writing anything.');
        window.open(stub.url, '_blank', 'noopener,noreferrer');
      } else {
        await saveOutcome({
          technologyId: tech.id,
          projectId: projectId ?? null,
          answers: {
            lab_responded: 'unknown',
            license_available: 'not_applicable',
            tech_dd_result: 'not_started',
            sbir_award: 'not_pursued',
            customer_interest: 'none',
            notes: 'Path: skipped — not a fit for DFU commercialization right now.',
            pathway_key: 'dfu_skip',
            contribute_to_learning: !tech.is_sample,
          },
        }).catch(() => undefined);
        setMessage('Skipped. This lead drops out of the unpicked queue.');
      }
      invalidate();
      onActed?.(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save path choice.');
    } finally {
      setBusy(null);
    }
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Clipboard unavailable — select the draft and copy manually.');
    }
  };

  return (
    <section className="path-cards" aria-label="Commercialization path cards">
      <div className="path-cards-head">
        <p className="eyebrow">MATCH → ACT</p>
        <h3>Pick exactly one path</h3>
        <p>Outreach draft, matching SBIR/STTR topic, or skip. No wizard — one next move.</p>
      </div>
      {chosen && (
        <Notice tone="slate">
          You chose <strong>{chosen === 'outreach' ? 'Inventor / TTO outreach' : chosen === 'sbir_topic' ? 'SBIR topic' : 'Skip'}</strong>
          {tech.match_acted_at ? ` · ${new Date(tech.match_acted_at).toLocaleString()}` : ''}. You can change it below.
        </Notice>
      )}
      <div className="path-card-grid">
        <article className={`path-card${chosen === 'outreach' ? ' chosen' : ''}`}>
          <div className="path-card-icon" aria-hidden="true"><Mail size={18} /></div>
          <h4>Inventor / TTO outreach</h4>
          <p>Draft a short evaluation-license or collaboration email. You send it yourself.</p>
          <pre className="path-draft">{draft}</pre>
          <div className="path-card-actions">
            <Button onClick={() => void copyDraft()}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy draft</>}</Button>
            <Button variant="primary" busy={busy === 'outreach'} onClick={() => void act('outreach')}>
              Use this path
            </Button>
          </div>
        </article>

        <article className={`path-card${chosen === 'sbir_topic' ? ' chosen' : ''}`}>
          <div className="path-card-icon" aria-hidden="true"><Wallet size={18} /></div>
          <h4>Matching SBIR/STTR topic</h4>
          <p className="path-topic-title">{stub.title}</p>
          <p className="path-topic-why">{stub.why}</p>
          <p className="path-topic-note">Stub only — verify the live solicitation. No Phase I–III wizard.</p>
          <div className="path-card-actions">
            <a className="path-ext" href={stub.url} target="_blank" rel="noreferrer">
              Open topic portal <ExternalLink size={14} />
            </a>
            <Button variant="primary" busy={busy === 'sbir_topic'} onClick={() => void act('sbir_topic')}>
              Use this path
            </Button>
          </div>
        </article>

        <article className={`path-card skip${chosen === 'skip' ? ' chosen' : ''}`}>
          <div className="path-card-icon" aria-hidden="true"><SkipForward size={18} /></div>
          <h4>Skip / not a fit</h4>
          <p>Archive this lead so the ranked queue stays clean for better DFU matches.</p>
          <div className="path-card-actions">
            <Button busy={busy === 'skip'} onClick={() => void act('skip')}>
              Skip this lead
            </Button>
          </div>
        </article>
      </div>
      {error && <p className="path-msg error" role="alert">{error}</p>}
      {message && <p className="path-msg ok" role="status">{message}</p>}
    </section>
  );
}
