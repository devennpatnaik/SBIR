/** Structured offline guidance when no LLM API key is configured. */

export type OfflineTopic =
  | 'sbir'
  | 'licensing'
  | 'diligence'
  | 'layer4'
  | 'patents'
  | 'customers'
  | 'next'
  | 'general';

export function detectTopic(text: string): OfflineTopic {
  const t = text.toLowerCase();
  if (/sbir|sttr|phase\s*[i1]|solicitation|agency\s*topic/.test(t)) return 'sbir';
  if (/licen[cs]|tto|bayh|evaluation\s*rights|ip\s*owner|patent\s*license/.test(t)) return 'licensing';
  if (/due\s*diligence|diligence|trl|technical\s*risk|validate|bench\s*test/.test(t)) return 'diligence';
  if (/what\s*happened|layer\s*4|outcome|cohort|learning|feedback/.test(t)) return 'layer4';
  if (/patent|assignee|google\s*patents|freedom\s*to\s*operate|fto/.test(t)) return 'patents';
  if (/customer|interview|pilot|buyer|willingness\s*to\s*pay/.test(t)) return 'customers';
  if (/next\s*(step|action|move)|what\s*should\s*i\s*do|priority/.test(t)) return 'next';
  return 'general';
}

function banner(): string {
  return [
    '> **Offline guide** — no language-model API key is configured.',
    '> Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` for live model answers.',
    '> Claims below are **sourced** process guidance or **hypothesis** checklists — not verified facts about your technology.',
    '',
  ].join('\n');
}

function footer(): string {
  return [
    '',
    '---',
    '',
    '**Labels:** use *verified* / *sourced* / *estimate* / *hypothesis* in your own notes.',
    'Nothing here submits applications, signs agreements, or contacts labs for you.',
    'Useful in-app: **The SBIR path**, **Compare**, **What happened**, **What we learned**.',
  ].join('\n');
}

const GUIDES: Record<OfflineTopic, (q: string) => string> = {
  sbir: q => `${banner()}
## SBIR / STTR — practical next moves

You asked: *${clip(q)}*

### Checklist (do these in order)
1. **Confirm you need a U.S. small business** before award — formation, ownership, size, and PI rules are official and change; verify on current SBA / agency pages (**sourced** process).
2. **Find one live solicitation** on an official agency site (not a secondary aggregator alone). Save the topic number, close date, and whether the deadline is verified.
3. **Separate Phase I vs II vs III** — Phase I is feasibility; Phase II is not automatic; Phase III uses non-SBIR funds (**sourced** program structure).
4. **Map your technical objective** to the topic in plain English; mark every performance claim as *hypothesis* until you have data.
5. **List missing evidence** (IP rights, eligibility, budget basis, customer problem) before drafting.

### Single next action
Open **The SBIR path** in the app and complete the step that is still red or empty — usually “find an official solicitation” or “check company eligibility.”

### Avoid
- Invented award amounts or “guaranteed” Phase II.
- Submitting the HarborTrace **sample** proposal anywhere.
${footer()}`,

  licensing: q => `${banner()}
## Licensing & evaluation rights

You asked: *${clip(q)}*

### What to verify with the real IP owner
| Question | Why it matters |
|----------|----------------|
| Who owns the IP and can grant rights? | Chain of title / Bayh-Dole / lab authority |
| Is evaluation / option / commercial license available in your field? | Availability is not assumed |
| What diligence, fees, and reporting apply? | Budget and timeline |
| Can inventors support adaptation? | Technical risk |

### Single next action
Draft (but do not send until you have a real contact) a short inquiry: ownership, evaluation terms, field of use, fees. Use **Licensing** in the workspace; keep status as *investigating* until answered.

### Labels
Treat every “available for license” claim as **hypothesis** until the owner confirms in writing.
${footer()}`,

  diligence: q => `${banner()}
## Technical due diligence

You asked: *${clip(q)}*

### A minimal evidence pack
1. **Intended use** — one sentence; what it is *not* for.
2. **Performance gates** — measurable targets (accuracy, drift, environment) marked *estimate* until tested.
3. **Failure modes** — fouling, interference, supply, integration.
4. **Test plan** — what you will measure, with what reference method, in what matrix.
5. **Go / no-go** — what result would stop the project.

### Single next action
Write three go/no-go gates in a project note. If IP rights are unresolved, **block hardware work** until evaluation rights are clear (**hypothesis** until confirmed).
${footer()}`,

  layer4: q => `${banner()}
## Layer 4 — what happened & learning

You asked: *${clip(q)}*

### The five signals
1. Did the lab / owner respond?
2. Was a license available?
3. Did technical diligence pass?
4. Was an SBIR/STTR award confirmed?
5. Did customers show interest?

Answer only what you know. **Sample / demo technologies never enter the shared cohort.**

### How rankings move
Compare applies a small bounded nudge (−12…+12) only when **≥3** similar non-sample cases exist. Your base scores stay primary.

### Single next action
Open a real (non-sample) technology → **What happened**, or browse **What we learned** for anonymized counts.
${footer()}`,

  patents: q => `${banner()}
## Patents & ownership clues

You asked: *${clip(q)}*

### Practical approach
1. Search **Patents worldwide** with a tight query and a recent year cut-off.
2. Read the **listed assignee** only — do not invent owners from citations.
3. Treat listing text as **sourced** from the patent record; commercialization rights still need confirmation.
4. Pair patent leads with licensing diligence — a patent ≠ permission to sell.

### Single next action
Run one patent search from **Explore → Patents**, save promising assignees, then open licensing questions for any lead you shortlist.
${footer()}`,

  customers: q => `${banner()}
## Customer discovery

You asked: *${clip(q)}*

### Lightweight plan
1. Name the **buyer role** (who feels the pain and who signs).
2. Run **5 conversations** seeking disconfirming evidence, not pitches.
3. Separate *problem confirmed* from *pilot interest* from *willingness to pay*.
4. Log interviews in the project roadmap; never treat demo interviews as real evidence.

### Single next action
Write three interview questions and schedule (or simulate-and-replace) one conversation this week.
${footer()}`,

  next: q => `${banner()}
## Choosing one next action

You asked: *${clip(q)}*

Work top-down — stop at the first incomplete gate:

1. **Idea captured?** → Start / My plan  
2. **Technology shortlisted with honest scores?** → Compare  
3. **IP / evaluation path clear?** → Licensing  
4. **Funding path chosen with a real solicitation?** → SBIR path or Funding  
5. **Outcomes logged after real contact?** → What happened  

### Heuristic
If rights and eligibility are unknown, **do not** optimize the proposal draft first. Clarify the blocker, then draft.

### Offline tip
Create the **Demo company** to practice the full loop with clearly labeled sample data, then start your own project.
${footer()}`,

  general: q => `${banner()}
## Lab to Market guide (offline)

You asked: *${clip(q) || '(general orientation)'}*

I can help without a cloud model by pointing you to structured steps:

| Goal | Where in the app |
|------|------------------|
| Federal R&D funding path | **The SBIR path** |
| Find inventions / patents | **Explore** |
| Rank options honestly | **Compare** |
| Rights & outreach | **Licensing** |
| Record real outcomes | **What happened** |
| See anonymized evidence | **What we learned** |
| Practice safely | **Demo company** |

Ask a more specific question (SBIR, licensing, diligence, customers, patents, or “what’s my next step?”) for a tailored checklist.

When you add an API key, Ask a guide can draft from your project context with a live model.
${footer()}`,
};

