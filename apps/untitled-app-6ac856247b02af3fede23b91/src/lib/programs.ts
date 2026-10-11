/**
 * Public support programs that take friction out of licensing federal-lab technology and applying for SBIR/STTR.
 *
 * Every entry was checked against its official page on CHECKED_ON. Facts are paraphrased from that page
 * (quoted where precise wording matters). Program rules, windows and contacts change — the UI always
 * links the official page and tells the user to confirm there before relying on anything here.
 * Nothing in this file is a promise of eligibility or acceptance.
 */

export const CHECKED_ON = '2026-10-11';

export type Stage = 'discover' | 'license' | 'propose' | 'awarded';
export const STAGE_LABEL: Record<Stage, string> = {
  discover: 'Finding a technology',
  license: 'Licensing',
  propose: 'Preparing a proposal',
  awarded: 'After an award',
};

export type Kind = 'proposal_help' | 'training' | 'licensing_help' | 'tech_search' | 'mentoring' | 'legal' | 'funding_help' | 'manufacturing' | 'fellowship';
export const KIND_LABEL: Record<Kind, string> = {
  proposal_help: 'Proposal coaching',
  training: 'Customer-discovery training',
  licensing_help: 'Licensing help',
  tech_search: 'Technology search',
  mentoring: 'Business mentoring',
  legal: 'Legal help',
  funding_help: 'Extra funding / support',
  manufacturing: 'Manufacturing help',
  fellowship: 'Paid fellowship',
};

export type Agency = 'NIH' | 'NSF' | 'DOE' | 'DoD' | 'NASA' | 'VA' | 'USDA' | 'NIST' | 'Other';
export const AGENCIES: Agency[] = ['NIH', 'NSF', 'DOE', 'DoD', 'NASA', 'VA', 'USDA', 'NIST', 'Other'];

export type Area = 'health' | 'cancer' | 'aging' | 'infectious' | 'energy' | 'defense' | 'space' | 'manufacturing' | 'software' | 'other';
export const AREA_LABEL: Record<Area, string> = {
  health: 'Health / medical', cancer: 'Cancer', aging: 'Healthy aging', infectious: 'Infectious disease / immunology',
  energy: 'Energy / climate', defense: 'Defense', space: 'Space / aerospace', manufacturing: 'Physical product to manufacture',
  software: 'Software / digital', other: 'Other',
};

/** Answers to the "what help fits me" questions, saved in user_settings.help_profile. */
export type HelpProfile = {
  company?: 'formed' | 'not_yet';
  award?: 'none' | 'phase1' | 'phase2';
  awardAgencies?: Agency[];
  agencies?: Agency[];
  areas?: Area[];
  state?: string;
};

export type FitContext = {
  profile: HelpProfile;
  /** Agency that owns the technology being licensed (from the technology record). */
  techAgency: Agency | null;
  /** Agencies the user targets: profile answers plus agencies of opportunities saved to the project. */
  targetAgencies: Set<Agency>;
  stage: Stage;
};

export type Fit = { level: 'now' | 'later' | 'no'; reasons: string[] };

export type Timing =
  | { type: 'deadline'; date: string; closesAt: string; label: string; verified: true }
  | { type: 'rolling'; label: string }
  | { type: 'cycle'; label: string }
  | { type: 'with_proposal'; label: string }
  | { type: 'closed'; label: string };

export type Program = {
  id: string;
  name: string;
  sponsor: string;
  kind: Kind;
  stages: Stage[];
  summary: string;
  gives: string[];
  eligibility: string;
  cost: string;
  free: boolean;
  timing: Timing;
  url: string;
  /** Extra official links (application portal, finder, contact). */
  links?: { label: string; url: string }[];
  contact?: string;
  fit: (c: FitContext) => Fit;
};

const has = (s: Set<Agency> | Agency[] | undefined, a: Agency) => (s instanceof Set ? s.has(a) : !!s?.includes(a));
const area = (c: FitContext, ...a: Area[]) => a.some(x => c.profile.areas?.includes(x));
const awarded = (c: FitContext, phase: 'phase1' | 'phase2', agency?: Agency) => {
  const level = c.profile.award ?? 'none';
  const ok = phase === 'phase1' ? level === 'phase1' || level === 'phase2' : level === 'phase2';
  return ok && (!agency || has(c.profile.awardAgencies, agency));
};
const now = (...reasons: string[]): Fit => ({ level: 'now', reasons });
const later = (...reasons: string[]): Fit => ({ level: 'later', reasons });
const no = (...reasons: string[]): Fit => ({ level: 'no', reasons });

