/** Local record. One file on this machine. Nothing here is submitted or emailed. */

export type Rights = '' | 'not_needed' | 'asked' | 'available' | 'unavailable';
export type Company = '' | 'ready' | 'not_yet' | 'partner';
export type Award = '' | 'pending' | 'yes' | 'no';
export type YesLater = 'yes' | 'no' | 'later';
export type Route = '' | 'patents' | 'sbir';
export type SourceKind = '' | 'patent' | 'article';
export type Deal = '' | 'debt' | 'royalties' | 'equity';

export type Outreach = {
  kind: SourceKind;
  title: string;
  identifier: string;
  url: string;
  novelty: string;
  inventor: string;
  contact: string;
  contactSource: string;
  noContact: boolean;
  deal: Deal;
  terms: string;
  sentAt: string;
};

export type SbirWork = {
  version: 1;
  route: Route;
  outreaches: Outreach[];
  research: { name: string; idea: string; owner: string; source: string };
  skipped: { owner: boolean; source: boolean };
  rights: Rights;
  rightsNote: string;
  company: Company;
  registrations: { sam: boolean; sbirGov: boolean; portal: boolean };
  deferred: { sam: boolean; sbirGov: boolean; portal: boolean };
  topic: { agency: string; number: string; title: string; closes: string; url: string };
  phase1: {
    objective: string; plan: string; market: string; team: string; budget: string;
    submittedAt: string; ref: string; award: Award;
  };
  phase2: { plan: string; customers: string; submittedAt: string; ref: string; award: Award };
  phase3: { buyer: string; offer: string; money: string };
};

export type Patch = {
  name?: string;
  idea?: string;
  owner?: string;
  skipOwner?: boolean;
  source?: string;
  skipSource?: boolean;
  rights?: Rights;
  rightsNote?: string;
  company?: Company;
  sam?: YesLater;
  sbirRegistry?: YesLater;
  portal?: YesLater;
  agency?: string;
  number?: string;
  title?: string;
  closes?: string;
  url?: string;
  objective?: string;
  plan?: string;
  market?: string;
  team?: string;
  budget?: string;
  submitted?: boolean;
  ref?: string;
  award?: Award;
  phase2Plan?: string;
  phase2Customers?: string;
  phase2Submitted?: boolean;
  phase2Ref?: string;
  phase2Award?: Award;
  buyer?: string;
  offer?: string;
  money?: string;
  route?: Route;
  dropOutreach?: boolean;
  kind?: SourceKind;
  foundTitle?: string;
  identifier?: string;
  foundUrl?: string;
  novelty?: string;
  inventor?: string;
  contact?: string;
  contactSource?: string;
  noContact?: boolean;
  deal?: Deal;
  terms?: string;
  sent?: boolean;
};

export type Choice = { value: string; label: string };

export type Gate = {
  id: string;
  phase: 'I' | 'II' | 'III' | 'patent';
  title: string;
  prompt: string;
  kind: 'text' | 'choice' | 'ref' | 'stop' | 'wait' | 'done';
  optional?: boolean;
  choices?: Choice[];
};

const RIGHTS: Choice[] = [
  { value: 'not_needed', label: 'This is our own work. Nobody else has to grant permission.' },
  { value: 'asked', label: 'We still have to ask the owner.' },
  { value: 'available', label: 'The owner said the rights we need are available.' },
  { value: 'unavailable', label: 'The owner said no.' },
];

const COMPANY: Choice[] = [
  { value: 'ready', label: 'We have a for-profit U.S. small business. I will confirm the size and ownership rules myself.' },
  { value: 'not_yet', label: 'No company yet.' },
  { value: 'partner', label: 'We will partner with a research institution (that may be STTR, not SBIR).' },
];

const REG: Choice[] = [
  { value: 'yes', label: 'Done' },
  { value: 'no', label: 'Not yet' },
  { value: 'later', label: 'Not yet — keep going, and stop me before I record a submission' },
];

const AWARD: Choice[] = [
  { value: 'pending', label: 'Submitted. No official decision yet.' },
  { value: 'yes', label: 'Official notice says we were selected.' },
  { value: 'no', label: 'Official notice says we were not selected.' },
];

const ROUTE: Choice[] = [
  { value: 'patents', label: 'A patent or a new paper. Draft an offer to the inventor. I send the email myself.' },
  { value: 'sbir', label: 'Government technology, through SBIR. An agency pays a small business to do the R&D.' },
];

const SOURCE_KIND: Choice[] = [
  { value: 'patent', label: 'A patent' },
  { value: 'article', label: 'A research article, including PubMed' },
];

const DEAL: Choice[] = [
  { value: 'debt', label: 'Debt. The company borrows and repays.' },
  { value: 'royalties', label: 'Royalties. The inventor is paid a share of sales.' },
  { value: 'equity', label: 'Equity. The inventor owns a share of the company.' },
];

export function emptyOutreach(): Outreach {
  return {
    kind: '', title: '', identifier: '', url: '', novelty: '', inventor: '',
    contact: '', contactSource: '', noContact: false, deal: '', terms: '', sentAt: '',
  };
}

export function emptyWork(): SbirWork {
  return {
    version: 1,
    route: '',
    outreaches: [],
    research: { name: '', idea: '', owner: '', source: '' },
    skipped: { owner: false, source: false },
    rights: '',
    rightsNote: '',
    company: '',
    registrations: { sam: false, sbirGov: false, portal: false },
    deferred: { sam: false, sbirGov: false, portal: false },
    topic: { agency: '', number: '', title: '', closes: '', url: '' },
    phase1: { objective: '', plan: '', market: '', team: '', budget: '', submittedAt: '', ref: '', award: '' },
    phase2: { plan: '', customers: '', submittedAt: '', ref: '', award: '' },
    phase3: { buyer: '', offer: '', money: '' },
  };
}

