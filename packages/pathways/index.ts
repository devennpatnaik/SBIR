export type Pathway = { key:string;name:string;category:string;money:string;summary:string;boundary:string;area:string;checks:string[];steps:{title:string;description:string}[];sections:string[];sources:{label:string;url:string}[];inquiry:string;checked_on:string };
export const PATHWAYS: Pathway[] = [
  {
    "key": "federal_license",
    "name": "License a federal invention",
    "category": "IP rights",
    "money": "Usually you pay fees or royalties to the licensor. The lab does not normally pay you.",
    "summary": "Secure exclusive, partially exclusive or nonexclusive rights to a federal invention.",
    "boundary": "A license is permission to use IP, not an R&D award. Verify ownership, availability, field of use and manufacturing obligations with the licensor.",
    "area": "licensing",
    "checks": [
      "Who owns the invention, and what patent rights are currently available?",
      "What field, territory, exclusivity and U.S. manufacturing obligations apply?",
      "What fees, royalties, diligence milestones and evidence of capability will the lab require?"
    ],
    "steps": [
      {
        "title": "Confirm ownership and the licensing contact",
        "description": "Find the official listing, patent identifiers and authorized licensing office. Record sources; a listing alone is not a license."
      },
      {
        "title": "Define the rights you need",
        "description": "Compare evaluation, option, nonexclusive and exclusive rights, including field and geography."
      },
      {
        "title": "Prepare a development and marketing plan",
        "description": "Describe customer problem, evidence, development milestones, resources, commercialization timeline and risks. 35 USC 209 requires a development or marketing plan for a federal patent license."
      },
      {
        "title": "Build a licensing cost and obligations model",
        "description": "Keep upfront fees, patent costs, minimum royalties, running royalties and reporting obligations separate from award income. Do not invent terms."
      },
      {
        "title": "Review the application and negotiate with the licensor",
        "description": "Obtain the office\u2019s actual forms and seek legal review; draft correspondence remains unsent."
      },
      {
        "title": "Track execution and ongoing compliance",
        "description": "Only record execution after human confirmation. Track diligence, reporting, payments and any manufacturing commitments."
      }
    ],
    "sections": [
      "Commercialization summary",
      "Technology and requested rights",
      "Customer problem and evidence",
      "Development milestones and resources",
      "Go-to-market and manufacturing plan",
      "Financial assumptions and royalty scenarios",
      "Risks, diligence and open terms"
    ],
    "sources": [
      {
        "label": "Federal licensing requirements, 35 USC 209",
        "url": "https://www.law.cornell.edu/uscode/text/35/209"
      },
      {
        "label": "USPTO technology-transfer overview",
        "url": "https://www.uspto.gov/ip-policy/patent-policy/technology-transfer"
      }
    ],
    "inquiry": "Could you confirm the current availability of these rights, the licensing process, and your required commercialization-plan format?",
    "checked_on": "2026-10-11"
  },
  {
    "key": "university_license",
    "name": "University / Bayh-Dole license",
    "category": "IP rights",
    "money": "You pay the institution under negotiated terms, often royalties, fees or equity. This is not an SBIR-style award.",
    "summary": "Commercialize university-owned IP, including inventions arising from federally funded research.",
    "boundary": "Federal funding does not mean the government owns the patent. Confirm chain of title and the institution\u2019s authority; retained government rights and other obligations may apply.",
    "area": "licensing",
    "checks": [
      "Has the institution confirmed ownership, inventorship and its authority to license?",
      "Is this a federally funded subject invention, and which government or sponsor rights remain?",
      "What license scope, diligence, patent reimbursement, royalty, equity and manufacturing terms apply?"
    ],
    "steps": [
      {
        "title": "Find the institution\u2019s technology-transfer office",
        "description": "Verify the official university listing and authorized contact, not only a lab or researcher."
      },
      {
        "title": "Check title, funding and encumbrances",
        "description": "Ask about assignments, federal funding, sponsor rights, co-owners and prior licenses."
      },
      {
        "title": "Prepare the commercialization case",
        "description": "Build market evidence, development plan, team capability and requested rights."
      },
      {
        "title": "Model institutional license economics",
        "description": "Separate royalties, equity, patent expenses, milestone payments and minimums from cash available to the company."
      },
      {
        "title": "Review option and license documents",
        "description": "Ask counsel to review scope, diligence, retained rights, U.S. manufacturing, publication and improvements."
      },
      {
        "title": "Track license performance",
        "description": "Record execution only on confirmation; track reporting, payments and diligence obligations."
      }
    ],
    "sections": [
      "Invention and chain-of-title questions",
      "Requested license scope",
      "Commercialization and development plan",
      "Team and resources",
      "Economics and diligence",
      "Government and sponsor rights",
      "Unresolved legal terms"
    ],
    "sources": [
      {
        "label": "NIST Bayh-Dole framework",
        "url": "https://www.nist.gov/tpo/policy-coordination/bayh-dole-act"
      },
      {
        "label": "NIST ownership and reporting FAQs",
        "url": "https://www.nist.gov/tpo/policy-coordination/bayh-dole-act/2018-faqs"
      },
      {
        "label": "USPTO technology-transfer overview",
        "url": "https://www.uspto.gov/ip-policy/patent-policy/technology-transfer"
      }
    ],
    "inquiry": "Could your technology-transfer office confirm ownership, funding-related obligations, available rights and your startup licensing process?",
    "checked_on": "2026-10-11"
  },
  {
    "key": "crada",
    "name": "CRADA collaboration",
    "category": "Collaboration",
    "money": "The lab can contribute people, facilities, equipment and IP, but not funds to the non-federal partner under 15 USC 3710a.",
    "summary": "Work jointly with a federal lab on a mission-aligned research effort.",
    "boundary": "A CRADA is not a procurement contract or a financial-assistance cooperative agreement. Budget the company\u2019s own costs and any payments to the lab separately.",
    "area": "licensing",
    "checks": [
      "Does the proposed work align with the lab\u2019s mission and available resources?",
      "Who supplies each resource and pays each cost, without lab funds flowing to the non-federal partner under the CRADA?",
      "How will background IP, new inventions, licensing options, publication and protected data be handled?"
    ],
    "steps": [
      {
        "title": "Identify a lab collaborator and mission fit",
        "description": "Verify the official partnership office and relevant technical group."
      },
      {
        "title": "Write a joint statement of work",
        "description": "Separate lab and company work packages, milestones, people, facilities and deliverables."
      },
      {
        "title": "Map contributions and funding sources",
        "description": "List cash and in-kind resources by party. Do not show the CRADA as a cash award to the company."
      },
      {
        "title": "Map IP, data and publication terms",
        "description": "Distinguish pre-existing rights from new inventions and any option to negotiate a license."
      },
      {
        "title": "Prepare the collaboration package for review",
        "description": "Include work plan, contributions, background IP and questions; obtain the lab\u2019s process and legal review."
      },
      {
        "title": "Track the agreement and research milestones",
        "description": "No work or execution is presumed. Record agreed terms and milestones only after confirmation."
      }
    ],
    "sections": [
      "Joint research objective",
      "Lab and company work packages",
      "Contributions and responsibility matrix",
      "Background IP and new invention treatment",
      "Data, publication and confidentiality",
      "Milestones and governance",
      "Unresolved terms and approvals"
    ],
    "sources": [
      {
        "label": "CRADA authority and no-funds rule, 15 USC 3710a",
        "url": "https://www.law.cornell.edu/uscode/text/15/3710a"
      },
      {
        "label": "USPTO technology-transfer overview",
        "url": "https://www.uspto.gov/ip-policy/patent-policy/technology-transfer"
      }
    ],
    "inquiry": "Would this joint research objective fit a CRADA at your lab? Please advise on mission fit, contributions, background IP and your review process.",
    "checked_on": "2026-10-11"
  },
  {
    "key": "icorps",
    "name": "I-Corps customer discovery",
    "category": "Customer discovery",
    "money": "Training support and permitted participation/customer-discovery expenses, subject to the program. Not general R&D funding.",
    "summary": "Test the market through structured interviews, mentoring and commercialization training.",
    "boundary": "Not a substitute for SBIR or other R&D funding. NSF institutional routes and NIH award-dependent offerings have different eligibility; check the current call.",
    "area": "validation",
    "checks": [
      "Which NSF regional/national or NIH offering is currently open and appropriate for this team?",
      "What institutional, prior-award, team and participation requirements apply?",
      "Which customer-discovery costs are allowed, and what work or expenses are excluded?"
    ],
    "steps": [
      {
        "title": "Choose and verify the current I-Corps route",
        "description": "Check NSF national/regional eligibility or the current NIH offering; do not assume a prior award makes the team eligible."
      },
      {
        "title": "Assemble the required team",
        "description": "Confirm entrepreneurial and technical leads, mentor and institutional submission responsibility for the chosen route."
      },
      {
        "title": "Draft the problem and customer hypotheses",
        "description": "Keep hypotheses distinct from completed interviews and evidence."
      },
      {
        "title": "Prepare interview and learning plans",
        "description": "Define segments, recruitment, interview questions and a learning log; never invent interview results."
      },
      {
        "title": "Prepare a restricted participation budget",
        "description": "Use the current offering\u2019s permitted expenses and requirements, not a general R&D budget."
      },
      {
        "title": "Track training and validated learning",
        "description": "Record real attendance and interviews, update assumptions and decide whether to pursue, pivot or stop."
      }
    ],
    "sections": [
      "Team and eligibility",
      "Technology and customer hypotheses",
      "Discovery goals and interview segments",
      "Interview guide and outreach drafts",
      "Participation plan and restricted budget",
      "Learning log and decision gates"
    ],
    "sources": [
      {
        "label": "NSF National I-Corps Teams",
        "url": "https://www.nsf.gov/funding/initiatives/i-corps/national-teams-applicants"
      },
      {
        "label": "NIH SEED programs",
        "url": "https://seed.nih.gov/"
      }
    ],
    "inquiry": "Could you confirm the current customer-discovery offering, eligibility route, team requirements and application process for this technology?",
    "checked_on": "2026-10-11"
  },
  {
    "key": "sbir_sttr",
    "name": "SBIR / STTR R&D",
    "category": "Funding",
    "money": "Competitive R&D award under the selected agency\u2019s grant or contract terms. Not guaranteed, and later phases are not automatic.",
    "summary": "Pursue small-business research funding when an actual solicitation and the company\u2019s eligibility fit.",
    "boundary": "SBIR and STTR have distinct rules. STTR requires a qualifying research-institution partnership; confirm work share and IP allocation against current rules.",
    "area": "funding",
    "checks": [
      "Does the company meet the current ownership, size, location and PI requirements?",
      "Does the exact solicitation fit the technical work and, for STTR, the partner/work-share rules?",
      "What rights, registrations, documents, budget rules and official deadlines apply?"
    ],
    "steps": [
      {
        "title": "Find an official current solicitation",
        "description": "Search and save the exact topic, status, agency and source. An old announcement is not an open opportunity."
      },
      {
        "title": "Resolve company, PI and partner eligibility",
        "description": "Capture evidence and unanswered questions rather than marking eligibility by inference."
      },
      {
        "title": "Check IP access and research scope",
        "description": "Separate a license application from award eligibility and confirm what rights are needed when."
      },
      {
        "title": "Prepare the technical and commercialization package",
        "description": "Use the actual solicitation\u2019s required sections, page limits and evaluation criteria."
      },
      {
        "title": "Validate budget, registrations and deadline",
        "description": "Keep alternatives separate. Confirm official deadline time, time zone and amendments."
      },
      {
        "title": "Review, submit externally and track outcomes",
        "description": "Human submission and confirmation only; record post-award obligations if an award actually occurs."
      }
    ],
    "sections": [
      "Technical problem and innovation",
      "Research objectives and methods",
      "Commercialization evidence",
      "Team and facilities",
      "Partner and IP arrangements",
      "Budget and justification",
      "Eligibility, registrations and required attachments"
    ],
    "sources": [
      {
        "label": "SBA SBIR/STTR",
        "url": "https://www.sbir.gov/"
      },
      {
        "label": "Official opportunity search",
        "url": "https://www.grants.gov/search-grants"
      }
    ],
    "inquiry": "Could you clarify the topic fit, submission requirements and unresolved eligibility questions for this solicitation?",
    "checked_on": "2026-10-11"
  },
  {
    "key": "federal_assistance",
    "name": "Grants & cooperative agreements",
    "category": "Funding",
    "money": "Financial assistance for an authorized public purpose; allowable costs, cost sharing and payments depend on the award.",
    "summary": "Find non-SBIR agency grants and financial-assistance cooperative agreements.",
    "boundary": "A financial-assistance cooperative agreement is not a CRADA. Substantial agency involvement distinguishes it from a grant; many calls do not admit for-profit startups.",
    "area": "funding",
    "checks": [
      "Does the opportunity explicitly allow this applicant type and proposed work?",
      "Is the instrument a grant or financial-assistance cooperative agreement, and what agency involvement is expected?",
      "What cost share, allowable costs, registrations, IP/data terms and reporting obligations apply?"
    ],
    "steps": [
      {
        "title": "Search official assistance opportunities",
        "description": "Search Grants.gov and the agency portal; review the actual notice and amendments."
      },
      {
        "title": "Check applicant and project eligibility",
        "description": "Do not equate a keyword match with eligibility. Record restrictions on organizations and geography."
      },
      {
        "title": "Map notice requirements and evaluation criteria",
        "description": "Build a compliance matrix tied to the current official notice."
      },
      {
        "title": "Draft the work plan and outcomes",
        "description": "Include measurable objectives, evaluation, partners and any substantial agency involvement."
      },
      {
        "title": "Prepare the budget and cost-share evidence",
        "description": "Verify allowable costs, reimbursement/advance terms and realistic cash flow."
      },
      {
        "title": "Review the application and post-award duties",
        "description": "A human submits; track financial/performance reporting, IP obligations and award conditions only when confirmed."
      }
    ],
    "sections": [
      "Public-purpose alignment and eligibility",
      "Work plan and measurable outcomes",
      "Team and partners",
      "Budget, cost share and justification",
      "Agency involvement and reporting",
      "IP, data and compliance",
      "Notice-specific attachments"
    ],
    "sources": [
      {
        "label": "Grants.gov opportunity search",
        "url": "https://www.grants.gov/search-grants"
      },
      {
        "label": "Cooperative agreements, 31 USC 6305",
        "url": "https://www.law.cornell.edu/uscode/text/31/6305"
      }
    ],
    "inquiry": "Could you clarify applicant eligibility, the funding instrument, cost-share requirements and the application process under this notice?",
    "checked_on": "2026-10-11"
  },
  {
    "key": "federal_contract",
    "name": "Federal contracts & BAA calls",
    "category": "Revenue",
    "money": "Payment for contracted work or deliverables under the awarded contract. Bidding is not payment.",
    "summary": "Sell R&D, prototypes, services or products to a federal buyer, directly or through a prime contractor.",
    "boundary": "A BAA is a solicitation approach, not a universal award type. Read the call to determine the actual instrument and agency-specific rules.",
    "area": "funding",
    "checks": [
      "Is there a real agency requirement, funded call or prime-contractor need that fits?",
      "What instrument, competition route, registrations, certifications and security rules apply?",
      "Which deliverables, acceptance criteria, IP/data rights, payment and compliance terms will govern?"
    ],
    "steps": [
      {
        "title": "Find an official requirement or BAA",
        "description": "Use SAM.gov or the agency\u2019s contracting/R&D portal. Verify that the notice is current and relevant."
      },
      {
        "title": "Qualify the buying route and requirements",
        "description": "Distinguish market research/RFIs, solicitations and awards; evaluate prime or subcontract routes."
      },
      {
        "title": "Build a compliance and data-rights matrix",
        "description": "Map instructions, clauses, deliverables, security/export controls and technical-data markings."
      },
      {
        "title": "Draft the technical approach and performance plan",
        "description": "Connect measurable work packages to the buyer\u2019s stated requirement, not only the technology."
      },
      {
        "title": "Prepare price/cost and delivery assumptions",
        "description": "Model acceptance, invoicing and cash flow; do not imply a bid or BAA guarantees funds."
      },
      {
        "title": "Review and track the contract lifecycle",
        "description": "Human offer/submission and signature only. Track actual award, deliverables, invoices and changes separately."
      }
    ],
    "sections": [
      "Requirement and instrument",
      "Technical approach",
      "Statement of work and deliverables",
      "Schedule and acceptance criteria",
      "Price/cost and payment assumptions",
      "IP/data rights and compliance",
      "Required representations and attachments"
    ],
    "sources": [
      {
        "label": "FAR BAA guidance",
        "url": "https://www.acquisition.gov/far/35.016"
      },
      {
        "label": "Federal contract opportunities",
        "url": "https://sam.gov/opportunities"
      }
    ],
    "inquiry": "Could you clarify the requirement, award instrument, submission route, deliverables and data-rights expectations for this opportunity?",
    "checked_on": "2026-10-11"
  },
  {
    "key": "other_transaction",
    "name": "Other transactions (OTs)",
    "category": "Funding",
    "money": "Negotiated research or prototype funding under an agency\u2019s authority and agreement. Cost sharing may apply.",
    "summary": "Explore eligible nontraditional research/prototype routes, including agency and consortium calls.",
    "boundary": "Not a standard FAR procurement or grant. Eligibility, contributions, IP and follow-on production conditions are agreement-specific; follow-on work is not automatic.",
    "area": "funding",
    "checks": [
      "Which agency authority and current research/prototype call applies?",
      "Does the team satisfy applicable participation or cost-sharing conditions?",
      "What IP/data rights, payment milestones and follow-on production conditions are negotiated?"
    ],
    "steps": [
      {
        "title": "Verify the agency authority and official call",
        "description": "Do not assume all agencies or consortia operate under identical rules."
      },
      {
        "title": "Check participation and consortium conditions",
        "description": "Document nontraditional participation, membership costs, eligibility and any cost-share requirements."
      },
      {
        "title": "Draft a prototype or research plan",
        "description": "Identify the mission need, testable objectives, work packages and measurable milestones."
      },
      {
        "title": "Model contributions, milestone payments and IP",
        "description": "Distinguish negotiated terms from assumptions and confirm data-rights protections."
      },
      {
        "title": "Review the agreement and transition approach",
        "description": "Seek legal review; identify any conditions for follow-on production without presuming an entitlement."
      },
      {
        "title": "Track authorized work and milestone acceptance",
        "description": "Record agreement execution, funded milestones and any follow-on award only with human confirmation."
      }
    ],
    "sections": [
      "Mission fit and authority",
      "Eligibility and team roles",
      "Prototype/research plan",
      "Milestones and acceptance",
      "Contributions and payment terms",
      "IP/data rights",
      "Transition assumptions and open terms"
    ],
    "sources": [
      {
        "label": "DoD OT policy and current guides",
        "url": "https://www.acq.osd.mil/asda/dpc/cp/policy/other-policy-areas.html"
      }
    ],
    "inquiry": "Could you confirm the applicable authority, participation conditions, milestone structure and IP/data-rights process for this OT opportunity?",
    "checked_on": "2026-10-11"
  },
  {
    "key": "prize",
    "name": "Prizes & challenge competitions",
    "category": "Funding",
    "money": "Prize money only if the stated rules and selection criteria are met. Usually not reimbursement for all development effort.",
    "summary": "Compete against a defined challenge or performance target.",
    "boundary": "Prize terms, eligibility, IP rights, testing, judging and payment differ by challenge. Entry is not an award or a paid contract.",
    "area": "funding",
    "checks": [
      "Is the competition open, and is this team eligible under the current rules?",
      "What technical threshold, judging process, submissions and official deadlines apply?",
      "What are the prize-payment, IP, data, publicity and participation-cost terms?"
    ],
    "steps": [
      {
        "title": "Find and verify the official challenge rules",
        "description": "Read amendments and distinguish current challenges from past winners."
      },
      {
        "title": "Check eligibility and ownership requirements",
        "description": "Confirm who can enter and which IP/data/publicity rights are retained or granted."
      },
      {
        "title": "Translate judging criteria into tests",
        "description": "Create measurable acceptance targets and a test/evidence plan."
      },
      {
        "title": "Budget the effort without assuming a win",
        "description": "Estimate team-funded costs and treat prize income as contingent."
      },
      {
        "title": "Prepare the demonstration and submission",
        "description": "Compile evidence, reproducibility details and required materials for human review."
      },
      {
        "title": "Track results and commercial follow-through",
        "description": "Only record a win/payment after confirmation; develop customer opportunities independently."
      }
    ],
    "sections": [
      "Eligibility and rules matrix",
      "Proposed solution",
      "Performance targets and test plan",
      "Demonstration evidence",
      "Entry costs and contingent prize",
      "IP/data conditions and required materials"
    ],
    "sources": [
      {
        "label": "NASA Centennial Challenges",
        "url": "https://www.nasa.gov/prizes-challenges-and-crowdsourcing/centennial-challenges/"
      }
    ],
    "inquiry": "Could you clarify eligibility, judging evidence, IP conditions and the submission process for this challenge?",
    "checked_on": "2026-10-11"
  },
  {
    "key": "facility_access",
    "name": "Lab facilities & sponsored work",
    "category": "Collaboration",
    "money": "You may pay for lab work or proprietary access. Some nonproprietary access is allocated without facility charges; it is not cash paid to you.",
    "summary": "Use unique equipment, testing or expertise through user agreements, sponsored research or DOE Strategic Partnership Projects.",
    "boundary": "Terms vary by lab. Publication, proprietary use, cost recovery, liability and IP differ; access does not itself grant a commercial patent license.",
    "area": "licensing",
    "checks": [
      "Which user-facility, sponsored-work or SPP agreement fits the planned work?",
      "Are results proprietary or publishable, and what access charges and IP/data terms apply?",
      "What proposal, scheduling, safety, export-control and payment requirements must be met?"
    ],
    "steps": [
      {
        "title": "Find a suitable facility and access route",
        "description": "Verify capabilities with the facility; do not assume available capacity."
      },
      {
        "title": "Choose proprietary or nonproprietary treatment",
        "description": "Clarify publication and data protection before sharing sensitive information."
      },
      {
        "title": "Write the experiment or sponsored-work scope",
        "description": "Define sample needs, measurements, deliverables and team responsibilities."
      },
      {
        "title": "Confirm costs, scheduling and IP terms",
        "description": "Ask for actual access terms or quotation; separate lab payments from business funding."
      },
      {
        "title": "Prepare access and safety documentation",
        "description": "Use the facility\u2019s current proposal, user agreement and training requirements."
      },
      {
        "title": "Track access, results and downstream rights",
        "description": "Retain original measurements separately from AI summaries and check any additional commercialization license needed."
      }
    ],
    "sections": [
      "Research/test objective",
      "Facility capability and access route",
      "Experimental or sponsored-work plan",
      "Proprietary treatment and publication",
      "Cost, schedule and responsibilities",
      "Safety and IP/data questions"
    ],
    "sources": [
      {
        "label": "DOE laboratory partnering guide",
        "url": "https://www.energy.gov/sites/default/files/2024-12/TTWG_Partnering_Guide.pdf"
      }
    ],
    "inquiry": "Could you advise on the correct facility or sponsored-work agreement, availability, costs, proprietary treatment and required access documents?",
    "checked_on": "2026-10-11"
  },
  {
    "key": "private_capital",
    "name": "Private capital & financing",
    "category": "Funding",
    "money": "Investors provide capital for negotiated ownership/rights; loans require repayment. Neither is government revenue.",
    "summary": "Combine founder capital, investors, strategic partners or debt with commercialization milestones.",
    "boundary": "Not a federal award. Dilution, repayment, covenants, securities law and licensing restrictions require professional review.",
    "area": "funding",
    "checks": [
      "What milestone and runway need does the financing cover?",
      "What dilution, repayment, governance and license restrictions can the company accept?",
      "Which traction, ownership, diligence and financial assumptions are evidenced versus unproven?"
    ],
    "steps": [
      {
        "title": "Define the milestone and financing need",
        "description": "Separate development budget, operating runway and royalty obligations."
      },
      {
        "title": "Choose financing routes to investigate",
        "description": "Compare investor capital, strategic funding, founder resources and debt without assuming availability."
      },
      {
        "title": "Prepare the evidence and diligence package",
        "description": "Collect IP access, cap table, customer evidence, technical risks and financial assumptions."
      },
      {
        "title": "Build financing and runway scenarios",
        "description": "Separate committed cash from possible awards and investment; include downside cases."
      },
      {
        "title": "Draft investor/lender materials for review",
        "description": "Use evidence-qualified claims and obtain appropriate financial/legal advice."
      },
      {
        "title": "Track discussions and actual commitments",
        "description": "Only record committed financing and received funds from confirmed documents, never from interest alone."
      }
    ],
    "sections": [
      "Milestone and use of funds",
      "Customer and technical evidence",
      "IP access and ownership",
      "Runway and financing scenarios",
      "Team and diligence checklist",
      "Unresolved financial/legal terms"
    ],
    "sources": [
      {
        "label": "SBA funding guidance",
        "url": "https://www.sba.gov/business-guide/plan-your-business/fund-your-business"
      }
    ],
    "inquiry": "Would this commercialization milestone fit your investment or financing criteria, and what diligence materials would you need to evaluate it?",
    "checked_on": "2026-10-11"
  },
  {
    "key": "paid_pilot",
    "name": "Paid pilots & commercial sales",
    "category": "Revenue",
    "money": "Customers pay for agreed deliverables, products or services. Interest, interviews and unsigned letters are not revenue.",
    "summary": "Validate a buying decision through paid evaluation, pilots, development partnerships or commercial sales.",
    "boundary": "A pilot is not automatically paid. Verify IP permissions, promised performance, regulatory claims, procurement terms and acceptance before committing.",
    "area": "commercialization",
    "checks": [
      "Who is the buyer and budget owner, and is payment actually authorized?",
      "Does the company have rights and capacity to deliver the proposed pilot or product?",
      "What price, success criteria, acceptance, liability, data and conversion terms will be agreed?"
    ],
    "steps": [
      {
        "title": "Qualify the buyer and purchasing process",
        "description": "Distinguish users, champions, decision-makers and the actual budget owner."
      },
      {
        "title": "Define a narrow, measurable paid pilot",
        "description": "Agree a problem, scope, baseline, success criteria and credible performance claims."
      },
      {
        "title": "Check IP permissions and delivery risks",
        "description": "A research license may not allow commercial sales; confirm permitted activities and regulatory requirements."
      },
      {
        "title": "Prepare scope, price and acceptance terms",
        "description": "Separate quoted, contracted, invoiced and received amounts; seek legal review of customer terms."
      },
      {
        "title": "Draft the customer proposal and rollout plan",
        "description": "Keep evidence and assumptions visible; no commitments or email are sent automatically."
      },
      {
        "title": "Track delivery, payment and conversion",
        "description": "Record real acceptance and receipts, then evaluate repeat sales or a production contract."
      }
    ],
    "sections": [
      "Buyer problem and qualification",
      "Pilot scope and success criteria",
      "Delivery and support plan",
      "Price and payment milestones",
      "IP, data, regulatory and liability questions",
      "Acceptance and commercial conversion"
    ],
    "sources": [
      {
        "label": "SBA business planning guidance",
        "url": "https://www.sba.gov/business-guide/plan-your-business/fund-your-business"
      }
    ],
    "inquiry": "Would a narrowly scoped paid pilot be useful? We would like to discuss the problem, budget owner, measurable success criteria, procurement process and payment terms.",
    "checked_on": "2026-10-11"
  },
  {
    "key": "patent_license",
    "name": "License or buy a patent",
    "category": "IP rights",
    "money": "You usually pay the patent owner: an option fee, then license fees and royalties, or a purchase price if they assign the patent to you. A patent that has expired or lapsed can generally be used without a license, but other live patents may still cover your product.",
    "summary": "Find patents from companies, universities or independent inventors that are not yet in products, anywhere in the world, and approach the owner.",
    "boundary": "A patent record shows who filed and whether it appears to be in force. It does not show whether anyone is selling a product, whether the owner will license, or that you are free to operate. Patents are territorial. Confirm the current owner in the official assignment record, and get a patent attorney's opinion before relying on any patent. General information, not legal advice.",
    "area": "licensing",
    "checks": [
      "Who owns this patent today, according to the official assignment record?",
      "Is it in force in the countries where you would sell, and when does it expire?",
      "Is it already used in a product or licensed to someone, and is the owner open to a conversation?"
    ],
    "steps": [
      {
        "title": "Confirm the owner and status",
        "description": "Check the official patent office record and the assignment record. The original applicant is not always the current owner, and status shown on search sites can be out of date."
      },
      {
        "title": "Understand what it really covers",
        "description": "Read the claims, not just the abstract, and note which countries it is filed in. A plain-English summary is a starting point, not a legal opinion."
      },
      {
        "title": "Look for signs it's already in use",
        "description": "Search for products, press releases, licenses and the owner's current business. Unknown is a fine answer; just don't assume it is unused."
      },
      {
        "title": "Prepare a respectful approach",
        "description": "Draft a short note to the owner or their licensing contact: who you are, what you want to build and what you're asking for. Nothing is sent for you."
      },
      {
        "title": "Negotiate an option or evaluation first",
        "description": "An option or evaluation license lets you test the market before committing to full royalties. Record real terms only once they are offered in writing."
      },
      {
        "title": "Get a freedom-to-operate review",
        "description": "Before you invest seriously, ask a patent attorney whether other patents could block your product, even if you license this one."
      }
    ],
    "sections": [
      "Patent identification and status",
      "What the claims cover (plain English, not a legal opinion)",
      "Current owner and contact",
      "Evidence of commercial use",
      "What we would ask for",
      "Risks and open questions"
    ],
    "sources": [
      {
        "label": "USPTO Patent Public Search",
        "url": "https://ppubs.uspto.gov/pubwebapp/"
      },
      {
        "label": "USPTO Assignment Center (ownership records)",
        "url": "https://assignmentcenter.uspto.gov/search/patent"
      },
      {
        "label": "WIPO PATENTSCOPE (international filings)",
        "url": "https://patentscope.wipo.int/search/en/search.jsf"
      },
      {
        "label": "EPO Espacenet (worldwide patents)",
        "url": "https://worldwide.espacenet.com/"
      },
      {
        "label": "USPTO: maintaining a patent (fees and expiry)",
        "url": "https://www.uspto.gov/patents/maintain"
      },
      {
        "label": "USPTO: technology transfer",
        "url": "https://www.uspto.gov/ip-policy/patent-policy/technology-transfer"
      }
    ],
    "inquiry": "I came across your patent and I am exploring whether to bring a product based on it to market. Would you be open to discussing an option or license, and who would be the right person to speak with?",
    "checked_on": "2026-10-18"
  },
  {
    "key": "sbir_track",
    "name": "Your SBIR path",
    "category": "SBIR / STTR",
    "money": "A federal agency pays your small business to do research and development, through a competitive grant or contract. You keep ownership of your company; the government takes no equity. Phase I tests whether the idea works, Phase II builds and demonstrates it, and Phase III is follow-on work paid with money outside the SBIR set-aside. Awards are competitive and never guaranteed.",
    "summary": "Get paid by a federal agency to develop technology, step by step, starting from government research or your own idea.",
    "boundary": "SBIR and STTR were reauthorized through September 30, 2031 (Public Law 119-83, signed April 13, 2026) after a six-month lapse. Agencies are reopening solicitations on their own schedules, and starting in fiscal year 2027 agencies must cap how many proposals one company can submit. Topics, award amounts, eligibility details and deadlines come only from the current official solicitation.",
    "area": "funding",
    "checks": [
      "Which agency and topic fit this work, and is that solicitation open right now?",
      "Will this be SBIR (your company leads) or STTR (a formal research-institution partner), and who is the partner?",
      "Does the company meet the current SBA size, ownership and principal-investigator rules? You confirm this yourself; the app never assumes it."
    ],
    "steps": [
      {
        "title": "Pick the research you'll build on",
        "description": "Choose a federal lab invention, a university technology or your own idea. SBIR pays for your company's R&D. It does not require a lab invention, but building on proven government research can strengthen your proposal."
      },
      {
        "title": "Ask the lab about rights and partnership",
        "description": "Contact the lab's technology-transfer office about an evaluation license, a commercial license or a CRADA. For STTR, ask whether the lab or a university will be your research partner. A license usually costs you fees or royalties; the lab does not pay you."
      },
      {
        "title": "Check that your company can apply",
        "description": "SBIR goes to for-profit U.S. small businesses, generally 500 employees or fewer including affiliates, that meet SBA ownership rules. For SBIR, the principal investigator is normally employed primarily by the company. STTR needs a formal research-institution partner and set work shares. Confirm every rule in the current SBA directive and the solicitation."
      },
      {
        "title": "Register your company early",
        "description": "Register in SAM.gov for a Unique Entity ID, then in the SBA company registry on SBIR.gov, then in the agency's own submission portal. Registrations can take weeks, so start before you find the perfect topic."
      },
      {
        "title": "Find a topic that fits",
        "description": "Match your work to an open topic, or to an open-topic solicitation where the agency offers one. Some agencies ask for a short pitch first. Save the official solicitation with its real deadline."
      },
      {
        "title": "Write and submit your Phase I proposal",
        "description": "Prepare the technical approach, commercialization plan, budget and letters of support in the solicitation's required format. You review and submit it yourself. This app never submits on your behalf."
      },
      {
        "title": "Plan for Phase II and customers",
        "description": "While Phase I runs, line up evidence and customer interest for Phase II and a path to revenue or Phase III work. Record real outcomes only."
      }
    ],
    "sections": [
      "Technical problem and innovation",
      "Phase I objectives and work plan",
      "Commercialization plan",
      "Team and facilities",
      "Lab or partner relationship and IP rights",
      "Budget outline",
      "Eligibility and registrations (self-confirmed)"
    ],
    "sources": [
      {
        "label": "SBIR.gov (SBA)",
        "url": "https://www.sbir.gov/about"
      },
      {
        "label": "Public Law 119-83 (SBIR/STTR reauthorization)",
        "url": "https://www.congress.gov/119/plaws/publ83/PLAW-119publ83.pdf"
      },
      {
        "label": "13 CFR 121.702 (SBIR/STTR size and ownership)",
        "url": "https://www.ecfr.gov/current/title-13/section-121.702"
      },
      {
        "label": "SAM.gov entity registration",
        "url": "https://sam.gov/"
      },
      {
        "label": "Department of War SBIR/STTR portal",
        "url": "https://www.dodsbirsttr.mil/submissions/login"
      },
      {
        "label": "NSF America's Seed Fund",
        "url": "https://seedfund.nsf.gov/"
      },
      {
        "label": "USPTO: technology transfer",
        "url": "https://www.uspto.gov/ip-policy/patent-policy/technology-transfer"
      }
    ],
    "inquiry": "We are considering an SBIR or STTR proposal built on this technology. Could you tell us whether it is available for an evaluation or commercial license, what the process and typical terms look like, and whether your lab can serve as an STTR research partner?",
    "checked_on": "2026-10-18"
  },
  {
    "key": "getting_started",
    "name": "Your first plan",
    "category": "Getting started",
    "money": "First find a credible route. No license, funding, investment return or customer revenue is assumed.",
    "summary": "Turn your starting idea into one useful next step.",
    "boundary": "A researched starting point, not an eligibility decision or an agreement. Verify current rules and counterparties before acting.",
    "area": "general",
    "checks": [
      "What do we know from an authoritative source, rather than an assumption?",
      "Who owns the rights or makes the relevant financing decision?",
      "What is the smallest useful next step, and what must be verified first?"
    ],
    "steps": [
      {
        "title": "Review your first plan",
        "description": "Read the short research result. Check that it reflects what you want to build or finance."
      },
      {
        "title": "Choose one promising lead",
        "description": "Pick a sourced technology, partner or financing route to investigate. You do not need to decide the whole business today."
      },
      {
        "title": "Prepare your first conversation",
        "description": "Check the right recipient and prepare the questions you want to ask. Nothing is sent on your behalf."
      }
    ],
    "sections": [
      "Your idea in plain English",
      "What we found and how we know",
      "Possible routes, not eligibility approvals",
      "One useful next step",
      "Questions still to answer"
    ],
    "sources": [
      {
        "label": "USPTO: how research reaches the market",
        "url": "https://www.uspto.gov/ip-policy/patent-policy/technology-transfer"
      }
    ],
    "inquiry": "Could you help identify the appropriate technology-transfer or program contact and the first requirements to verify?",
    "checked_on": "2026-10-11"
  }
];
export const pathwayByKey = (key:string) => PATHWAYS.find(p=>p.key===key);
export const OPPORTUNITY_PROGRAMS = ['Other','SBIR','STTR','SBIR/STTR','Grant','Cooperative agreement','Contract','Other transaction','Prize','I-Corps','Private capital','Paid pilot','Loan','Loan guarantee','Insurance','Tax incentive','Fund leverage','Technical assistance','Export support'];
export const programPathway = (program:string) => ({Grant:'federal_assistance','Cooperative agreement':'federal_assistance',Contract:'federal_contract','Other transaction':'other_transaction',Prize:'prize','I-Corps':'icorps','Private capital':'private_capital','Paid pilot':'paid_pilot'}[program] || (program.includes('SBIR')||program==='STTR'?'sbir_sttr':null));