export const PROGRAMS: Program[] = [
  // ---------- Proposal coaching ----------
  {
    id: 'nci_step',
    name: 'NCI SBIR/STTR Training and Entrepreneurship Program (STEP)',
    sponsor: 'National Cancer Institute (NIH)',
    kind: 'proposal_help',
    stages: ['propose'],
    summary: 'A free 16-week program that coaches small businesses through customer discovery and then through writing an NIH Phase I SBIR/STTR application for a cancer-focused technology.',
    gives: [
      'Stage 1: entrepreneurship, value-proposition testing and customer-discovery coaching',
      'Stage 2: help with registrations, timelines, grant-writing technique and budget calculation',
      'Post-submission support: reading summary statements, talking to an NCI Program Director, resubmission',
    ],
    eligibility: 'A U.S. small business that has never received an NIH SBIR/STTR award, or none in the last 10 years, with a cancer-focused technology in an NCI topic area (therapeutics, diagnostics, imaging, devices, prevention, cancer control, research tools, digital health). Phase I only. NCI expects 10–25 hours per week.',
    cost: 'No cost. Provides coaching, not funding.',
    free: true,
    timing: { type: 'deadline', date: '2026-10-12', closesAt: '2026-10-12T17:00:00-04:00', label: 'Submission deadline Monday, Oct 12, 2026 at 5:00 p.m. ET (per NCI page updated Aug 31, 2026)', verified: true },
    url: 'https://sbir.cancer.gov/small-business-funding/application-process/step',
    contact: 'ncisbir@mail.nih.gov',
    fit: c => {
      if (c.profile.award && c.profile.award !== 'none' && has(c.profile.awardAgencies, 'NIH')) return no('Limited to companies without an NIH SBIR/STTR award in the last 10 years.');
      if (!area(c, 'cancer')) return c.profile.areas?.length ? no('Only for cancer-focused technologies.') : later('Only if your technology is cancer-focused — tell us your area to check.');
      return c.stage === 'propose' || c.stage === 'license' ? now('Cancer-focused and no recent NIH award.', 'Free coaching for an NIH Phase I application.') : later('Becomes useful once you are ready to write an NIH Phase I application.');
    },
  },
  {
    id: 'niaid_aap',
    name: 'NIAID Applicant Assistance Program',
    sponsor: 'National Institute of Allergy and Infectious Diseases (NIH)',
    kind: 'proposal_help',
    stages: ['propose'],
    summary: 'Support for companies planning to apply for NIAID SBIR/STTR funding (Phase I, Phase II/IIB, Fast Track or Direct to Phase II).',
    gives: ['Application support for NIAID SBIR/STTR submissions (see the NIAID page for current services)'],
    eligibility: 'Companies planning an NIAID SBIR/STTR application in infectious disease, immunology or related NIAID mission areas. Confirm current criteria on the NIAID page.',
    cost: 'See official page.',
    free: false,
    timing: { type: 'cycle', label: 'Application windows not confirmed — check the NIAID page.' },
    url: 'https://seed.nih.gov/small-business-funding/how-to-apply/applying/prepare-your-application',
    links: [{ label: 'NIAID small business grants', url: 'https://www.niaid.nih.gov/research/grants-small-business' }],
    fit: c => area(c, 'infectious')
      ? (c.stage === 'propose' ? now('You target NIH with a health / infectious-disease technology.') : later('Useful when you prepare an NIAID application.'))
      : no('Only relevant for NIAID (infectious disease / immunology) applications.'),
  },
  {
    id: 'nia_startup',
    name: 'NIA Start-Up Challenge and Accelerator',
    sponsor: 'National Institute on Aging (NIH)',
    kind: 'training',
    stages: ['discover', 'propose'],
    summary: 'A two-stage, five-month accelerator and cash-prize competition for early-stage entrepreneurs with technologies to improve healthy aging.',
    gives: ['Entrepreneurial training and mentorship', 'Cash prizes for winners (the 2025 cycle awarded $65,000 to each of 7 winners)'],
    eligibility: 'Early-stage entrepreneurs with science-driven technologies for healthy aging. See NIA page for each cycle’s rules.',
    cost: 'No fee to enter.',
    free: true,
    timing: { type: 'closed', label: 'Most recent cycle accepted submissions through Dec 9, 2024; winners announced Jan 2026. No open cycle confirmed.' },
    url: 'https://www.nia.nih.gov/research/sbir/startup-challenge',
    fit: c => area(c, 'aging') ? later('Aging-focused — watch for the next cycle.') : no('Only for healthy-aging technologies.'),
  },
  {
    id: 'doe_phase0',
    name: 'DOE SBIR/STTR Phase 0 Assistance Program',
    sponsor: 'U.S. Department of Energy, Office of Science',
    kind: 'proposal_help',
    stages: ['propose'],
    summary: 'Free help preparing a first DOE Phase I SBIR/STTR application: mentoring, proposal preparation, market research, application support, and technical and IP consultation.',
    gives: ['A set of core services plus optional services agreed with the Phase 0 Project Director', 'Up to 10 weeks of support if you register as soon as DOE topics are released'],
    eligibility: 'Any small business that has never submitted a DOE SBIR/STTR proposal and has not used DOE Phase 0 before. DOE prioritizes states with historically low DOE submissions and women- and minority-owned businesses.',
    cost: 'Agency funded — no cost to the applicant.',
    free: true,
    timing: { type: 'cycle', label: 'Offered twice a year when DOE topics are released (DOE says July and November). Register right away to get the full 10 weeks.' },
    url: 'https://science.osti.gov/SBIRLearning/FAQs/Tutorial-10/',
    links: [{ label: 'Phase 0 eligibility check', url: 'https://science.osti.gov/SBIRLearning/Eligibility' }, { label: 'Phase 0 schedule', url: 'https://science.osti.gov/SBIRLearning/Schedule' }],
    fit: c => has(c.targetAgencies, 'DOE') || area(c, 'energy')
      ? (c.stage === 'propose' || c.stage === 'license' ? now('You are looking at DOE / energy funding.', 'Free coaching for a first DOE Phase I proposal.') : later('Useful once you plan a DOE Phase I proposal.'))
      : no('Only for DOE SBIR/STTR applications.'),
  },
  {
    id: 'nsf_pitch',
    name: 'NSF SBIR/STTR Project Pitch',
    sponsor: 'National Science Foundation (America’s Seed Fund)',
    kind: 'proposal_help',
    stages: ['propose'],
    summary: 'The required first step for NSF Phase I. A short pitch gets you quick feedback and either an invitation to submit a full proposal or an explanation of why the project does not fit.',
    gives: ['Fit decision and feedback from NSF staff before you write a full proposal', 'Four short sections (up to 3,500 characters each): innovation, technical objectives, market opportunity, team'],
    eligibility: 'Startups and small businesses with an innovative, technically risky R&D project. Limits: one pitch under review at a time, two per 12 months, three per project.',
    cost: 'Free to submit.',
    free: true,
    timing: { type: 'rolling', label: 'Submitted within NSF’s submission windows; wait for a response before submitting another.' },
    url: 'https://seedfund.nsf.gov/project-pitch/',
    links: [{ label: 'NSF SBIR webinars', url: 'https://seedfund.nsf.gov/' }],
    fit: c => has(c.targetAgencies, 'NSF')
      ? now('You target NSF — a Project Pitch is required before a Phase I proposal.')
      : c.stage === 'propose' || c.stage === 'license' ? later('Consider if NSF could fund your technology; the pitch is a cheap way to test fit.') : later('Relevant if you pursue NSF funding.'),
  },
  {
    id: 'sba_fast',
    name: 'SBA FAST partners (state and regional SBIR/STTR help)',
    sponsor: 'U.S. Small Business Administration',
    kind: 'proposal_help',
    stages: ['discover', 'propose', 'awarded'],
    summary: 'SBA funds state and regional organizations that run SBIR/STTR outreach, proposal help and — in some regions — small grants or loans toward the cost of preparing a proposal (often called Phase 0).',
    gives: ['Training and outreach on SBIR/STTR', 'Proposal development and team-building help', 'In some regions: grants or loans for proposal costs, conference travel or bridging between phases'],
    eligibility: 'Varies by state or regional partner. Not every state has one in every year.',
    cost: 'Varies by partner; many services are free.',
    free: false,
    timing: { type: 'rolling', label: 'Year-round through your regional partner.' },
    url: 'https://www.sbir.gov/community/fast',
    contact: 'FAST@sba.gov',
    fit: c => c.stage === 'propose' || c.stage === 'license' ? now('Local, hands-on proposal help; some regions also cover proposal costs.') : later('Useful once you start preparing a proposal.'),
  },
  {
    id: 'sbir_tutorials',
    name: 'SBIR.gov online tutorials',
    sponsor: 'U.S. Small Business Administration',
    kind: 'training',
    stages: ['discover', 'propose'],
    summary: 'Free self-paced courses on how SBIR and STTR work: eligibility, SBIR vs STTR, grants vs contracts, each agency’s program, indirect rates, and preparing a proposal.',
    gives: ['Agency-by-agency introductions', 'Eligibility and SBIR-vs-STTR guidance', 'Proposal preparation and indirect-rate tutorials, each with a short quiz'],
    eligibility: 'Anyone.',
    cost: 'Free.',
    free: true,
    timing: { type: 'rolling', label: 'Available anytime.' },
    url: 'https://www.sbir.gov/tutorials',
    fit: c => (c.profile.award ?? 'none') === 'none' ? now('Fastest way to learn the rules before you commit time to a proposal.') : later('A refresher; you already have an award.'),
  },
  {
    id: 'nih_seed',
    name: 'NIH SEED Office and Institute program staff',
    sponsor: 'NIH Small Business Education and Entrepreneurial Development (SEED) Office',
    kind: 'proposal_help',
    stages: ['propose'],
    summary: 'NIH asks applicants to contact small business program staff at the Institute or Center their application is likely to go to. If you do not know who that is, the SEED Office routes you.',
    gives: ['Guidance on fit and which Institute to target', 'Application guides, annotated form sets and sample applications'],
    eligibility: 'Anyone considering an NIH SBIR/STTR application.',
    cost: 'Free.',
    free: true,
    timing: { type: 'rolling', label: 'Anytime. Contact staff well before the due date.' },
    url: 'https://seed.nih.gov/small-business-funding/how-to-apply/applying/prepare-your-application',
    contact: 'seedinfo@nih.gov',
    fit: c => has(c.targetAgencies, 'NIH') || area(c, 'health', 'cancer', 'aging', 'infectious')
      ? (c.stage === 'propose' || c.stage === 'license' ? now('You are heading toward NIH — talking to program staff early is the cheapest way to check fit.') : later('Talk to NIH program staff once you have a specific aims draft.'))
      : no('Only for NIH applications.'),
  },
  {
    id: 'taba',
    name: 'Technical and Business Assistance (TABA) funding',
    sponsor: 'SBIR/STTR agencies (rules vary by agency)',
    kind: 'funding_help',
    stages: ['propose', 'awarded'],
    summary: 'Many SBIR/STTR awards let you budget extra money to pay outside vendors for help such as IP support, customer discovery, market assessment, business strategy and manufacturing planning.',
    gives: ['At NIH: up to $6,500 per year in Phase I and up to $50,000 per Phase II project for TABA services', 'Other agencies offer TABA with their own rules and amounts — check your solicitation'],
    eligibility: 'Requested in an SBIR/STTR proposal or award budget, following the solicitation’s instructions.',
    cost: 'Paid from the award, on top of the normal budget where the agency allows.',
    free: true,
    timing: { type: 'with_proposal', label: 'Request it in your proposal budget — easy to forget.' },
    url: 'https://seed.nih.gov/product-development-support/technical-business-assistance-program/taba-funding',
    links: [{ label: 'Example: USDA TABA on SBIR.gov', url: 'https://www.sbir.gov/node/21352' }],
    fit: c => c.stage === 'propose' || c.stage === 'awarded' ? now('Add a TABA line to your proposal budget if the solicitation allows it.') : later('Remember to budget TABA when you write your proposal.'),
  },

  // ---------- After an award ----------
  {
    id: 'nih_needs',
    name: 'NIH Needs Assessment',
    sponsor: 'NIH SEED Office',
    kind: 'funding_help',
    stages: ['awarded'],
    summary: 'A free third-party report that identifies gaps in a Phase I project’s technical and business readiness, followed by a consultation with an Entrepreneur in Residence and your NIH Program Officer.',
    gives: ['Needs Assessment Report (gaps only — not market data)', 'Consultation on closing gaps with NIH resources and Phase II TABA funding'],
    eligibility: 'An NIH SBIR/STTR Phase I (or Fast-Track Phase I) active within the last 2 years. Not available if that Phase I already used TABA or the older Niche Assessment Program.',
    cost: 'No cost; minimal time commitment.',
    free: true,
    timing: { type: 'rolling', label: 'Open year-round. Request at least 6 months before your Phase II deadline; NIH replies within 60 days.' },
    url: 'https://seed.nih.gov/product-development-support/needs-assessment',
    fit: c => awarded(c, 'phase1', 'NIH') ? now('You have an NIH Phase I — request this well before your Phase II deadline.') : has(c.targetAgencies, 'NIH') ? later('Available after an NIH Phase I award.') : no('Only for NIH Phase I awardees.'),
  },
  {
    id: 'nih_icorps',
    name: 'I-Corps at NIH',
    sponsor: 'NIH (with CDC, FDA and ACL)',
    kind: 'training',
    stages: ['awarded'],
    summary: 'Virtual, hands-on entrepreneurship training for Phase I awardees: customer interviews, target-market focus and business-model building, taught by biotech-sector experts.',
    gives: ['Customer-discovery training and coaching', 'A $25,000 stipend that covers program costs'],
    eligibility: 'A Phase I SBIR/STTR from NIH, CDC, FDA or ACL that is or was active within 2 years of the deadline, with no Phase II yet for that project. Team of three: a C-level officer, the technical lead, and an industry expert — all must attend.',
    cost: 'No cost to you; a $25,000 stipend covers program costs.',
    free: true,
    timing: { type: 'cycle', label: 'Runs in cohorts; check the page for the next application date.' },
    url: 'https://seed.nih.gov/I-Corps-at-NIH',
    fit: c => awarded(c, 'phase1', 'NIH') && c.profile.award !== 'phase2' ? now('You have an NIH Phase I and no Phase II yet.') : has(c.targetAgencies, 'NIH') ? later('Available after an NIH Phase I award.') : no('Only for NIH/CDC/FDA/ACL Phase I awardees.'),
  },
  {
    id: 'nih_crp',
    name: 'NIH Commercialization Readiness Pilot (CRP)',
    sponsor: 'NIH',
    kind: 'funding_help',
    stages: ['awarded'],
    summary: 'Additional technical assistance and late-stage R&D support, beyond Phase II, for work not usually covered by small business awards.',
    gives: ['Late-stage R&D funding and technical assistance to help products reach market'],
    eligibility: 'An active NIH SBIR/STTR Phase II or Phase IIB award from a participating Institute within the last 36 months. One CRP per project; cannot request TABA in a CRP application.',
    cost: 'Funding opportunity.',
    free: true,
    timing: { type: 'cycle', label: 'See the current funding opportunity on the NIH page.' },
    url: 'https://seed.nih.gov/small-business-funding/find-funding/crp',
    fit: c => awarded(c, 'phase2', 'NIH') ? now('You have an NIH Phase II.') : has(c.targetAgencies, 'NIH') ? later('Available after an NIH Phase II award.') : no('Only for NIH Phase II awardees.'),
  },

  // ---------- Licensing and finding technology ----------
  {
    id: 'techlink',
    name: 'TechLink',
    sponsor: 'Partnership intermediary for DoD and VA laboratories',
    kind: 'licensing_help',
    stages: ['discover', 'license'],
    summary: 'The official technology-transfer intermediary for all Department of Defense labs (since 1999) and the Department of Veterans Affairs (since 2019). Its licensing staff help you find, evaluate and license DoD and VA technology.',
    gives: ['Help identifying DoD/VA technologies that match your business', 'Help with the license application and commercial development plan the lab requires'],
    eligibility: 'Entrepreneurs and businesses of any size interested in DoD or VA lab technology.',
    cost: 'TechLink’s help is no-cost. License fees and royalties are negotiated with the lab.',
    free: true,
    timing: { type: 'rolling', label: 'Anytime.' },
    url: 'https://techlinkcenter.org/resources/faqs',
    links: [{ label: 'TechLink technology search', url: 'https://techlinkcenter.org/' }],
    fit: c => c.techAgency === 'DoD' || c.techAgency === 'VA'
      ? (c.stage === 'discover' || c.stage === 'license' ? now(`Your technology comes from a ${c.techAgency} lab — TechLink helps with that license at no cost.`) : later('Keep in mind for future DoD/VA technologies.'))
      : c.techAgency ? no('Only for DoD and VA lab technologies.') : now('Free help finding and licensing DoD and VA technologies.'),
  },
  {
    id: 'flc_business',
    name: 'FLC Business (Federal Laboratory Consortium)',
    sponsor: 'Federal Laboratory Consortium for Technology Transfer',
    kind: 'tech_search',
    stages: ['discover'],
    summary: 'A free search across federal-lab technologies available to license, plus facilities, equipment, patents and researchers.',
    gives: ['Search of licensing opportunities across federal labs', 'Facilities, equipment and researcher listings'],
    eligibility: 'Anyone.',
    cost: 'Free.',
    free: true,
    timing: { type: 'rolling', label: 'Anytime.' },
    url: 'https://federallabs.org/flc-business/how-to-search',
    contact: 'info@federallabs.org',
    fit: c => c.stage === 'discover' && !c.techAgency ? now('Broadest single search across federal labs.') : later('Useful if you need a second technology, a test facility or lab expertise.'),
  },
  {
    id: 'doe_lps',
    name: 'DOE Lab Partnering Service',
    sponsor: 'U.S. Department of Energy, Office of Technology Commercialization',
    kind: 'tech_search',
    stages: ['discover', 'license'],
    summary: 'One platform to find DOE national lab technologies available for licensing, browse 350+ lab facilities, and contact 500+ lab experts with questions.',
    gives: ['Thousands of licensable DOE technologies with patents and publications', 'Direct connection to the owning lab from each listing', 'Access to lab experts and facility descriptions'],
    eligibility: 'Businesses of any size, investors, universities and non-profits.',
    cost: 'Free to use.',
    free: true,
    timing: { type: 'rolling', label: 'Anytime.' },
    url: 'https://www.energy.gov/technologycommercialization/lab-partnering-service',
    fit: c => c.techAgency === 'DOE' ? now('Your technology is from a DOE lab — contact the lab and its experts here.') : c.stage === 'discover' && !c.techAgency ? now('Search DOE national-lab technologies.') : later('Useful for DOE technologies, lab facilities or lab experts.'),
  },
  {
    id: 'nasa_startup_license',
    name: 'NASA Startup License (and Evaluation License)',
    sponsor: 'NASA Technology Transfer Program',
    kind: 'licensing_help',
    stages: ['discover', 'license'],
    summary: 'NASA offers startups a license with no up-front fee for commercial use of its patented technologies, and a 12-month evaluation license to test a technology first.',
    gives: ['Startup license: no up-front fee (normal non-exclusive up-front fees are usually $5,000–$10,000)', 'Evaluation license: typically 12 months for $2,500, adjustable', 'Online application through NASA’s ATLAS system'],
    eligibility: 'Startup license: U.S. companies formed to commercialize the licensed NASA technology. Non-exclusive (NASA will consider more exclusivity on request). Requires a commercialization plan and progress reporting.',
    cost: 'No up-front fee for the startup license; royalties still apply (NASA says running royalties generally range 3–7%).',
    free: false,
    timing: { type: 'rolling', label: 'Apply anytime once you have chosen a NASA technology.' },
    url: 'https://technology.nasa.gov/license',
    fit: c => c.techAgency === 'NASA'
      ? (c.stage === 'discover' || c.stage === 'license' ? now('Your technology is from NASA — a startup license avoids the up-front fee.') : later('Already past licensing.'))
      : c.techAgency ? no('Only for NASA technologies.') : later('Relevant if you choose a NASA technology.'),
  },
  {
    id: 'doe_leep',
    name: 'DOE Lab-Embedded Entrepreneurship Program (LEEP)',
    sponsor: 'U.S. Department of Energy, Office of Technology Commercialization',
    kind: 'fellowship',
    stages: ['discover', 'license', 'propose'],
    summary: 'A two-year funded fellowship that embeds founders of early-stage energy or manufacturing startups at a national lab, mentored by a lab scientist.',
    gives: ['Paid living stipend for two years, healthcare and a travel allowance', 'Access to lab equipment, scientists and collaborative R&D', 'Entrepreneurship training and investor/industry network'],
    eligibility: 'Innovators with early-stage energy or manufacturing startups or technologies. Requirements differ by node: Chain Reaction Innovations (Argonne), Cyclotron Road (Berkeley Lab), Innovation Crossroads (Oak Ridge), West Gate (National Laboratory of the Rockies).',
    cost: 'Funded fellowship.',
    free: true,
    timing: { type: 'cycle', label: 'Annual national call (DOE page refers to applications for the 2027 cohort) — check each node for dates.' },
    url: 'https://www.energy.gov/technologycommercialization/lab-embedded-entrepreneurship-program-otc',
    fit: c => area(c, 'energy', 'manufacturing') ? now('Energy / manufacturing founders can be paid to build at a national lab.')
      : c.techAgency === 'DOE' && !c.profile.areas?.length ? later('If your DOE technology is energy or manufacturing related, this fellowship pays you to build it at a national lab.')
      : no('Focused on energy and manufacturing technologies.'),
  },
  {
    id: 'nsf_icorps',
    name: 'NSF I-Corps Teams',
    sponsor: 'National Science Foundation',
    kind: 'training',
    stages: ['discover'],
    summary: 'Customer- and industry-discovery training, mentoring and funding to test whether research can become a product. Teams of 3–5 with a technical lead, an entrepreneurial lead and an industry mentor.',
    gives: ['National I-Corps training in a cohort of about 24 teams', 'Mentoring and team funding'],
    eligibility: 'Aimed at NSF-funded researchers and their teams (an entrepreneur can join as the entrepreneurial lead). Check the funding opportunity for current rules.',
    cost: 'Funded.',
    free: true,
    timing: { type: 'cycle', label: 'Cohort-based; start with an executive summary through the application portal.' },
    url: 'https://www.nsf.gov/funding/initiatives/i-corps/about-teams',
    fit: c => has(c.targetAgencies, 'NSF') ? later('Possible if you team with an NSF-funded researcher as entrepreneurial lead.') : no('Mainly for NSF-funded research teams.'),
  },

  // ---------- Mentoring, contracting, legal, manufacturing ----------
  {
    id: 'score',
    name: 'SCORE mentoring',
    sponsor: 'SCORE (SBA resource partner)',
    kind: 'mentoring',
    stages: ['discover', 'license', 'propose', 'awarded'],
    summary: 'Free, ongoing one-on-one mentoring from experienced business people — business planning, financing, operations — by email, phone or video, plus workshops.',
    gives: ['A matched volunteer mentor', 'Workshops, webinars and on-demand courses'],
    eligibility: 'Anyone starting or running a small business.',
    cost: 'Free.',
    free: true,
    timing: { type: 'rolling', label: 'Request a mentor anytime.' },
    url: 'https://www.score.org/find-mentor',
    fit: () => now('A free sounding board for business planning at any stage.'),
  },
  {
    id: 'sbdc',
    name: 'Small Business Development Centers (SBDC)',
    sponsor: 'U.S. Small Business Administration',
    kind: 'mentoring',
    stages: ['discover', 'license', 'propose', 'awarded'],
    summary: 'Local advisors who help pre-venture entrepreneurs and small businesses with capital, technology, business planning, financial management, marketing and more.',
    gives: ['Individual business advising and technical assistance', 'Training; some centers specialize in technology and SBIR'],
    eligibility: 'Small businesses and pre-venture entrepreneurs.',
    cost: 'Confirm with your local center.',
    free: false,
    timing: { type: 'rolling', label: 'Anytime.' },
    url: 'https://www.sba.gov/local-assistance/resource-partners/small-business-development-centers-sbdc',
    fit: c => c.profile.company === 'not_yet' ? now('Help forming the company, registrations and financial planning.') : now('Local, in-person business advising.'),
  },
  {
    id: 'apex',
    name: 'APEX Accelerators',
    sponsor: 'Department of Defense, Office of Small Business Programs',
    kind: 'mentoring',
    stages: ['propose', 'awarded'],
    summary: 'No-cost guidance for companies new to government contracting, delivered through local offices — useful for registrations and contract requirements, especially for DoD SBIR/STTR contracts.',
    gives: ['Help entering the government marketplace and supply chain', 'Local counseling and training'],
    eligibility: 'Businesses interested in government contracting.',
    cost: 'No cost.',
    free: true,
    timing: { type: 'rolling', label: 'Anytime.' },
    url: 'https://www.apexaccelerators.us/',
    fit: c => has(c.targetAgencies, 'DoD') || area(c, 'defense') ? now('DoD SBIR/STTR awards are contracts — APEX helps with contracting requirements.') : later('Useful if you pursue government contracts.'),
  },
  {
    id: 'uspto_probono',
    name: 'USPTO Patent Pro Bono Program',
    sponsor: 'U.S. Patent and Trademark Office',
    kind: 'legal',
    stages: ['awarded'],
    summary: 'Matches volunteer patent attorneys and agents with financially under-resourced inventors and small businesses to prepare and file patent applications for free — useful for your own improvements to a licensed technology.',
    gives: ['Free legal help preparing and filing a patent application'],
    eligibility: 'Generally: gross household income under 3× the federal poverty guidelines (varies by regional program), a provisional application on file or the USPTO certificate course completed, and the ability to describe the invention.',
    cost: 'Free legal services (USPTO fees still apply).',
    free: true,
    timing: { type: 'rolling', label: 'Anytime, through your regional program.' },
    url: 'https://www.uspto.gov/patents/basics/using-legal-services/pro-bono/patent-pro-bono-program',
    contact: 'probono@uspto.gov',
    fit: c => c.stage === 'awarded' ? now('Protect your own improvements if you meet the income guideline.') : later('Relevant once you develop your own patentable improvements.'),
  },
  {
    id: 'nist_mep',
    name: 'NIST Manufacturing Extension Partnership (MEP)',
    sponsor: 'National Institute of Standards and Technology',
    kind: 'manufacturing',
    stages: ['awarded'],
    summary: 'State MEP Centers — about 1,400 advisors at 450+ locations — help small and medium U.S. manufacturers with production, scale-up and supply chain.',
    gives: ['Manufacturing advisors in every state and Puerto Rico'],
    eligibility: 'Any manufacturer can use MEP Center services.',
    cost: 'Confirm with your MEP Center.',
    free: false,
    timing: { type: 'rolling', label: 'Anytime.' },
    url: 'https://www.nist.gov/mep',
    fit: c => area(c, 'manufacturing') ? (c.stage === 'awarded' ? now('You are building a physical product — plan manufacturing early.') : later('Bring in MEP when you plan prototypes and production.')) : later('Relevant if your product is manufactured.'),
  },
];