function text(value: unknown, max: number, label: string): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${label} is too long (max ${max} characters).`);
  return trimmed;
}

export function normalize(raw: unknown): SbirWork {
  const base = emptyWork();
  if (!raw || typeof raw !== 'object') return base;
  const row = raw as Partial<SbirWork>;
  const research = row.research ?? base.research;
  const topic = row.topic ?? base.topic;
  const phase1 = row.phase1 ?? base.phase1;
  const phase2 = row.phase2 ?? base.phase2;
  const phase3 = row.phase3 ?? base.phase3;
  const registrations = row.registrations ?? base.registrations;
  const deferred = row.deferred ?? base.deferred;
  const skipped = row.skipped ?? base.skipped;
  const outreaches = Array.isArray(row.outreaches) ? row.outreaches.map(normalizeOutreach) : [];
  const named = {
    name: text(research.name, 200, 'Name'),
    idea: text(research.idea, 2000, 'Idea'),
    owner: text(research.owner, 200, 'Owner'),
    source: text(research.source, 500, 'Link'),
  };
  const routeGiven = Object.prototype.hasOwnProperty.call(row, 'route');
  const route: Route = row.route === 'patents' || row.route === 'sbir' ? row.route : '';
  const drafted: SbirWork = {
    version: 1,
    route,
    outreaches,
    research: named,
    skipped: { owner: Boolean(skipped.owner), source: Boolean(skipped.source) },
    rights: isRights(row.rights) ? row.rights : '',
    rightsNote: text(row.rightsNote, 2000, 'Rights note'),
    company: isCompany(row.company) ? row.company : '',
    registrations: {
      sam: Boolean(registrations.sam),
      sbirGov: Boolean(registrations.sbirGov),
      portal: Boolean(registrations.portal),
    },
    deferred: {
      sam: Boolean(deferred.sam),
      sbirGov: Boolean(deferred.sbirGov),
      portal: Boolean(deferred.portal),
    },
    topic: {
      agency: text(topic.agency, 80, 'Agency'),
      number: text(topic.number, 80, 'Number'),
      title: text(topic.title, 300, 'Title'),
      closes: text(topic.closes, 20, 'Close date'),
      url: text(topic.url, 500, 'URL'),
    },
    phase1: {
      objective: text(phase1.objective, 8000, 'Objective'),
      plan: text(phase1.plan, 8000, 'Work plan'),
      market: text(phase1.market, 8000, 'Customer'),
      team: text(phase1.team, 4000, 'Team'),
      budget: text(phase1.budget, 4000, 'Budget note'),
      submittedAt: text(phase1.submittedAt, 20, 'Submitted date'),
      ref: text(phase1.ref, 80, 'Tracking number'),
      award: isAward(phase1.award) ? phase1.award : '',
    },
    phase2: {
      plan: text(phase2.plan, 8000, 'Phase II plan'),
      customers: text(phase2.customers, 8000, 'Customers'),
      submittedAt: text(phase2.submittedAt, 20, 'Phase II date'),
      ref: text(phase2.ref, 80, 'Phase II tracking number'),
      award: isAward(phase2.award) ? phase2.award : '',
    },
    phase3: {
      buyer: text(phase3.buyer, 2000, 'Buyer'),
      offer: text(phase3.offer, 4000, 'Offer'),
      money: text(phase3.money, 2000, 'Money'),
    },
  };
  if (!routeGiven && sbirStarted(drafted)) drafted.route = 'sbir';
  return drafted;
}

function normalizeOutreach(raw: Partial<Outreach> | null): Outreach {
  const base = emptyOutreach();
  const row = raw ?? base;
  return {
    kind: row.kind === 'patent' || row.kind === 'article' ? row.kind : '',
    title: text(row.title, 300, 'Title'),
    identifier: text(row.identifier, 120, 'Identifier'),
    url: text(row.url, 500, 'Link'),
    novelty: text(row.novelty, 2000, 'What is new'),
    inventor: text(row.inventor, 200, 'Inventor'),
    contact: text(row.contact, 300, 'Contact'),
    contactSource: text(row.contactSource, 500, 'Contact page'),
    noContact: Boolean(row.noContact),
    deal: row.deal === 'debt' || row.deal === 'royalties' || row.deal === 'equity' ? row.deal : '',
    terms: text(row.terms, 4000, 'Terms'),
    sentAt: text(row.sentAt, 20, 'Sent date'),
  };
}

export function openOutreach(work: SbirWork): Outreach | undefined {
  return work.outreaches.find(item => !item.sentAt);
}

function sbirPatch(patch: Patch): boolean {
  return patch.name != null || patch.idea != null || patch.owner != null || patch.skipOwner === true || patch.source != null || patch.skipSource === true
    || patch.rights != null || patch.rightsNote != null || patch.company != null
    || patch.sam != null || patch.sbirRegistry != null || patch.portal != null
    || patch.agency != null || patch.number != null || patch.title != null || patch.closes != null || patch.url != null
    || patch.objective != null || patch.plan != null || patch.market != null || patch.team != null || patch.budget != null
    || patch.submitted === true || patch.ref != null || patch.award != null
    || patch.phase2Plan != null || patch.phase2Customers != null || patch.phase2Submitted === true || patch.phase2Ref != null || patch.phase2Award != null
    || patch.buyer != null || patch.offer != null || patch.money != null;
}

function sbirStarted(work: SbirWork): boolean {
  return Boolean(
    work.research.name || work.research.idea || work.research.owner || work.research.source
    || work.skipped.owner || work.skipped.source
    || work.rights || work.company
    || work.registrations.sam || work.registrations.sbirGov || work.registrations.portal
    || work.topic.agency || work.topic.number || work.topic.title || work.topic.closes || work.topic.url
    || work.phase1.objective || work.phase1.plan || work.phase1.market || work.phase1.team || work.phase1.budget
    || work.phase1.submittedAt || work.phase1.award
    || work.phase2.plan || work.phase2.customers || work.phase2.submittedAt || work.phase2.award
    || work.phase3.buyer || work.phase3.offer || work.phase3.money,
  );
}

function isRights(value: unknown): value is Rights {
  return value === '' || value === 'not_needed' || value === 'asked' || value === 'available' || value === 'unavailable';
}
function isCompany(value: unknown): value is Company {
  return value === '' || value === 'ready' || value === 'not_yet' || value === 'partner';
}
function isAward(value: unknown): value is Award {
  return value === '' || value === 'pending' || value === 'yes' || value === 'no';
}

export function isUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value);
}

export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day;
}

function today(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function clone(work: SbirWork): SbirWork {
  return normalize(JSON.parse(JSON.stringify(work)) as unknown);
}

function missingPackage(work: SbirWork): string | null {
  if (!work.research.name || !work.research.idea) return 'Name the research and what the company will do with it.';
  if (!work.rights || work.rights === 'unavailable') return 'Rights are unresolved. An owner who said no blocks a proposal on that research.';
  if (work.company !== 'ready' && work.company !== 'partner') return 'Record whether you have a U.S. small business, or a research partner.';
  if (!work.topic.agency || !work.topic.number || !work.topic.title || !work.topic.closes || !work.topic.url) {
    return 'Save the official solicitation: agency, number, title, close date, and URL.';
  }
  if (!work.phase1.objective || !work.phase1.plan || !work.phase1.market || !work.phase1.team || !work.phase1.budget) {
    return 'Finish the Phase I notes: objective, work plan, customer, team, and what the money pays for.';
  }
  if (!work.registrations.sam || !work.registrations.sbirGov || !work.registrations.portal) {
    return 'Registrations are still open: SAM.gov, the SBIR.gov company registry, and the agency portal.';
  }
  return null;
}

export type Applied = { work: SbirWork; note: string };

/** Apply whatever the user just typed. Rejects a submission the record cannot support. */
export function applyPatch(current: SbirWork, patch: Patch): Applied {
  const work = clone(current);
  const notes: string[] = [];

  if (patch.name != null) work.research.name = text(patch.name, 200, 'Name');
  if (patch.idea != null) work.research.idea = text(patch.idea, 2000, 'Idea');
  if (patch.skipOwner) {
    work.skipped.owner = true;
    if (!work.research.owner) work.research.owner = 'Own work';
  }
  if (patch.owner != null && patch.owner.trim()) {
    work.research.owner = text(patch.owner, 200, 'Owner');
    work.skipped.owner = false;
  }
  if (patch.skipSource) work.skipped.source = true;
  if (patch.source != null && patch.source.trim()) {
    const source = text(patch.source, 500, 'Link');
    if (!isUrl(source)) throw new Error('The link must start with http:// or https://.');
    work.research.source = source;
    work.skipped.source = false;
  }
  if (patch.rights != null) {
    if (!isRights(patch.rights) || !patch.rights) throw new Error('Rights must be not-needed, asked, available, or unavailable.');
    work.rights = patch.rights;
  }
  if (patch.rightsNote != null) work.rightsNote = text(patch.rightsNote, 2000, 'Rights note');
  if (patch.company != null) {
    if (!isCompany(patch.company) || !patch.company) throw new Error('Company must be ready, not-yet, or partner.');
    work.company = patch.company;
  }
  const reg = (key: 'sam' | 'sbirGov' | 'portal', value: YesLater | undefined) => {
    if (value == null) return;
    if (value !== 'yes' && value !== 'no' && value !== 'later') throw new Error('Registration answers are yes, no, or later.');
    work.registrations[key] = value === 'yes';
    work.deferred[key] = value === 'later';
  };
  reg('sam', patch.sam);
  reg('sbirGov', patch.sbirRegistry);
  reg('portal', patch.portal);

  const topicKeys = ['agency', 'number', 'title', 'closes', 'url'] as const;
  let topicTouched = false;
  for (const key of topicKeys) {
    if (patch[key] != null) topicTouched = true;
  }
  if (patch.agency != null) work.topic.agency = text(patch.agency, 80, 'Agency');
  if (patch.number != null) work.topic.number = text(patch.number, 80, 'Number');
  if (patch.title != null) work.topic.title = text(patch.title, 300, 'Title');
  if (patch.closes != null) {
    const closes = text(patch.closes, 20, 'Close date');
    if (closes && !isDate(closes)) throw new Error('Close date must be YYYY-MM-DD, copied from the official notice.');
    work.topic.closes = closes;
  }
  if (patch.url != null) {
    const url = text(patch.url, 500, 'URL');
    if (url && !isUrl(url)) throw new Error('The solicitation URL must start with http:// or https://.');
    if (url && url !== current.topic.url && current.phase1.submittedAt) {
      work.phase1.submittedAt = '';
      work.phase1.ref = '';
      work.phase1.award = '';
      work.phase2.submittedAt = '';
      work.phase2.ref = '';
      work.phase2.award = '';
      if (patch.agency == null) work.topic.agency = '';
      if (patch.number == null) work.topic.number = '';
      if (patch.title == null) work.topic.title = '';
      if (patch.closes == null) work.topic.closes = '';
      notes.push('The solicitation link changed, so the old submission record was cleared. Copy the new notice in full. Your Phase I writing is still here.');
    }
    work.topic.url = url;
  }
  if (topicTouched && work.topic.url && !isUrl(work.topic.url)) throw new Error('The solicitation URL must start with http:// or https://.');
  if (work.topic.closes && !isDate(work.topic.closes)) throw new Error('Close date must be YYYY-MM-DD, copied from the official notice.');

  if (patch.objective != null) work.phase1.objective = text(patch.objective, 8000, 'Objective');
  if (patch.plan != null) work.phase1.plan = text(patch.plan, 8000, 'Work plan');
  if (patch.market != null) work.phase1.market = text(patch.market, 8000, 'Customer');
  if (patch.team != null) work.phase1.team = text(patch.team, 4000, 'Team');
  if (patch.budget != null) work.phase1.budget = text(patch.budget, 4000, 'Budget note');

  if (patch.submitted) {
    const problem = missingPackage(work);
    if (problem) throw new Error(`Not ready to record a Phase I submission. ${problem}`);
    const ref = text(patch.ref, 80, 'Tracking number');
    if (!ref) throw new Error('Record the tracking number from the submission you made yourself.');
    work.phase1.submittedAt = work.phase1.submittedAt || today();
    work.phase1.ref = ref;
  }
  if (patch.award != null) {
    if (!isAward(patch.award) || !patch.award) throw new Error('Award must be pending, yes, or no.');
    if (!work.phase1.submittedAt) throw new Error('Record your Phase I submission before the decision.');
    work.phase1.award = patch.award;
  }

  if (patch.phase2Plan != null) work.phase2.plan = text(patch.phase2Plan, 8000, 'Phase II plan');
  if (patch.phase2Customers != null) work.phase2.customers = text(patch.phase2Customers, 8000, 'Customers');
  if (patch.phase2Submitted) {
    if (work.phase1.award !== 'yes') throw new Error('Phase II comes after an official Phase I selection. Record that notice first.');
    if (!work.phase2.plan.trim() || !work.phase2.customers.trim()) throw new Error('Write the Phase II plan and the customer evidence before recording a submission.');
    const ref = text(patch.phase2Ref, 80, 'Phase II tracking number');
    if (!ref) throw new Error('Record the Phase II tracking number from the submission you made yourself.');
    work.phase2.submittedAt = work.phase2.submittedAt || today();
    work.phase2.ref = ref;
  }
  if (patch.phase2Award != null) {
    if (!isAward(patch.phase2Award) || !patch.phase2Award) throw new Error('Phase II award must be pending, yes, or no.');
    if (!work.phase2.submittedAt) throw new Error('Record your Phase II submission before the decision.');
    work.phase2.award = patch.phase2Award;
  }

  if (patch.buyer != null) work.phase3.buyer = text(patch.buyer, 2000, 'Buyer');
  if (patch.offer != null) work.phase3.offer = text(patch.offer, 4000, 'Offer');
  if (patch.money != null) work.phase3.money = text(patch.money, 2000, 'Money');

  if (patch.dropOutreach) {
    const index = work.outreaches.findIndex(item => !item.sentAt);
    if (index < 0) throw new Error('There is no open patent or article to leave.');
    work.outreaches.splice(index, 1);
    work.route = '';
  }
  if (patch.route != null) {
    if (patch.route !== 'patents' && patch.route !== 'sbir') throw new Error('Route must be patents or sbir.');
    work.route = patch.route;
    if (patch.route === 'patents' && !openOutreach(work)) work.outreaches.push(emptyOutreach());
  } else if (!work.route && sbirPatch(patch)) {
    work.route = 'sbir';
  }

  const patentTouched = patch.kind != null || patch.foundTitle != null || patch.identifier != null
    || patch.foundUrl != null || patch.novelty != null || patch.inventor != null
    || patch.contact != null || patch.contactSource != null || patch.noContact || patch.deal != null || patch.terms != null;
  if (patentTouched || patch.sent) {
    const open = openOutreach(work);
    if (!open) throw new Error('Choose the patent route first.');
    if (patch.noContact) {
      open.noContact = true;
      open.contact = '';
      open.contactSource = '';
    }
    if (patch.kind != null) {
      if (patch.kind !== 'patent' && patch.kind !== 'article') throw new Error('Kind must be patent or article.');
      open.kind = patch.kind;
    }
    if (patch.foundTitle != null) open.title = text(patch.foundTitle, 300, 'Title');
    if (patch.identifier != null) open.identifier = text(patch.identifier, 120, 'Identifier');
    if (patch.foundUrl != null) {
      const url = text(patch.foundUrl, 500, 'Link');
      if (url && !isUrl(url)) throw new Error('The patent or article link must start with http:// or https://.');
      open.url = url;
    }
    if (patch.novelty != null) open.novelty = text(patch.novelty, 2000, 'What is new');
    if (patch.inventor != null) open.inventor = text(patch.inventor, 200, 'Inventor');
    if (patch.deal != null) {
      if (patch.deal !== 'debt' && patch.deal !== 'royalties' && patch.deal !== 'equity') throw new Error('Deal must be debt, royalties, or equity.');
      open.deal = patch.deal;
    }
    if (patch.terms != null) open.terms = text(patch.terms, 4000, 'Terms');
    if (patch.contact != null && patch.contact.trim()) {
      const contact = text(patch.contact, 300, 'Contact');
      rejectPlaceholderContact(contact);
      open.contact = contact;
      open.noContact = false;
    }
    if (patch.contactSource != null && patch.contactSource.trim()) {
      const source = text(patch.contactSource, 500, 'Contact page');
      if (!isUrl(source)) throw new Error('The contact page must start with http:// or https://.');
      rejectPlaceholderContact(source);
      open.contactSource = source;
    }
    if (patch.sent) {
      if (!open.contact || !open.contactSource) throw new Error('A sent email needs a public contact and the page where you found it. This program does not invent an address and does not send mail.');
      if (!open.deal || !open.terms.trim()) throw new Error('Write the deal and the terms before you record that you sent the email.');
      if (!open.title || !open.identifier || !open.url || !open.inventor) throw new Error('The draft is missing the work, the inventor, or the link.');
      open.sentAt = open.sentAt || today();
      open.noContact = false;
      work.route = '';
      notes.push('You recorded that you sent the email. This program did not send it.');
    }
  }

  return { work, note: notes.join(' ') };
}

function rejectPlaceholderContact(value: string): void {
  const lower = value.toLowerCase();
  if (lower.includes('example.com') || lower.includes('example.org') || lower.includes('@example.') || /^(todo|tbd|n\/a|none|unknown|email)$/i.test(value.trim())) {
    throw new Error('That contact looks like a placeholder. Copy a public address from a real page, or record that none was found.');
  }
  if (!value.includes('://') && !/@/.test(value) && !/\d/.test(value)) {
    throw new Error('A contact is an email or a street address, copied from a page. A name alone is not a contact.');
  }
}

function regGate(id: string, title: string, prompt: string): Gate {
  return { id, phase: 'I', title, prompt, kind: 'choice', choices: REG };
}

function routeGate(work: SbirWork): Gate {
  const last = [...work.outreaches].reverse().find(item => item.sentAt);
  const prompt = last
    ? `You recorded that you sent the note about ${last.title || 'that work'} to ${last.inventor || 'the inventor'}. This program did not send it. What next?`
    : 'Two ways to start from this phone. Which one now?';
  return { id: 'route', phase: 'I', title: 'Choose a route', prompt, kind: 'choice', choices: ROUTE };
}

function patentGate(item: Outreach): Gate {
  if (!item.kind) {
    return { id: 'sourceKind', phase: 'patent', title: 'Find something new', prompt: 'Is this a patent, or a research article?', kind: 'choice', choices: SOURCE_KIND };
  }
  const record = item.kind === 'article' ? 'article' : 'patent';
  if (!item.title) return { id: 'foundTitle', phase: 'patent', title: 'Find something new', prompt: `${record === 'article' ? 'Article' : 'Patent'} title, copied from the record.`, kind: 'text' };
  if (!item.identifier) {
    return {
      id: 'identifier', phase: 'patent', title: 'Find something new', kind: 'text',
      prompt: record === 'article' ? 'PMID or DOI, copied from the article.' : 'Patent number, copied from the record.',
    };
  }
  if (!item.url) return { id: 'foundUrl', phase: 'patent', title: 'Find something new', prompt: 'Link to that patent or article. It must start with https://.', kind: 'text' };
  if (!item.novelty) return { id: 'novelty', phase: 'patent', title: 'What is new', prompt: 'What is new about it, in your words? One or two sentences. Mark a guess as a guess.', kind: 'text' };
  if (!item.inventor) {
    return {
      id: 'inventor', phase: 'patent', title: 'Who made it', kind: 'text',
      prompt: record === 'article' ? 'Corresponding author, copied from the article.' : 'Inventor, copied from the patent.',
    };
  }
  if (!item.deal) return { id: 'deal', phase: 'patent', title: 'The offer', prompt: 'What kind of deal are you offering? You will write the terms next. Do not invent an amount.', kind: 'choice', choices: DEAL };
  if (!item.terms.trim()) return { id: 'terms', phase: 'patent', title: 'The offer', prompt: 'Write the terms in your own words. Include a number only if you mean that number. This is not a signed agreement.', kind: 'text' };
  if (!item.contact) {
    return {
      id: 'contact', phase: 'patent', title: 'How to reach them', kind: 'text',
      prompt: item.noContact
        ? 'No public contact is saved. Paste an email or a street address from a page that names this person, or leave this one and choose again. This program does not invent an address.'
        : 'What public email or street address should the note use? Copy it from a page that names this person. Press enter if you cannot find one.',
    };
  }
  if (!item.contactSource) return { id: 'contactSource', phase: 'patent', title: 'Where you found them', prompt: 'Paste the link to the page where that contact is published. It must start with https://.', kind: 'text' };
  return {
    id: 'send', phase: 'patent', title: 'Send it yourself', kind: 'ref',
    prompt: `The draft to ${item.inventor} is saved. If you already sent that email yourself, type yes. Press enter if you have not. This program does not send it.`,
  };
}

export function nextGate(work: SbirWork): Gate {
  if (work.route === 'patents') {
    const open = openOutreach(work);
    if (open) return patentGate(open);
    return routeGate(work);
  }
  if (work.route === 'sbir') return sbirNext(work);
  return routeGate(work);
}

function sbirNext(work: SbirWork): Gate {
  if (!work.research.name.trim()) {
    return { id: 'name', phase: 'I', title: 'Pick the research', prompt: 'What is the research or technology called?', kind: 'text' };
  }
  if (!work.research.idea.trim()) {
    return { id: 'idea', phase: 'I', title: 'Pick the research', prompt: 'What will your company do with it? One or two sentences.', kind: 'text' };
  }
  if (!work.research.owner.trim() && !work.skipped.owner) {
    return { id: 'owner', phase: 'I', title: 'Who owns it', prompt: 'Who owns it? Press enter if this is your own work.', kind: 'text', optional: true };
  }
  if (!work.research.source.trim() && !work.skipped.source) {
    return { id: 'source', phase: 'I', title: 'Where you found it', prompt: 'Link to the listing, patent, or paper. Press enter to skip.', kind: 'text', optional: true };
  }
  if (!work.rights) {
    return { id: 'rights', phase: 'I', title: 'Rights', prompt: 'Can you use this research?', kind: 'choice', choices: RIGHTS };
  }
  if (work.rights === 'unavailable') {
    return {
      id: 'rights', phase: 'I', title: 'Rights are closed', kind: 'choice', choices: RIGHTS,
      prompt: 'The owner said no. Leave this until that changes, or pick a different answer if they opened a field of use. Do not write a proposal on a refused license.',
    };
  }
  if (!work.company) {
    return { id: 'company', phase: 'I', title: 'Company', prompt: 'Where does the company stand? This is your statement, not an eligibility decision.', kind: 'choice', choices: COMPANY };
  }
  if (work.company === 'not_yet') {
    return {
      id: 'company', phase: 'I', title: 'No company yet', kind: 'choice', choices: COMPANY,
      prompt: 'SBIR awards go to a for-profit U.S. small business. Form one, or record a research partner, then choose again.',
    };
  }
  if (!work.registrations.sam && !work.deferred.sam) {
    return regGate('sam', 'SAM.gov', 'Do you have a SAM.gov Unique Entity ID? https://sam.gov/');
  }
  if (!work.registrations.sbirGov && !work.deferred.sbirGov) {
    return regGate('sbirGov', 'SBIR.gov registry', 'Is the company in the SBA company registry on SBIR.gov? https://www.sbir.gov/about');
  }
  if (!work.registrations.portal && !work.deferred.portal) {
    return regGate('portal', 'Agency portal', 'Is the company registered in the agency submission portal named in the solicitation?');
  }
  if (!work.topic.agency) return { id: 'agency', phase: 'I', title: 'Find a topic', prompt: 'Which agency issued the solicitation? Copy it from the notice. For example DOE, NIH, NSF, or DoD.', kind: 'text' };
  if (!work.topic.number) return { id: 'number', phase: 'I', title: 'Find a topic', prompt: 'Solicitation or topic number, copied from the official notice.', kind: 'text' };
  if (!work.topic.title) return { id: 'title', phase: 'I', title: 'Find a topic', prompt: 'Topic title, copied from the official notice.', kind: 'text' };
  if (!work.topic.closes) return { id: 'closes', phase: 'I', title: 'Find a topic', prompt: 'Close date from the official notice, as YYYY-MM-DD.', kind: 'text' };
  if (!work.topic.url) return { id: 'url', phase: 'I', title: 'Find a topic', prompt: 'Official solicitation URL. It must start with https://.', kind: 'text' };
  if (!work.phase1.objective) return { id: 'objective', phase: 'I', title: 'Phase I — prove it can work', prompt: 'Technical objective for Phase I. A paragraph. Mark anything you have not measured as a guess.', kind: 'text' };
  if (!work.phase1.plan) return { id: 'plan', phase: 'I', title: 'Phase I — prove it can work', prompt: 'Work plan: what you will do in Phase I to test whether it works.', kind: 'text' };
  if (!work.phase1.market) return { id: 'market', phase: 'I', title: 'Phase I — prove it can work', prompt: 'Who has the problem, and why they would pay? Call this a hypothesis until a customer says it.', kind: 'text' };
  if (!work.phase1.team) return { id: 'team', phase: 'I', title: 'Phase I — prove it can work', prompt: 'Who does the research? For SBIR the principal investigator is normally employed by the company. You confirm that.', kind: 'text' };
  if (!work.phase1.budget) return { id: 'budget', phase: 'I', title: 'Phase I — prove it can work', prompt: 'What would the Phase I money pay for? Do not invent an award amount.', kind: 'text' };
  if (!work.registrations.sam) return regGate('sam', 'SAM.gov still open', 'SAM.gov is still open. A submission cannot be recorded until this is done. https://sam.gov/');
  if (!work.registrations.sbirGov) return regGate('sbirGov', 'SBIR.gov registry still open', 'The SBIR.gov company registry is still open. https://www.sbir.gov/about');
  if (!work.registrations.portal) return regGate('portal', 'Agency portal still open', 'The agency submission portal is still open.');
  if (!work.phase1.submittedAt) {
    return {
      id: 'submit1', phase: 'I', title: 'Phase I submission', kind: 'ref',
      prompt: 'If you already submitted this yourself, type the tracking number. Press enter if you have not.',
    };
  }
  if (!work.phase1.award) {
    return { id: 'award1', phase: 'I', title: 'Phase I decision', prompt: 'What did the official notice say?', kind: 'choice', choices: AWARD };
  }
  if (work.phase1.award === 'no') {
    return {
      id: 'url', phase: 'I', title: 'Phase I was not selected', kind: 'text',
      prompt: 'Do not start Phase II on a decline. Paste a different official solicitation URL, or q to stop.',
    };
  }
  if (!work.phase2.plan) {
    return {
      id: 'phase2plan', phase: 'II', title: 'Phase II — build and demonstrate',
      prompt: work.phase1.award === 'pending'
        ? 'Phase I is still pending. You can draft Phase II now. What will you build and demonstrate if Phase I is selected?'
        : 'What will you build and demonstrate in Phase II? Phase II is not automatic.',
      kind: 'text',
    };
  }
  if (!work.phase2.customers) {
    return { id: 'phase2customers', phase: 'II', title: 'Phase II customers', prompt: 'Who has shown interest in using the result? Name them, or write that you have no customer evidence yet.', kind: 'text' };
  }
  if (work.phase1.award === 'pending') {
    return {
      id: 'wait-award1', phase: 'I', title: 'Waiting on the Phase I notice', kind: 'wait',
      prompt: 'The Phase II draft is saved. When the official notice arrives: do --award yes, or do --award no. Pending is not a selection.',
    };
  }
  if (!work.phase2.submittedAt) {
    return { id: 'submit2', phase: 'II', title: 'Phase II submission', kind: 'ref', prompt: 'If you already submitted Phase II yourself, type the tracking number. Press enter if you have not.' };
  }
  if (!work.phase2.award) {
    return { id: 'award2', phase: 'II', title: 'Phase II decision', prompt: 'What did the official Phase II notice say?', kind: 'choice', choices: AWARD };
  }
  if (work.phase2.award === 'pending') {
    return { id: 'wait-award2', phase: 'II', title: 'Waiting on the Phase II notice', kind: 'wait', prompt: 'Record the official Phase II decision when it arrives: do --phase2-award yes, or do --phase2-award no.' };
  }
  if (!work.phase3.buyer) {
    return {
      id: 'buyer', phase: 'III', title: 'Phase III — sell it', kind: 'text',
      prompt: work.phase2.award === 'no'
        ? 'Phase II was not selected. If you still sell this, who pays? The money is not an SBIR award.'
        : 'Who pays after SBIR? Name the buyer. Phase III is not an SBIR award.',
    };
  }
  if (!work.phase3.offer) {
    return { id: 'offer', phase: 'III', title: 'Phase III — sell it', prompt: 'What are you selling them, in one paragraph?', kind: 'text' };
  }
  if (!work.phase3.money) {
    return { id: 'money', phase: 'III', title: 'Phase III — sell it', prompt: 'Where does that money come from? A contract, a purchase, or private capital — not the SBIR set-aside.', kind: 'text' };
  }
  return {
    id: 'done', phase: 'III', title: 'Recorded', kind: 'done',
    prompt: 'You have a research pick, a Phase I record, a Phase II record, and a Phase III buyer. This file is your record. It did not submit, sign, or send anything. A patent or a paper is the other route, whenever you want it.',
  };
}

export function where(work: SbirWork): { phase: 'I' | 'II' | 'III' | 'done' | 'choose' | 'patent'; heading: string } {
  const gate = nextGate(work);
  if (gate.id === 'route') return { phase: 'choose', heading: 'Choose a route. A patent or a new paper, or SBIR for government technology.' };
  if (gate.phase === 'patent') return { phase: 'patent', heading: 'Patents and new research. You find the record, you write the terms, and you send the email.' };
  if (gate.kind === 'done') return { phase: 'done', heading: 'Recorded through Phase III' };
  if (gate.phase === 'III') return { phase: 'III', heading: 'Phase III — Sell it. This money is not an SBIR award.' };
  if (work.phase1.award === 'pending') return { phase: 'I', heading: 'Phase I — Prove it can work. Decision still pending.' };
  if (work.phase1.award === 'no') return { phase: 'I', heading: 'Phase I — Not selected.' };
  if (gate.phase === 'II') return { phase: 'II', heading: 'Phase II — Build and demonstrate it. A Phase II award is not automatic.' };
  return { phase: 'I', heading: 'Phase I — Prove it can work.' };
}

export function renderStatus(work: SbirWork): string {
  const place = where(work);
  const gate = nextGate(work);
  const lines = [place.heading, ''];
  if (work.research.name) lines.push(work.research.name);
  if (work.research.idea) lines.push(work.research.idea);
  if (work.topic.number) lines.push(`${work.topic.agency} ${work.topic.number} · closes ${work.topic.closes || 'date not recorded'}`);
  const current = openOutreach(work);
  if (current?.title) lines.push(current.title);
  if (current?.inventor) lines.push(current.inventor);
  lines.push('');
  if (gate.kind === 'done' || gate.kind === 'stop' || gate.kind === 'wait') {
    lines.push(gate.title);
    lines.push(gate.prompt);
  } else {
    lines.push(`Next: ${gate.title}`);
    lines.push(gate.prompt);
    gate.choices?.forEach((choice, index) => lines.push(`  ${index + 1}  ${choice.label}`));
  }
  const open = [
    !work.registrations.sam ? 'SAM.gov' : '',
    !work.registrations.sbirGov ? 'SBIR.gov company registry' : '',
    !work.registrations.portal ? 'agency portal' : '',
  ].filter(Boolean);
  if (open.length && work.company && work.company !== 'not_yet' && work.rights && work.rights !== 'unavailable') {
    lines.push('');
    lines.push(`Still open before a submission can be recorded: ${open.join(', ')}.`);
  }
  lines.push('');
  lines.push('Nothing is emailed, submitted, signed, or sent for you.');
  return lines.join('\n');
}

function section(title: string, body: string): string {
  return `## ${title}\n\n${body.trim() || 'Not recorded yet.'}`;
}