export {PROGRAM_REFERENCES,type ProgramReference} from './programs.ts';

export function packetSections(program:string):string[]{
 const specific:Record<string,string[]>={
  Loan:['Business and financing purpose','Use of proceeds','Financial statements and cash flow','Repayment plan and stress cases','Borrower equity, collateral and guarantees','Lender requirements and missing evidence'],
  'Loan guarantee':['Borrower and lender eligibility','Underlying project and use of proceeds','Repayment and credit analysis','Guarantee coverage, fees and exclusions to verify','Collateral, equity and risk allocation','Lender and agency approval steps'],
  Insurance:['Insured activity and exposure','Applicant, country and counterparty eligibility','Coverage sought and exclusions','Premium and claims conditions to verify','Risk controls and supporting evidence'],
  'Tax incentive':['Applicable regime and investment date','Investor, entity and geographic eligibility','Structure, qualified uses and holding periods','Tax model assumptions and recapture risks','Evidence and qualified tax/legal review'],
  'Fund leverage':['Fund strategy and eligible investments','Manager track record and governance','Private capital and commitments','Leverage structure, coverage and repayment','Compliance and reporting','Licensing requirements and adviser review'],
  'Technical assistance':['Business challenge and desired support','Provider and participant eligibility','Scope, time commitment and fees','Information to prepare','Next meeting and expected outcomes'],
  'Export support':['Product and target export market','Exporter and transaction eligibility','Buyer, country and U.S.-content checks','Use of support and financing or reimbursement terms','Export controls and commercial risks','Required evidence and agency review']
 };
 return specific[program]??pathwayByKey(programPathway(program)??'')?.sections??['Purpose and fit','Applicant / participant eligibility','Proposed work and outcomes','Budget, financing terms and obligations','IP and commercial conditions','Required evidence and approvals'];
}
