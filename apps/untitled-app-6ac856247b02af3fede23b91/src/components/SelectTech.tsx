import { useState } from 'react';
import { selectTechnology } from '../lib/actions';
import { navigate, setActiveProject } from '../lib/router';
import { summarize } from '../lib/scoring';
import type { Evaluation, Project, Technology } from '../lib/types';
import { Button, ErrorNote, Modal, Notice, useAsync } from './ui';

/** The explicit "Select this technology" action. Creates (or opens) the persistent project. */
export function SelectTechButton({ tech, evaluation, project, size }: { tech: Technology; evaluation?: Evaluation; project?: Project; size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState(false);
  const { busy, error, run } = useAsync();
  if (project) return <Button size={size} onClick={() => { setActiveProject(project.id); navigate(`projects/${project.id}`); }}>Open project</Button>;
  const s = summarize(evaluation, tech);
  return (
    <>
      <Button size={size} variant="primary" onClick={() => setOpen(true)}>Select this technology</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Select “${tech.name}”`}>
        <div className="space-y-3 text-sm">
          <p>This creates a commercialization project with a starter checklist, licensing research questions, and a next-action plan. You can pursue more than one technology, but focus works best.</p>
          {s.overall == null ? <Notice>This technology has not been scored. You can still select it, but consider scoring it first.</Notice>
            : <Notice tone="slate">Score {s.overall}/100 with {s.confidence} confidence ({s.scored}/10 dimensions). A score is a structured opinion, not a verified investment case.</Notice>}
          {!!s.missing.length && <div><b>Still missing:</b><ul className="list-disc pl-5 text-slate-600">{s.missing.slice(0, 6).map(m => <li key={m}>{m}</li>)}</ul></div>}
          <ErrorNote error={error} />
          <div className="flex gap-2">
            <Button variant="primary" busy={busy} onClick={() => run(async () => { const p = await selectTechnology(tech); setActiveProject(p.id); navigate(`projects/${p.id}`); })}>Create project</Button>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
