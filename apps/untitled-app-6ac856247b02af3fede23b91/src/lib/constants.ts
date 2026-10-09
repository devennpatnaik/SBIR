export const PROJECT_STATUSES: { key: string; label: string; short: string }[] = [
  { key: 'technology_selected', label: 'Technology selected', short: 'Selected' },
  { key: 'validating_opportunity', label: 'Commercial opportunity being validated', short: 'Validating' },
  { key: 'investigating_licensing', label: 'Laboratory and licensing pathway being investigated', short: 'Licensing research' },
  { key: 'licensing_discussions', label: 'Licensing discussions underway', short: 'Licensing talks' },
  { key: 'agreement_in_progress', label: 'Commercialization agreement or license in progress', short: 'Agreement in progress' },
  { key: 'evaluating_funding', label: 'Funding opportunities being evaluated', short: 'Evaluating funding' },
  { key: 'proposal_in_preparation', label: 'SBIR/STTR proposal in preparation', short: 'Proposal prep' },
  { key: 'proposal_submitted', label: 'Proposal submitted', short: 'Submitted' },
  { key: 'funding_decision_pending', label: 'Funding decision pending', short: 'Decision pending' },
  { key: 'funded_development', label: 'Funded development and commercialization', short: 'Funded' },
  { key: 'product_validation', label: 'Commercial product validation', short: 'Product validation' },
  { key: 'ongoing_commercialization', label: 'Ongoing commercialization', short: 'Commercializing' },
];
export const statusLabel = (k: string) => PROJECT_STATUSES.find(s => s.key === k)?.label ?? k;
export const statusIndex = (k: string) => PROJECT_STATUSES.findIndex(s => s.key === k);
/** Statuses that assert a real-world event; changing to them requires explicit confirmation. */
export const CONFIRM_STATUSES = new Set(['proposal_submitted', 'funding_decision_pending', 'funded_development']);

export type Dimension = { key: string; label: string; help: string; weight: number; invert?: boolean };
export const DIMENSIONS: Dimension[] = [
  { key: 'problem', label: 'Commercial problem strength & urgency', help: 'Is there a painful, urgent problem someone already spends money or effort on? 5 = documented, urgent, costly problem.', weight: 15 },
  { key: 'market', label: 'Market size & accessibility', help: 'How many reachable buyers exist and can you actually get to them? 5 = large, identifiable, reachable segment.', weight: 10 },
  { key: 'wtp', label: 'Willingness to pay', help: 'Evidence buyers would pay (budgets, current spend, quotes from interviews). 5 = buyers have said they would pay.', weight: 12 },
  { key: 'advantage', label: 'Competitive advantage', help: 'Measurable improvement over existing products or approaches — not novelty. 5 = clear, quantified, defensible advantage.', weight: 12 },
  { key: 'maturity', label: 'Technical maturity & feasibility', help: 'How proven is it (TRL, prototypes, data)? 5 = working prototype in a relevant environment (TRL 6+).', weight: 10 },
  { key: 'licensing', label: 'Licensing accessibility & IP risk', help: 'Is it available to license, who owns it, how clean is the IP? 5 = verified available, clear ownership, issued patents.', weight: 12 },
  { key: 'sbir_fit', label: 'SBIR/STTR program fit', help: 'Do current agency topics match the technology and proposed product? 5 = specific open topic closely matches.', weight: 8 },
  { key: 'time_cost', label: 'Time & cost to marketable product', help: 'Higher score = faster and cheaper. 5 = product in <18 months on SBIR-scale budget; 1 = many years / large capital.', weight: 8 },
  { key: 'partners', label: 'Customers & partners available', help: 'Are pilot customers, distributors, or manufacturing partners identifiable? 5 = named partners interested.', weight: 6 },
  { key: 'growth', label: 'Recurring revenue & growth potential', help: 'Can this become a repeatable, growing business? 5 = recurring revenue model and multiple follow-on markets.', weight: 7 },
];
export const defaultWeights = (): Record<string, number> => Object.fromEntries(DIMENSIONS.map(d => [d.key, d.weight]));