function clip(q: string): string {
  const cleaned = q.replace(/^\[App context:[^\]]*\]\s*/i, '').replace(/\s+/g, ' ').trim();
  return cleaned.length > 220 ? `${cleaned.slice(0, 220)}…` : cleaned;
}

export type GuideTrack = 'sbir' | 'patents';

/** Pull track=sbir|patents from the app context prefix the client sends. */
export function detectTrack(text: string): GuideTrack | null {
  const m = text.match(/\[App context:[^\]]*track=(sbir|patents)/i);
  return m ? (m[1].toLowerCase() as GuideTrack) : null;
}

function patentsTrackReply(userText: string): string {
  const q = clip(userText);
  const topic = detectTopic(userText);
  if (topic === 'sbir' || topic === 'licensing' || topic === 'customers') {
    return `${banner()}
## Worldwide patents track — discovery only

You asked: *${q}*

You are on the **worldwide patents** track. This experience is for finding and shortlisting patents that may not be commercialized yet. It does **not** include SBIR process coaching or commercialization handholding.

### Stay on-track
1. Run a tight search in **Patents**.
2. Read assignee / status from the record only (**sourced**).
3. Shortlist leads; add light notes if useful.
4. Treat “available to commercialize” as **hypothesis** until the owner confirms.

### If you need SBIR coaching
Switch to the **SBIR route** from the track banner — that track is for government R&D and SBIR/STTR process steps.

${footer().replace('**The SBIR path**, **Compare**, **What happened**, **What we learned**.', '**Patent search**, **Shortlist**, **Compare** (light). Switch tracks for SBIR coaching.')}
`;
  }
  if (topic === 'patents' || topic === 'general' || topic === 'next') {
    return `${banner()}
## Patent discovery (Track B)

You asked: *${q}*

### Checklist
1. Search with a specific technical phrase + country/office filter.
2. Prefer recent grants / applications with a clear assignee.
3. Shortlist only what you will actually inspect.
4. Optional: log a one-line note on why it matters — not an SBIR plan.

### Single next action
Run one search from **Patents**, save at most three leads, then open each record and write what is still unknown (owner contact, product status).

### Avoid
- Treating patent hits as SBIR-eligible.
- Drafting proposals or agency funding plans on this track.

${footer().replace('**The SBIR path**, **Compare**, **What happened**, **What we learned**.', '**Patent search** and **Shortlist**. Use **Switch to SBIR route** for federal funding coaching.')}
`;
  }
  return GUIDES[topic](userText);
}