export function phase1Draft(work: SbirWork): string {
  const topic = work.topic.url
    ? `${work.topic.agency} ${work.topic.number}\n${work.topic.title}\nCloses ${work.topic.closes}\n${work.topic.url}`
    : 'No official solicitation saved yet. Do not invent a deadline or an award amount.';
  const submitted = work.phase1.submittedAt
    ? `You recorded a submission on ${work.phase1.submittedAt}, tracking ${work.phase1.ref}. This program did not submit it.`
    : 'No submission recorded. This file is not an application.';
  return [
    `# Phase I working paper — ${work.research.name || 'Untitled'}`,
    '',
    '> Edit this into the solicitation\'s required format, then submit it yourself.',
    '> Claims you have not measured are guesses.',
    '',
    section('Research', `${work.research.name}\n\n${work.research.idea}\n\nOwner: ${work.research.owner || 'not recorded'}\nSource: ${work.research.source || 'not recorded'}`),
    '',
    section('Rights', `${work.rights || 'not recorded'}${work.rightsNote ? `\n\n${work.rightsNote}` : ''}`),
    '',
    section('Company, as you stated it', work.company || 'not recorded'),
    '',
    section('Registrations', [
      `SAM.gov: ${work.registrations.sam ? 'done' : 'open'}`,
      `SBIR.gov company registry: ${work.registrations.sbirGov ? 'done' : 'open'}`,
      `Agency portal: ${work.registrations.portal ? 'done' : 'open'}`,
    ].join('\n')),
    '',
    section('Solicitation', topic),
    '',
    section('Technical objective', work.phase1.objective),
    '',
    section('Work plan', work.phase1.plan),
    '',
    section('Customer', work.phase1.market),
    '',
    section('Team', work.phase1.team),
    '',
    section('What the money pays for', work.phase1.budget),
    '',
    section('Submission', `${submitted}\nDecision: ${work.phase1.award || 'not recorded'}`),
    '',
  ].join('\n');
}