export const TECH_LICENSING_STATUS: Record<string, string> = {
  unknown: 'Unknown',
  available_unverified: 'Listed as available (not yet confirmed with lab)',
  available_verified: 'Available — confirmed by lab',
  partially_licensed: 'Licensed in some fields of use',
  licensed: 'Already licensed',
  not_available: 'Not available',
};
export const PROJECT_LICENSING_STATUS: Record<string, string> = {
  not_started: 'Not started', researching: 'Researching', contacted_tto: 'Contacted tech-transfer office', in_discussion: 'In discussion',
  application_submitted: 'License application submitted (confirmed by you)', negotiating: 'Negotiating terms',
  license_signed_confirmed: 'License/agreement signed (confirmed by you)', not_available: 'Not available',
};
export const PATHWAYS: Record<string, { label: string; plain: string }> = {
  undecided: { label: 'Undecided', plain: 'You have not chosen a pathway yet.' },
  evaluation_license: { label: 'Evaluation license', plain: 'A short, low-cost license to test the technology before committing. Usually no right to sell products.' },
  option: { label: 'Option agreement', plain: 'Pays to reserve the right to take a license later (often 6–12 months) while you validate the market or seek funding.' },
  nonexclusive_license: { label: 'Non-exclusive license', plain: 'Right to use the patents, but the lab may license others too. Usually cheaper and faster.' },
  exclusive_license: { label: 'Exclusive license', plain: 'Only you may use the patents in a defined field of use/territory. Usually requires a commercialization plan and diligence milestones.' },
  crada: { label: 'CRADA', plain: 'Cooperative Research and Development Agreement: you and the lab do joint R&D. It is a research agreement, not a license, though it can include license options.' },
  other: { label: 'Other arrangement', plain: 'e.g. Strategic Partnership Project (DOE), Work-for-Others, Technical Services Agreement, Material Transfer Agreement.' },
};
export const AGREEMENT_STATUS: Record<string, string> = {
  considering: 'Considering', requested: 'Requested', application_submitted: 'Application submitted', negotiating: 'Negotiating',
  executed_confirmed: 'Executed (you confirmed)', declined: 'Declined', abandoned: 'Abandoned',
};

export const LICENSING_TOPICS: { topic: string; question: string; explainer: string }[] = [
  { topic: 'patent_status', question: 'Is the technology patented, patent-pending, or unpatented know-how?', explainer: 'Issued patents have enforceable claims; a pending application may still change or be rejected. Check the patent number at the USPTO (ppubs.uspto.gov) or Google Patents and note the status and expiry date.' },
  { topic: 'ownership', question: 'Who owns the intellectual property — the lab, the contractor operating it, a university, or a co-owner?', explainer: 'Government-owned, contractor-operated labs (most DOE labs) often have the operating contractor own and license the IP. Co-owned patents may need agreement from every owner.' },
  { topic: 'availability', question: 'Is it already licensed? In which fields of use?', explainer: 'A "field of use" limits a license to an application area (e.g. medical vs. industrial). A technology licensed in one field may still be available in yours.' },
  { topic: 'exclusivity', question: 'Is an exclusive or non-exclusive license possible for my intended field of use?', explainer: 'Exclusive licenses of federally owned inventions generally require public notice and a commercialization plan (37 CFR Part 404). Ask the office what applies.' },
  { topic: 'agreement_types', question: 'Which agreements does this lab offer (evaluation license, option, commercial license, CRADA, other)?', explainer: 'Labs differ. Many have startup-friendly programs or standard agreements. Treat this as a question for the office, not an assumption.' },
  { topic: 'technical_assistance', question: 'Can I get technical assistance, inventor time, or lab facilities?', explainer: 'Options may include CRADAs, technical assistance programs, or SBIR/STTR subcontracts to the lab. Ask what is available and what it costs.' },
  { topic: 'terms', question: 'What are typical costs and terms (upfront fee, royalties, minimums, patent cost reimbursement, diligence milestones)?', explainer: 'Royalties are a percentage of sales; minimum annual royalties apply even without sales; diligence milestones are commitments you must meet to keep the license.' },
  { topic: 'best_fit', question: 'Which arrangement best fits my commercialization and funding plan?', explainer: 'Some SBIR/STTR solicitations and reviewers look for evidence of IP access (e.g. a letter of support or an option). Confirm timing with the lab and the solicitation.' },
];

