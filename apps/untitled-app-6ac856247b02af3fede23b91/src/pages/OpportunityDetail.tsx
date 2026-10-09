import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { createProposal } from '../lib/actions';
import { deleteRow, fmtDate, insertRow, nowIso, updateRow, useQuery } from '../lib/data';
import { navigate, useActiveProjectId } from '../lib/router';
import type { Opportunity, Project, ProjectOpportunity, Proposal, Question } from '../lib/types';
import { OPP_FIELDS, OppForm, SbirSttrExplainer } from '../components/OppForm';
import { QuestionList } from '../components/ProjectParts';
import { SourcesPanel } from '../components/Sources';
import { Badge, Button, Card, ErrorNote, Field, InlineText, Input, Modal, Notice, PageHeader, SampleBadge, Select, SourceLink, Tabs, useAsync } from '../components/ui';

export function OpportunityDetail({ id }: { id: string }) {
  const q = useQuery<Opportunity>('opportunities', b => b.eq('id', id), [id]);
  const projects = useQuery<Project>('projects', b => b.eq('archived', false).order('updated_at', { ascending: false }));
  const links = useQuery<ProjectOpportunity>('project_opportunities', b => b.eq('opportunity_id', id), [id]);
  const proposals = useQuery<Proposal>('proposals', b => b.eq('opportunity_id', id), [id]);
  const [activeId, setActiveId] = useActiveProjectId();
  const project = projects.data.find(p => p.id === activeId) ?? projects.data[0];
  const questions = useQuery<Question>('questions', b => b.eq('opportunity_id', id).order('created_at'), [id]);
  const [tab, setTab] = useState<'details' | 'edit' | 'eligibility' | 'evidence' | 'source'>('details');
  const [verifyOpen, setVerifyOpen] = useState(false);
  const { busy, error, run } = useAsync();
  const o = q.data[0];
  if (q.loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!o) return <ErrorNote error={q.error ?? 'Opportunity not found.'} />;
  const link = links.data.find(l => l.project_id === project?.id);
  const proposal = proposals.data.find(p => p.project_id === project?.id);

  return (
    <div>
      <button type="button" onClick={() => navigate('funding')} className="mb-2 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="size-4" />All opportunities</button>
      <PageHeader title={`${o.topic_number ? o.topic_number + ': ' : ''}${o.topic_title}`}
        subtitle={<span className="flex flex-wrap items-center gap-2">{o.is_sample && <SampleBadge />}<Badge tone={o.program === 'STTR' ? 'purple' : 'blue'}>{o.program}</Badge>{o.agency} {o.branch && `· ${o.branch}`} {o.phase && `· ${o.phase}`}<SourceLink url={o.source_url} label="Official source" /></span>}
        actions={<Select aria-label="Relevance" value={o.relevance} onChange={e => updateRow('opportunities', o.id, { relevance: e.target.value })} options={{ unreviewed: 'Unreviewed', relevant: 'Relevant', maybe: 'Maybe', irrelevant: 'Irrelevant' }} className="w-36" />} />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card title="Deadline">
          {o.close_date ? <div className="text-lg font-semibold">{fmtDate(o.close_date)}</div> : <div className="text-sm text-slate-500">Not recorded</div>}
          <div className="mt-1">{o.deadline_verified ? <Badge tone="green">Verified {fmtDate(o.deadline_checked_at)}</Badge> : <Badge tone="amber">Unverified</Badge>}</div>
          {o.deadline_source_url && <div className="mt-1"><SourceLink url={o.deadline_source_url} /></div>}
          <Button className="mt-2" size="sm" onClick={() => setVerifyOpen(true)}>Verify deadline</Button>
        </Card>
        <Card title="Award">
          <div className="text-sm">{o.award_amount || <span className="text-slate-500">Award size not recorded</span>}</div>
          <div className="text-sm text-slate-600">{o.duration}</div>
          <div className="text-xs text-slate-500">{o.award_type}</div>
        </Card>
        <Card title="Your project">
          {projects.data.length > 1 && project && <Select aria-label="Project for this opportunity" className="mb-2" value={project.id} onChange={e => setActiveId(e.target.value)} options={projects.data.map(x => [x.id, x.name] as [string, string])} />}
          {projects.data.length === 1 && project && <div className="mb-2 text-sm font-medium">{project.name}</div>}
          {!project ? <p className="text-sm text-slate-500">Create a project first.</p> : !link ? (
            <Button size="sm" variant="primary" onClick={() => insertRow('project_opportunities', { project_id: project.id, opportunity_id: o.id })}>Link to project</Button>
          ) : (
            <div className="space-y-2">
              <Select aria-label="Pursuit status" value={link.status} onChange={e => updateRow('project_opportunities', link.id, { status: e.target.value })} options={{ considering: 'Considering', pursuing: 'Pursuing', rejected: 'Not pursuing' }} />
              {proposal ? <Button size="sm" onClick={() => navigate(`proposals/${proposal.id}`)}>Open proposal workspace</Button>
                : <Button size="sm" variant="primary" busy={busy} onClick={() => run(async () => { if (link.status !== 'pursuing') await updateRow('project_opportunities', link.id, { status: 'pursuing' }); const pr = await createProposal(project, o); navigate(`proposals/${pr.id}`); })}>Start proposal workspace</Button>}
              <Button size="sm" variant="ghost" onClick={() => deleteRow('project_opportunities', link.id)}>Unlink</Button>
            </div>
          )}
          <ErrorNote error={error} />
        </Card>
      </div>
      {o.program !== 'SBIR' && !o.research_institution_reqs && <div className="mb-4"><Notice>This is an STTR opportunity. Record the solicitation's research-institution and work-split requirements in <b>Edit</b>, and add an eligibility question about your partner.</Notice></div>}

      <Tabs tabs={[['details', 'Requirements'], ['eligibility', `Eligibility questions (${questions.data.filter(x => x.status === 'open').length})`], ['edit', 'Edit'], ['evidence', 'Sources'], ['source', 'Original source data']]} value={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === 'details' && (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card>
              <dl className="space-y-4">{OPP_FIELDS.filter(f => !['topic_title', 'source_url', 'agency', 'branch', 'open_date', 'close_date', 'award_amount', 'duration', 'award_type'].includes(f.key)).map(f => (
                <div key={f.key}><dt className="text-xs font-medium uppercase text-slate-500">{f.label}</dt><dd className="mt-0.5 whitespace-pre-wrap text-sm">{String(o[f.key] ?? '') || <span className="text-slate-400">Not recorded — check the solicitation</span>}</dd></div>
              ))}</dl>
            </Card>
            <div className="space-y-4">
              <Card title="Fit with your project"><InlineText label="Fit notes" multiline rows={5} value={o.fit_notes} onSave={v => updateRow('opportunities', o.id, { fit_notes: v })} placeholder="How does the topic match your technology, product and team? What would you have to change?" /></Card>
              <Card title="SBIR vs STTR"><SbirSttrExplainer /></Card>
            </div>
          </div>
        )}
        {tab === 'eligibility' && <Card>{project ? <QuestionList projectId={project.id} questions={questions.data} kind="eligibility" opportunityId={o.id} area="funding" /> : <p className="text-sm">Create a project first.</p>}
          <p className="mt-3 text-xs text-slate-500">Common questions: Is the company an SBA-eligible small business (≤500 employees, U.S.-owned/controlled)? Is the PI primarily employed by the company? Do we have IP access (license or letter) before award? For STTR, is the partner a qualifying research institution and will it do ≥30% of the work?</p></Card>}
        {tab === 'edit' && <Card><OppForm initial={o} submitLabel="Save changes" onSubmit={async d => {
          const { id: _a, created_at: _b, ...rest } = d as Opportunity & { user_id?: string };
          void _a; void _b; delete (rest as { user_id?: string }).user_id;
          const changedDeadline = rest.close_date !== o.close_date;
          await updateRow('opportunities', o.id, { ...rest, updated_at: nowIso(), last_checked_at: nowIso(), ...(changedDeadline ? { deadline_verified: false } : {}) }); setTab('details');
        }} /></Card>}
        {tab === 'evidence' && <Card><SourcesPanel scope={{ opportunity_id: o.id }} /></Card>}
        {tab === 'source' && <Card>{o.source_text ? <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-xs">{o.source_text}</pre> : <p className="text-sm text-slate-500">No raw source data stored. See the <SourceLink url={o.source_url} label="official page" />.</p>}</Card>}
      </div>
      <Modal open={verifyOpen} onClose={() => setVerifyOpen(false)} title="Verify the deadline"><VerifyDeadline o={o} onDone={() => setVerifyOpen(false)} /></Modal>
    </div>
  );
}

function VerifyDeadline({ o, onDone }: { o: Opportunity; onDone: () => void }) {
  const [date, setDate] = useState(o.close_date ?? '');
  const [url, setUrl] = useState(o.deadline_source_url || o.source_url);
  const { busy, error, run, setError } = useAsync();
  return (
    <div className="space-y-3">
      <p className="text-sm">Open the current official solicitation or agency page, check the closing date and time (and any amendments), then record it here.</p>
      <Field label="Deadline shown on the official page"><Input aria-label="Verified deadline" type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
      <Field label="Official page URL"><Input aria-label="Deadline source URL" value={url} onChange={e => setUrl(e.target.value)} /></Field>
      <ErrorNote error={error} />
      <div className="flex gap-2">
        <Button variant="primary" busy={busy} onClick={() => { if (!date || !/^https?:\/\//.test(url)) { setError('Enter the date and the official URL.'); return; } void run(async () => { await updateRow('opportunities', o.id, { close_date: date, deadline_source_url: url, deadline_verified: true, deadline_checked_at: nowIso() }); onDone(); }); }}>Confirm — I checked the official page today</Button>
        {o.deadline_verified && <Button onClick={() => run(async () => { await updateRow('opportunities', o.id, { deadline_verified: false }); onDone(); })}>Mark unverified</Button>}
      </div>
    </div>
  );
}