export function phase2Draft(work: SbirWork): string {
  const submitted = work.phase2.submittedAt
    ? `You recorded a Phase II submission on ${work.phase2.submittedAt}, tracking ${work.phase2.ref}.`
    : 'No Phase II submission recorded.';
  return [
    `# Phase II working paper — ${work.research.name || 'Untitled'}`,
    '',
    '> Phase II is not automatic after Phase I. Submit it yourself if you are selected and you choose to apply.',
    '',
    section('Phase I decision', work.phase1.award || 'not recorded'),
    '',
    section('What you will build and demonstrate', work.phase2.plan),
    '',
    section('Customers', work.phase2.customers),
    '',
    section('Submission', `${submitted}\nDecision: ${work.phase2.award || 'not recorded'}`),
    '',
  ].join('\n');
}

export function phase3Draft(work: SbirWork): string {
  return [
    `# Phase III working paper — ${work.research.name || 'Untitled'}`,
    '',
    '> Phase III is not an SBIR award. A customer, a contract, or private capital pays. The SBIR set-aside does not.',
    '',
    section('Buyer', work.phase3.buyer),
    '',
    section('What you sell', work.phase3.offer),
    '',
    section('Where the money comes from', work.phase3.money),
    '',
  ].join('\n');
}

function dealLetter(item: Outreach): string {
  const terms = item.terms.trim() || 'I have not written the terms yet.';
  if (item.deal === 'debt') return `I want to build a company around this. The deal I can offer is debt: the company borrows and repays.\n\n${terms}`;
  if (item.deal === 'royalties') return `I want to build a company around this. The deal I can offer is a royalty: the company pays you a share of sales.\n\n${terms}`;
  if (item.deal === 'equity') return `I want to build a company around this. The deal I can offer is equity: you would own a share of the company.\n\n${terms}`;
  return 'I have not chosen debt, royalties, or equity yet.';
}