export const PROPOSAL_TEMPLATE: { title: string; kind: string; guidance: string }[] = [
  { title: 'Technical problem and proposed solution', kind: 'section', guidance: 'State the problem in the topic\'s own terms and how the licensed technology solves it.' },
  { title: 'Innovation and competitive advantage', kind: 'section', guidance: 'What is new versus the state of the art, with quantified comparisons where you have evidence.' },
  { title: 'Research objectives and technical milestones', kind: 'section', guidance: 'Specific, measurable Phase I objectives tied to the topic\'s stated goals.' },
  { title: 'Technical feasibility and preliminary evidence', kind: 'section', guidance: 'Cite lab data, publications, and patents. Do not present generated text as evidence.' },
  { title: 'Commercial applications and customer demand', kind: 'section', guidance: 'Use customer-discovery interviews and letters of support.' },
  { title: 'Market and competition', kind: 'section', guidance: 'Market sizing with sources; competing products and approaches.' },
  { title: 'Development and commercialization strategy', kind: 'section', guidance: 'Path from Phase I to Phase II to product; licensing status; funding beyond SBIR.' },
  { title: 'Project team and relevant expertise', kind: 'section', guidance: 'PI eligibility (check the solicitation\'s PI employment rules), key personnel, consultants.' },
  { title: 'Budget and justification', kind: 'document', guidance: 'Follow the solicitation\'s maximum award, cost categories, and subcontract limits.' },
  { title: 'Company information, registrations and certifications', kind: 'certification', guidance: 'Commonly SAM.gov UEI, SBIR.gov company registry (SBC control ID), agency portal account, ownership/size certifications. Confirm against the solicitation.' },
  { title: 'Research partners and subcontractors', kind: 'section', guidance: 'For STTR: research-institution partner, cooperative agreement / IP allocation agreement, and work split.' },
  { title: 'Letters of support / IP access evidence', kind: 'evidence', guidance: 'Letters from customers, partners, and (if applicable) the lab regarding license availability.' },
];

export const ROADMAP_CATEGORIES: { key: string; label: string }[] = [
  { key: 'customer_discovery', label: 'Customer discovery' },
  { key: 'demand_evidence', label: 'Evidence of customer demand' },
  { key: 'prototype', label: 'Prototype development' },
  { key: 'technical_performance', label: 'Technical performance milestones' },
  { key: 'ip_licensing', label: 'IP & licensing milestones' },
  { key: 'regulatory', label: 'Regulatory / certification' },
  { key: 'pilots', label: 'Pilot customers' },
  { key: 'manufacturing', label: 'Manufacturing / deployment' },
  { key: 'partners', label: 'Strategic partners' },
  { key: 'phase2', label: 'Phase II funding' },
  { key: 'phase3', label: 'Phase III / other channels' },
  { key: 'revenue', label: 'Revenue & customer acquisition' },
];
export const roadmapLabel = (k: string) => ROADMAP_CATEGORIES.find(c => c.key === k)?.label ?? k;

export const AREAS: Record<string, string> = {
  general: 'General', validation: 'Market validation', licensing: 'Licensing', funding: 'Funding', proposal: 'Proposal', commercialization: 'Commercialization',
};
export const TASK_STATUS: Record<string, string> = { todo: 'To do', in_progress: 'In progress', blocked: 'Blocked', done: 'Done', skipped: 'Skipped' };