function stripAppContext(text: string): string {
  return text.replace(/^\[App context:[^\]]*\]\s*/i, '').trim();
}

export function offlineGuideReply(userText: string): string {
  const track = detectTrack(userText);
  const asked = stripAppContext(userText);
  if (track === 'patents') return patentsTrackReply(userText);
  // Topic detection must ignore the context prefix (it contains "track=sbir").
  const topic = detectTopic(asked || userText);
  if (track === 'sbir' && topic === 'general') {
    return `${banner()}
## SBIR route guide (offline)

You asked: *${clip(userText) || '(general orientation)'}*

You are on the **SBIR route** — government R&D that can feed SBIR/STTR, with process handholding.

| Goal | Where in the app |
|------|------------------|
| Process steps | **The SBIR path** |
| Federal / lab tech | **Gov R&D** |
| Funding | **SBIR & funding** |
| Rights follow-up | **Licensing** |
| Outcomes for SBIR | **What happened** |

Ask about SBIR eligibility, solicitations, licensing follow-ups, diligence, or your next process step.
${footer()}`;
  }
  return GUIDES[topic](userText);
}

/** Pathway job Markdown when offline — uses local project fields only. */
export function offlinePathwayDocument(input: {
  action: string;
  pathwayKey: string;
  projectName: string;
  thesis: string;
  problem: string;
  kickoff: Record<string, unknown> | null;
}): string {
  const idea = String(input.kickoff?.idea ?? input.problem ?? '').trim();
  const goal = String(input.kickoff?.goal ?? '').trim();
  const path = String(input.kickoff?.path ?? '').trim();
  const header = [
    `# ${input.pathwayKey} — ${input.action} (offline template)`,
    '',
    '> Generated without a language-model API key from your saved project fields.',
    '> Replace every *hypothesis* with verified facts before acting externally.',
    '',
    `**Project:** ${input.projectName || '(unnamed)'}`,
    input.thesis ? `**Thesis:** ${input.thesis}` : '',
    idea ? `**Idea / problem:** ${idea}` : '',
    goal ? `**Focus:** ${goal}` : '',
    path ? `**Intake path:** ${path}` : '',
    '',
  ]
    .filter(Boolean)
    .join('\n');

  if (input.action === 'research') {
    return `${header}
## Research brief

### What to verify first
1. Ownership / evaluation rights for any technology you intend to use (**hypothesis** until confirmed).
2. Whether a live, official solicitation or pathway still fits (**sourced** only from primary sites).
3. One measurable technical gate for the next 30–90 days (**estimate** until tested).

### Official sources to check
- Agency SBIR/STTR portals and current solicitations (if funding).
- University / lab technology-transfer pages (if licensing).
- USPTO / Google Patents for assignee clues (if exploring IP) — listings ≠ commercial rights.

### Gaps (fill these)
- [ ] Real counterparty contact
- [ ] Confirmed deadline (if any)
- [ ] Eligibility evidence
- [ ] Customer problem evidence beyond founder belief

### Single next action
${path === 'sbir' || input.pathwayKey.includes('sbir')
    ? 'Open **The SBIR path** and complete the first incomplete step with an official solicitation link.'
    : 'Open **Licensing** (or the active pathway) and write the one question that blocks progress.'}

### Labels used
All performance, market, and availability claims in this template are **hypothesis** until you attach evidence.
`;
  }

  if (input.action === 'draft') {
    return `${header}
## Working draft (editable)

### Outreach / inquiry outline
**Subject:** Request for evaluation terms — ${input.projectName || 'our project'}

Hello — we are exploring commercialization of a technology related to:
${idea || input.thesis || '[describe the problem and intended use]'}

Before we invest in adaptation work, could you help us understand:
1. Ownership and authority to grant evaluation or commercial rights
2. Whether our intended field of use is available
3. Typical evaluation / option terms and timelines
4. Whether technical discussion with inventors is possible

We are not requesting a commitment in this note.

### Application notes checklist
- [ ] Official solicitation saved (number, topic, close date)
- [ ] Eligibility self-check started (not finished)
- [ ] Technical objective in one paragraph
- [ ] Budget basis still *estimate*
- [ ] No sample/demo text left in a real submission

### Do not
Submit this draft, contact fictional demo addresses, or treat HarborTrace sample numbers as real.
`;
  }

  // review
  return `${header}
## Review notes

### Sequencing risks
1. **Rights before hardware** — building on unresolved IP is the most common stall.
2. **Solicitation before proposal polish** — a beautiful draft on a closed or mismatched topic wastes time.
3. **Customer evidence before market claims** — keep willingness-to-pay as *hypothesis*.

### Missing evidence (typical)
- Evaluation / license confirmation
- PI / company eligibility artifacts
- Raw test data vs narrative claims
- Real interviews (not demo personas)

### Recommended order
1. Clear the top blocker in **Licensing** or eligibility  
2. Lock one official solicitation or pathway decision  
3. Then refine the draft package  

### Status suggestion
Mark the workflow **done** for planning purposes only after you copy the single next action into a task with an owner and date.
`;
}