export const programById = (id: string) => PROGRAMS.find(p => p.id === id);

/** Maps free-text agency names (from technology and opportunity records) to a short agency code. */
export function normalizeAgency(text: string | null | undefined): Agency | null {
  const t = (text ?? '').toLowerCase();
  if (!t.trim()) return null;
  if (/\bnih\b|national institutes? of health|hhs|health and human|cancer institute|\bnci\b|niaid|\bnia\b|cdc|fda/.test(t)) return 'NIH';
  if (/\bnsf\b|national science foundation/.test(t)) return 'NSF';
  if (/\bdoe\b|department of energy|energy\b|national laboratory|arpa-e|nnsa/.test(t)) return 'DOE';
  if (/\bdod\b|defense|army|navy|air force|darpa|\bdla\b|space force|afrl|\bonr\b|socom|osd/.test(t)) return 'DoD';
  if (/nasa|aeronautics|space administration/.test(t)) return 'NASA';
  if (/\bva\b|veterans/.test(t)) return 'VA';
  if (/usda|agriculture/.test(t)) return 'USDA';
  if (/nist|commerce|noaa/.test(t)) return 'NIST';
  return 'Other';
}

/** Which stage of the journey a project is in, from its status. */
export function stageOf(status: string | null | undefined): Stage {
  switch (status) {
    case 'investigating_licensing': case 'licensing_discussions': case 'agreement_in_progress': return 'license';
    case 'evaluating_funding': case 'proposal_in_preparation': case 'proposal_submitted': case 'funding_decision_pending': return 'propose';
    case 'funded_development': case 'product_validation': case 'ongoing_commercialization': return 'awarded';
    default: return 'discover';
  }
}