/** Starting checklist created with every new project. */
export const STARTER_TASKS: { title: string; area: string; description: string; priority: number }[] = [
  { title: 'Read the original listing and record the source text', area: 'validation', description: 'Keep the lab\'s own description separate from your summary.', priority: 1 },
  { title: 'Write a one-paragraph business thesis', area: 'validation', description: 'Who has the problem, what product you would sell them, and why this technology wins.', priority: 1 },
  { title: 'Identify the lab\'s technology-transfer office and a named contact', area: 'licensing', description: 'Find the office page and contact on the lab\'s own website; record the URL.', priority: 1 },
  { title: 'Verify patent status on the USPTO / Google Patents', area: 'licensing', description: 'Record patent numbers, status, assignee, and expiry.', priority: 1 },
  { title: 'Draft and send an introductory licensing inquiry', area: 'licensing', description: 'Use the Licensing page to draft it. You send it yourself.', priority: 1 },
  { title: 'Hold 5 customer-discovery interviews', area: 'validation', description: 'Log each one on the Roadmap page.', priority: 2 },
  { title: 'Find 2–3 candidate SBIR/STTR topics on official agency sites', area: 'funding', description: 'Save each with its official URL on the Funding page.', priority: 2 },
  { title: 'Confirm small-business eligibility (SBA size and ownership rules)', area: 'funding', description: 'See 13 CFR 121.702 and the solicitation\'s eligibility section.', priority: 2 },
  { title: 'Register the company in SAM.gov and the SBIR.gov company registry (if not done)', area: 'funding', description: 'Registration can take weeks; start before a deadline.', priority: 3 },
];

export const GLOSSARY: { term: string; plain: string }[] = [
  { term: 'TTO / ORTA', plain: 'Technology Transfer Office / Office of Research and Technology Applications — the lab office that licenses inventions.' },
  { term: 'TRL', plain: 'Technology Readiness Level, 1 (basic idea) to 9 (proven in real operations).' },
  { term: 'CRADA', plain: 'Cooperative Research and Development Agreement — a joint R&D agreement with a federal lab.' },
  { term: 'Field of use', plain: 'The application area a license covers (e.g. "medical imaging").' },
  { term: 'Option agreement', plain: 'A paid reservation of the right to license later.' },
  { term: 'SBIR', plain: 'Small Business Innovation Research — federal R&D funding for small businesses. The PI is normally employed primarily by the small business.' },
  { term: 'STTR', plain: 'Small Business Technology Transfer — like SBIR but requires a formal partnership with a research institution (university, FFRDC, or nonprofit lab). Federal rules set minimum work shares (generally ≥40% small business and ≥30% research institution); confirm in each solicitation.' },
  { term: 'Phase I / II / III', plain: 'Phase I = feasibility; Phase II = full R&D; Phase III = commercialization funded by non-SBIR money (government contracts or private). Phase III is never automatic.' },
  { term: 'UEI / SAM.gov', plain: 'Unique Entity ID from the System for Award Management — required to receive federal awards.' },
  { term: 'Bayh-Dole / 35 U.S.C. 209', plain: 'Laws governing how federally funded and federally owned inventions are licensed.' },
];

export const SOURCE_SITES = [
  { name: 'TechLink', url: 'https://techlinkcenter.org/technologies', note: 'DoD and VA lab technologies available to license.' },
  { name: 'DOE Lab Partnering Service', url: 'https://labpartnering.org/', note: 'DOE national-lab technologies and experts.' },
  { name: 'Federal Laboratory Consortium', url: 'https://federallabs.org/', note: 'Cross-agency directory of labs and available technologies.' },
];
export const FUNDING_SITES = [
  { name: 'SBIR.gov — topics & solicitations', url: 'https://www.sbir.gov/topics' },
  { name: 'DoD SBIR/STTR (DSIP)', url: 'https://www.dodsbirsttr.mil/topics-app/' },
  { name: 'DOE SBIR/STTR', url: 'https://science.osti.gov/sbir' },
  { name: 'NIH SBIR/STTR', url: 'https://seed.nih.gov/' },
  { name: 'NSF SBIR/STTR (America\'s Seed Fund)', url: 'https://seedfund.nsf.gov/' },
  { name: 'NASA SBIR/STTR', url: 'https://sbir.nasa.gov/' },
  { name: 'USDA SBIR', url: 'https://www.nifa.usda.gov/grants/programs/sbir-sttr' },
  { name: 'DHS SBIR', url: 'https://www.dhs.gov/science-and-technology/sbir' },
];