export function outreachDraft(item: Outreach): string {
  const dealLine = item.deal === 'debt'
    ? 'Debt. The company would borrow and repay. Any amount, rate, or schedule is only what is written under Terms.'
    : item.deal === 'royalties'
      ? 'Royalties. The inventor would be paid a share of sales. The share is only what is written under Terms.'
      : item.deal === 'equity'
        ? 'Equity. The inventor would own a share of the company. The share is only what is written under Terms.'
        : 'Not chosen yet.';
  const contact = item.contact || 'No public contact is recorded. Do not invent an email address.';
  const who = item.kind === 'article' ? 'Corresponding author' : 'Inventor';
  const subject = item.title ? `A proposal to commercialize ${item.title}` : 'A proposal to commercialize your work';
  const sent = item.sentAt
    ? `You recorded that you sent this on ${item.sentAt}. This program did not send it.`
    : 'This file was not emailed. You send it yourself.';
  return [
    `# Draft for ${item.inventor || 'the inventor'} — ${item.title || 'Untitled'}`,
    '',
    `> ${sent}`,
    '> Numbers appear only where you wrote them. This is not a signed agreement.',
    '',
    section('Who it is for', `${who}: ${item.inventor || 'not recorded'}\nContact: ${contact}\nFound at: ${item.contactSource || 'not recorded'}`),
    '',
    section('The work', [
      item.kind === 'article' ? 'Research article' : item.kind === 'patent' ? 'Patent' : 'Not recorded',
      item.identifier,
      item.title,
      item.url,
    ].filter(Boolean).join('\n')),
    '',
    section('What is new', item.novelty),
    '',
    section('Deal', dealLine),
    '',
    section('Terms you wrote', item.terms),
    '',
    section('Email to copy', [
      `To: ${item.contact || '(no public contact recorded)'}`,
      `Subject: ${subject}`,
      '',
      `Hello ${item.inventor || ''}`.trim() + ',',
      '',
      `I read ${item.title || 'your work'}${item.identifier ? ` (${item.identifier})` : ''}. ${item.novelty || ''}`.trim(),
      '',
      dealLetter(item),
      '',
      'If you want to talk, reply to this note. Nothing in it is a signed agreement.',
    ].join('\n')),
    '',
  ].join('\n');
}