export type Ranked = { program: Program; fit: Fit };
const LEVEL = { now: 0, later: 1, no: 2 } as const;
/** Kinds of help that matter most at each stage; general mentoring and tutorials sort after targeted help. */
const KIND_ORDER: Record<Stage, Kind[]> = {
  discover: ['licensing_help', 'tech_search', 'fellowship', 'training', 'proposal_help', 'funding_help', 'mentoring', 'legal', 'manufacturing'],
  license: ['licensing_help', 'tech_search', 'fellowship', 'proposal_help', 'training', 'mentoring', 'funding_help', 'legal', 'manufacturing'],
  propose: ['proposal_help', 'funding_help', 'training', 'licensing_help', 'fellowship', 'mentoring', 'tech_search', 'legal', 'manufacturing'],
  awarded: ['funding_help', 'training', 'manufacturing', 'legal', 'mentoring', 'proposal_help', 'licensing_help', 'fellowship', 'tech_search'],
};
const GENERAL = new Set(['score', 'sbdc', 'sbir_tutorials', 'sba_fast']);

/** All programs with their fit for this context, best first; programs for the current stage rank above others. */
export function rankPrograms(c: FitContext): Ranked[] {
  return PROGRAMS.map(program => ({ program, fit: program.fit(c) })).sort((a, b) =>
    LEVEL[a.fit.level] - LEVEL[b.fit.level]
    || Number(!a.program.stages.includes(c.stage)) - Number(!b.program.stages.includes(c.stage))
    || Number(a.program.timing.type !== 'deadline') - Number(b.program.timing.type !== 'deadline')
    || Number(GENERAL.has(a.program.id)) - Number(GENERAL.has(b.program.id))
    || KIND_ORDER[c.stage].indexOf(a.program.kind) - KIND_ORDER[c.stage].indexOf(b.program.kind)
    || Number(!a.program.free) - Number(!b.program.free));
}

/** Days until a program deadline (end of that day, Eastern), or null when it has none. */
export function programDaysLeft(p: Program, today = new Date()): number | null {
  if (p.timing.type !== 'deadline') return null;
  const end = new Date(p.timing.closesAt);
  if (today >= end) return -1;
  const localDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(today);
  return Math.round((Date.parse(`${p.timing.date}T00:00:00Z`) - Date.parse(`${localDay}T00:00:00Z`)) / 86_400_000);
}

export const TRACK_STATUS: Record<string, string> = {
  considering: 'Considering',
  preparing: 'Preparing to apply',
  applied_confirmed: 'Applied (you confirmed)',
  accepted_confirmed: 'Accepted (you confirmed)',
  participating: 'Participating',
  completed: 'Completed',
  declined: 'Declined / not selected',
  not_a_fit: 'Not a fit',
};
export const ACTIVE_TRACK = new Set(['considering', 'preparing', 'applied_confirmed', 'accepted_confirmed', 'participating']);
