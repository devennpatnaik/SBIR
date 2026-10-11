import { daysUntil } from './data';
import { summarize } from './scoring';
import type { Bundle } from './bundle';
import { ACTIVE_TRACK, normalizeAgency, programById, programDaysLeft, stageOf } from './programs';

export type Action = { title: string; why: string; link: string; area: string; urgency: 'now' | 'soon' | 'later' };
export type Deadline = { label: string; date: string; days: number; verified: boolean; link: string };
export type Blocker = { label: string; link: string };

/**
 * Derives the recommended next actions from the project's actual records. Rules are ordered by dependency:
 * you cannot sensibly write a proposal before you know the IP is accessible, and so on.
 */
export function analyze(b: Bundle): { actions: Action[]; deadlines: Deadline[]; blockers: Blocker[] } {
  const actions: Action[] = [];
  const deadlines: Deadline[] = [];
  const blockers: Blocker[] = [];
  const p = b.project;
  if (!p) return { actions, deadlines, blockers };
  const pid = p.id;
  const openTasks = b.tasks.filter(t => t.status !== 'done' && t.status !== 'skipped');

  // Deadlines
  for (const t of openTasks) {
    const d = daysUntil(t.due_date);
    if (t.due_date && d !== null && d <= 30) deadlines.push({ label: t.title, date: t.due_date, days: d, verified: true, link: `projects/${pid}?tab=tasks` });
  }
  const pursued = new Set(b.links.filter(l => l.status !== 'rejected').map(l => l.opportunity_id));
  for (const o of b.opps.filter(o => pursued.has(o.id))) {
    const d = daysUntil(o.close_date);
    if (o.close_date && d !== null && d >= -1 && d <= 30) deadlines.push({ label: `${o.agency} ${o.program} ${o.topic_number || o.topic_title} closes`, date: o.close_date, days: d, verified: o.deadline_verified, link: `funding/${o.id}` });
  }
  for (const c of b.comms) {
    const d = daysUntil(c.follow_up_date);
    if (c.follow_up_date && d !== null && d <= 14 && c.status === 'sent_by_user') deadlines.push({ label: `Follow up: ${c.subject || 'outreach'}`, date: c.follow_up_date, days: d, verified: true, link: 'licensing?tab=outreach' });
  }
  for (const t of b.programs ?? []) {
    const prog = programById(t.program_id);
    if (!prog || prog.timing.type !== 'deadline' || !ACTIVE_TRACK.has(t.status) || t.status !== 'considering' && t.status !== 'preparing') continue;
    const d = programDaysLeft(prog);
    if (d !== null && d >= 0 && d <= 30 && !b.tasks.some(x => x.id === t.task_id)) deadlines.push({ label: `${prog.name} application due`, date: prog.timing.date, days: d, verified: true, link: `help?program=${prog.id}` });
  }
  deadlines.sort((a, b2) => a.days - b2.days);

  // Blockers
  for (const t of openTasks.filter(t => t.status === 'blocked')) blockers.push({ label: `${t.title}${t.blocker ? ` — ${t.blocker}` : ''}`, link: `projects/${pid}?tab=tasks` });
  for (const q of b.questions.filter(q => q.status === 'open' && q.blocking)) blockers.push({ label: q.text, link: `projects/${pid}?tab=questions` });
  const overdue = openTasks.filter(t => (daysUntil(t.due_date) ?? 1) < 0);
  for (const t of overdue) blockers.push({ label: `Overdue: ${t.title}`, link: `projects/${pid}?tab=tasks` });

  const add = (a: Action) => actions.push(a);
  const ev = summarize(b.evaluation, b.tech);
  if (ev.scored < 10) add({ title: 'Finish scoring this technology', why: `${ev.scored}/10 dimensions scored. Scores drive the go/no-go decision.`, link: `compare?score=${p.technology_id}`, area: 'validation', urgency: 'soon' });
  if (!p.business_thesis.trim()) add({ title: 'Write your business thesis', why: 'One paragraph: who has the problem, what you will sell, why this technology wins. Everything else builds on it.', link: `projects/${pid}?tab=overview`, area: 'validation', urgency: 'now' });
  if (!b.lab?.tto_email && !b.lab?.tto_url && !b.contacts.length) add({ title: 'Identify the technology-transfer office contact', why: 'No tech-transfer contact recorded. Find it on the lab\'s own website and record the source URL.', link: 'licensing?tab=office', area: 'licensing', urgency: 'now' });
  const patent = b.licensing.find(l => l.topic === 'patent_status');
  if (patent && patent.status !== 'answered') add({ title: 'Verify the patent status', why: 'Patent status is unconfirmed. Look up the patent numbers at USPTO / Google Patents.', link: 'licensing?tab=research', area: 'licensing', urgency: 'now' });
  const outbound = b.comms.filter(c => c.direction === 'outbound' && c.area === 'licensing');
  const sent = outbound.filter(c => c.status === 'sent_by_user');
  const inbound = b.comms.filter(c => c.direction === 'inbound');
  if (!outbound.length) add({ title: 'Draft an introductory email to the tech-transfer office', why: 'No licensing outreach yet. The app drafts it; you review and send it yourself.', link: 'licensing?tab=outreach', area: 'licensing', urgency: 'now' });
  else if (!sent.length) add({ title: b.tech?.is_sample ? 'Review the practice licensing inquiry' : 'Review and send your drafted outreach email', why: b.tech?.is_sample ? 'Practice reviewing this fictional draft. Do not send it to the sample contact.' : 'A draft exists but has not been marked as sent.', link: 'licensing?tab=outreach', area: 'licensing', urgency: 'now' });
  else if (!inbound.length) {
    const last = sent[0];
    const since = last?.occurred_at ? Math.floor((Date.now() - new Date(last.occurred_at).getTime()) / 86400000) : 0;
    if (since >= 7) add({ title: 'Follow up with the tech-transfer office', why: `No response logged ${since} days after your email.`, link: 'licensing?tab=outreach', area: 'licensing', urgency: 'now' });
  }
  const openLic = b.licensing.filter(l => l.status !== 'answered').length;
  if (openLic && inbound.length) add({ title: 'Record what the lab told you', why: `${openLic} licensing questions are still open. Update them from the lab's response.`, link: 'licensing?tab=research', area: 'licensing', urgency: 'soon' });
  if (p.licensing_pathway === 'undecided' && b.licensing.filter(l => l.status === 'answered').length >= 3) add({ title: 'Choose a licensing pathway', why: 'You have enough answers to compare an evaluation license, option, license, or CRADA.', link: 'licensing?tab=pathway', area: 'licensing', urgency: 'soon' });

  const done = (b.interviews ?? []).length;
  if (done < 5) add({ title: `Hold customer-discovery interviews (${done}/5 logged)`, why: 'Customer demand is the most important evidence for both the business and an SBIR commercialization section.', link: 'roadmap?tab=interviews', area: 'validation', urgency: done ? 'soon' : 'now' });

  if (!b.links.length) add({ title: 'Find and save candidate SBIR/STTR topics', why: 'No funding opportunities linked. Search official agency topic lists and save the ones that fit.', link: 'funding', area: 'funding', urgency: 'soon' });
  for (const o of b.opps.filter(o => pursued.has(o.id))) {
    if (o.close_date && !o.deadline_verified) add({ title: `Verify the deadline for ${o.topic_number || o.topic_title}`, why: 'The deadline is not confirmed against a current official source.', link: `funding/${o.id}`, area: 'funding', urgency: 'soon' });
  }
  const elig = b.questions.filter(q => q.kind === 'eligibility' && q.status === 'open');
  if (elig.length) add({ title: `Resolve ${elig.length} open eligibility question${elig.length > 1 ? 's' : ''}`, why: elig.slice(0, 2).map(q => q.text).join(' · '), link: `projects/${pid}?tab=questions`, area: 'funding', urgency: 'soon' });
  const pursuing = b.links.filter(l => l.status === 'pursuing');
  for (const l of pursuing) {
    if (!b.proposals.some(pr => pr.opportunity_id === l.opportunity_id)) {
      const o = b.opps.find(x => x.id === l.opportunity_id);
      add({ title: `Start the proposal workspace for ${o?.topic_number || o?.topic_title || 'this topic'}`, why: 'You marked this opportunity as one you are pursuing.', link: `funding/${l.opportunity_id}`, area: 'proposal', urgency: 'soon' });
    }
  }
  for (const pr of b.proposals.filter(x => x.status !== 'submitted_confirmed' && x.status !== 'withdrawn')) {
    const secs = b.sections.filter(s => s.proposal_id === pr.id && s.required_status !== 'not_required');
    const left = secs.filter(s => s.status !== 'complete').length;
    const unconfirmed = secs.filter(s => s.required_status === 'confirm_in_solicitation').length;
    if (unconfirmed) add({ title: 'Confirm proposal requirements against the solicitation', why: `${unconfirmed} checklist items are generic and not yet confirmed against "${pr.title}".`, link: `proposals/${pr.id}`, area: 'proposal', urgency: 'soon' });
    else if (left) add({ title: `Work on proposal sections (${left} remaining)`, why: pr.title, link: `proposals/${pr.id}`, area: 'proposal', urgency: 'soon' });
  }

  // Free public help for the current step (licensing intermediaries, proposal coaching)
  const stage = stageOf(p.status);
  const usingHelp = (b.programs ?? []).some(t => ACTIVE_TRACK.has(t.status) || t.status === 'completed');
  const techAgency = normalizeAgency(b.tech?.agency);
  if (!usingHelp && (stage === 'license' || stage === 'discover') && (techAgency === 'DoD' || techAgency === 'VA')) add({ title: 'Ask TechLink for free licensing help', why: `Your technology comes from a ${techAgency} lab. TechLink is the official, no-cost licensing intermediary for DoD and VA labs.`, link: 'help?program=techlink', area: 'licensing', urgency: 'soon' });
  else if (!usingHelp && (stage === 'license' || stage === 'discover') && techAgency === 'NASA') add({ title: 'Check NASA’s startup license (no up-front fee)', why: 'NASA offers U.S. startups formed to commercialize its technology a non-exclusive license with no up-front fee.', link: 'help?program=nasa_startup_license', area: 'licensing', urgency: 'soon' });
  else if (!usingHelp && (stage === 'propose' || b.links.length > 0)) add({ title: 'Line up free proposal help', why: 'Agencies and SBA fund coaching, Phase 0 programs and local partners that help first-time applicants. See which ones fit you.', link: 'help?stage=propose', area: 'funding', urgency: 'soon' });

  // Next open user tasks (respecting dependencies)
  const doneIds = new Set(b.tasks.filter(t => t.status === 'done').map(t => t.id));
  const ready = openTasks.filter(t => t.status !== 'blocked' && (!t.depends_on || doneIds.has(t.depends_on)));
  for (const t of ready.slice(0, 3)) {
    if (!actions.some(a => a.title.toLowerCase() === t.title.toLowerCase())) add({ title: t.title, why: t.due_date ? `Task due ${t.due_date}` : 'Open task on your list', link: `projects/${pid}?tab=tasks`, area: t.area, urgency: (daysUntil(t.due_date) ?? 99) <= 7 ? 'now' : 'later' });
  }
  const rank = { now: 0, soon: 1, later: 2 };
  actions.sort((a, b2) => rank[a.urgency] - rank[b2.urgency]);
  return { actions, deadlines, blockers };
}