const CHOICE_GATES: Record<string, Choice[]> = {
  route: ROUTE,
  sourceKind: SOURCE_KIND,
  deal: DEAL,
  rights: RIGHTS,
  company: COMPANY,
  sam: REG,
  sbirGov: REG,
  portal: REG,
  award1: AWARD,
  award2: AWARD,
};

export function parseGateAnswer(gate: Gate, line: string): Patch | 'quit' | 'pause' | 'again' {
  const raw = line.trim();
  if (raw === 'q' || raw === 'quit' || raw === 'exit') return 'quit';
  if (gate.kind === 'stop' || gate.kind === 'wait' || gate.kind === 'done') return raw ? 'again' : 'pause';
  if (gate.kind === 'ref') {
    if (!raw) return 'pause';
    if (gate.id === 'send') return raw.toLowerCase() === 'yes' ? { sent: true } : 'again';
    return gate.id === 'submit2' ? { phase2Submitted: true, phase2Ref: raw } : { submitted: true, ref: raw };
  }
  if (gate.kind === 'choice') {
    const choices = gate.choices ?? CHOICE_GATES[gate.id] ?? [];
    const index = Number(raw);
    const byNumber = Number.isInteger(index) ? choices[index - 1] : undefined;
    const byValue = choices.find(choice => choice.value === raw.replace(/-/g, '_'));
    const picked = byNumber ?? byValue;
    if (!picked) return 'again';
    return choicePatch(gate.id, picked.value);
  }
  if (!raw) {
    if (gate.id === 'owner') return { skipOwner: true };
    if (gate.id === 'source') return { skipSource: true };
    if (gate.id === 'contact') return { noContact: true };
    return 'again';
  }
  return textPatch(gate.id, raw);
}

function choicePatch(id: string, value: string): Patch {
  if (id === 'route') return { route: value as Route };
  if (id === 'sourceKind') return { kind: value as SourceKind };
  if (id === 'deal') return { deal: value as Deal };
  if (id === 'rights') return { rights: value as Rights };
  if (id === 'company') return { company: value as Company };
  if (id === 'sam') return { sam: value as YesLater };
  if (id === 'sbirGov') return { sbirRegistry: value as YesLater };
  if (id === 'portal') return { portal: value as YesLater };
  if (id === 'award1') return { award: value as Award };
  if (id === 'award2') return { phase2Award: value as Award };
  throw new Error('That answer does not fit this question.');
}

function textPatch(id: string, value: string): Patch {
  switch (id) {
    case 'name': return { name: value };
    case 'idea': return { idea: value };
    case 'owner': return { owner: value };
    case 'source': return { source: value };
    case 'agency': return { agency: value };
    case 'number': return { number: value };
    case 'title': return { title: value };
    case 'closes': return { closes: value };
    case 'url': return { url: value };
    case 'objective': return { objective: value };
    case 'plan': return { plan: value };
    case 'market': return { market: value };
    case 'team': return { team: value };
    case 'budget': return { budget: value };
    case 'phase2plan': return { phase2Plan: value };
    case 'phase2customers': return { phase2Customers: value };
    case 'buyer': return { buyer: value };
    case 'offer': return { offer: value };
    case 'money': return { money: value };
    case 'foundTitle': return { foundTitle: value };
    case 'identifier': return { identifier: value };
    case 'foundUrl': return { foundUrl: value };
    case 'novelty': return { novelty: value };
    case 'inventor': return { inventor: value };
    case 'terms': return { terms: value };
    case 'contact': return { contact: value };
    case 'contactSource': return { contactSource: value };
    default: throw new Error('That answer does not fit this question.');
  }
}
