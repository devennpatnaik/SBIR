"""Generate the fixed, clearly fictional demo migration. Do not rerun after this migration is applied."""
from pathlib import Path
import json
class SQL(str): pass
def val(x):
    if isinstance(x,SQL): return x
    if x is None: return 'NULL'
    if isinstance(x,bool): return str(x).lower()
    if isinstance(x,(int,float)): return str(x)
    if isinstance(x,dict): return "'"+json.dumps(x).replace("'","''")+"'::jsonb"
    return "'"+str(x).replace("'","''")+"'"
lines=[]
def insert(table, **row):
    lines.append(f"INSERT INTO {table} ({', '.join(row)}) VALUES ({', '.join(val(v) for v in row.values())});")
def ref(s): return SQL(s)
def day(n): return ref(f'current_date + ({n})')
P,L,T,U,V,O,Q,R,C=[ref(x) for x in ['pid','lid','tid','uid2','vid','oid','oid2','prid','cid']]
S='[SAMPLE] '
DISCLAIMER='[SAMPLE] Fictional training scenario. All company facts, interviews, measurements, prices, schedules and funding examples are invented. No actual application, license, award or customer commitment exists. '
insert('labs',id=L,name=S+'Estuary Research Laboratory',agency=S+'Fictional federal laboratory',tto_name=S+'Research Partnerships Office',notes=DISCLAIMER+'The office and staff do not exist. All contacts use reserved .invalid addresses; do not send outreach.',agreement_types_offered='[SAMPLE] Evaluation license proposed for discussion, not confirmed.')
techs=[
(T,'Selective ammonia sensor cartridge','A replaceable electrochemical cartridge intended to measure ammonium in industrial wastewater. The proposed product combines a lab sensor, a rugged enclosure and operator alerts.','Wastewater treatment operations; process optimization, not regulatory reporting.','TRL 4 is a scenario assumption. Benchtop synthetic-water data only; field durability is untested.','Portable colorimetric kits; laboratory assays; installed ion-selective probes.',[4,3,3,4,3,2,3,3,4,3]),
(U,'Optical nutrient monitoring module','An optical flow-cell approach to wastewater nutrient monitoring. Attractive low consumables cost, but turbidity compensation and cleaning increase engineering risk.','Large plants with staffed maintenance teams.','[SAMPLE] TRL 3 assumption; no field validation.','Colorimetric kits; installed optical analyzers.',[4,3,3,3,2,2,3,2,2,3]),
(V,'Coating-based corrosion patch','A passive corrosion indicator for coated steel. Lower manufacturing complexity, but selling into infrastructure inspection would require a new buyer network.','Bridge and industrial tank maintenance.','[SAMPLE] TRL 4 assumption; coating compatibility untested.','Ultrasonic inspection; visual inspections.',[3,3,2,3,3,2,2,3,2,3])]
dims=['problem','market','wtp','advantage','maturity','licensing','sbir_fit','time_cost','founder_fit','scalability']
# Keep these keys equal to the ten scoring dimensions in the UI.
constants=Path('apps/untitled-app-6ac856247b02af3fede23b91/src/lib/constants.ts').read_text()
import re
dims=re.findall(r"\{ key: '([^']+)', label:.*?help:", constants)
assert len(dims)==10,dims
rationales=['Recurring operator sampling work is a plausible pain, not a proven market.','Beachhead is deliberately narrow; reachable-site counts need validation.','Simulated interviews show interest, not purchase commitments.','Differentiation depends on lower cleaning and calibration effort.','Bench work does not establish field reliability.','No license, patent number or availability confirmation exists.','Only a fictional funding exercise is linked; find a real open topic.','Six-month feasibility plan excludes commercial launch.','Scenario team has relevant engineering skills but lacks grant experience.','Unit economics and repeat consumable revenue are hypotheses.']
for i,(tid,name,desc,apps,mat,compet,scores) in enumerate(techs):
    insert('technologies',id=tid,lab_id=L,name=S+name,description=DISCLAIMER+desc,source_name='[SAMPLE] Authored scenario, not a fetched lab listing',lab_name=S+'Estuary Research Laboratory',agency=S+'Fictional federal laboratory',category='Water sensors' if i<2 else 'Infrastructure sensors',applications=S+apps,customers=S+('Industrial wastewater plant operators and environmental managers.' if i<2 else 'Infrastructure inspection teams.'),competitors=S+compet,maturity=mat,ip_info='[SAMPLE] No patent identifiers or real IP rights. Ownership, claims and freedom to operate are unresolved.',licensing_status='unknown',sbir_relevance='[SAMPLE] Potential research fit only. No real solicitation has been matched.',open_questions='[SAMPLE] Can the sensor tolerate fouling?\n[SAMPLE] Can evaluation rights be secured?',shortlisted=True,is_sample=True,last_reviewed_at=ref('now()'))
    insert('evaluations',technology_id=tid,scores={k:{'score':scores[j],'rationale':S+rationales[j],'evidence':'[SAMPLE] Scenario assumptions and simulated discovery interviews only; no verified external evidence.','confidence':'low'} for j,k in enumerate(dims)},assumptions=DISCLAIMER+'Compare relative risks, not absolute investment readiness.',missing_info='Real lab listing; patent status; field data; signed pilot interest; current official solicitation.')
insert('projects',id=P,technology_id=T,lab_id=L,name=S+'HarborTrace Instruments',status='proposal_in_preparation',application_summary=S+'Ammonia-monitoring hardware with replaceable cartridges for industrial wastewater operators.',business_thesis=S+'HarborTrace would help mid-sized industrial wastewater plants detect process changes sooner with less manual sampling. Start with 90-day operational pilots, not compliance reporting. The sensor cartridge was selected over an optical module and corrosion patch because the proposed team knows wastewater operations and can test one measurable problem. Demand, field reliability and licensing rights are still unproven.',target_customer=S+'Environmental managers at industrial sites with on-site wastewater treatment; operators are users, the plant manager controls pilot spend.',problem=S+'Manual grab samples leave gaps between measurements. Installed analyzers can require frequent cleaning. We need to prove that the proposed sensor reduces total operator effort, not merely that it measures ammonia.',licensing_status='researching',licensing_pathway='evaluation_license',licensing_pathway_notes=S+'Explore a six-month evaluation right before negotiating commercial rights. This is a proposed pathway, not an executed agreement. No assumed exclusivity, fees or royalties.',risks=S+'Matrix interference, fouling, unknown IP access, weak willingness-to-pay evidence, procurement delays and grant dependence. Stop if real-water tests or pilot economics fail.')
for frm,to,age,reason in [(None,'technology_selected',-28,'Selected the cartridge after comparing three fictional candidates.'),('technology_selected','validating_opportunity',-21,'Five simulated interviews show mixed interest, with maintenance a recurring objection.'),('validating_opportunity','investigating_licensing',-14,'Recorded unresolved IP questions; evaluation license is preferred, not secured.'),('investigating_licensing','proposal_in_preparation',-3,'Started a practice proposal in parallel with licensing research. No submission or funding.')]:
    insert('status_history',project_id=P,from_status=frm,to_status=to,reason=S+reason,created_at=ref(f'now() + interval \'{age} days\''))
for opp,name,prog,amount,days,status,reason in [(O,'Industrial water-monitoring feasibility','SBIR','$240,000 (illustrative budget, not an award ceiling)',30,'pursuing','Closest technical fit for the exercise. There is no real application portal.'),(Q,'Infrastructure inspection research partnership','STTR','$300,000 (illustrative only)',60,'rejected','Different customer and sensor use case; would add a research-partner dependency.')]:
    insert('opportunities',id=opp,agency=S+'Fictional funding agency',program=prog,solicitation_title=S+'Practice funding exercise; not an open call',solicitation_number='SAMPLE-ONLY',topic_number='DEMO-WATER' if opp==O else 'DEMO-INFRA',topic_title=S+name,phase='Phase I',award_type='[SAMPLE] Research grant exercise',technical_objective=S+'Demonstrate measurement repeatability in representative matrices, document interference and produce a credible field-test plan.',eligibility='[SAMPLE] Eligibility deliberately unresolved. A real application needs current ownership, size, PI employment and solicitation checks.',close_date=day(days),deadline_verified=False,award_amount=amount,duration='[SAMPLE] 6 months',required_work=S+'Bench calibration, interference testing, enclosure design, maintenance plan and customer validation.',required_documents='[SAMPLE] Research plan\n[SAMPLE] Budget justification\n[SAMPLE] Company and PI eligibility evidence',submission_system='[SAMPLE] No portal. Do not submit.',small_business_reqs='[SAMPLE] U.S. small-business and ownership eligibility must be checked for the actual program.',research_institution_reqs='[SAMPLE] For STTR, verify institution eligibility, work allocation and IP agreement.' if prog=='STTR' else '[SAMPLE] Subcontract limits must be checked against the actual call.',restrictions='[SAMPLE] All dates are relative demonstration dates, not official deadlines.',relevance='relevant' if opp==O else 'irrelevant',fit_notes=S+reason,source_text=DISCLAIMER+'This exercise is not source material from an agency.',is_sample=True)
    insert('project_opportunities',project_id=P,opportunity_id=opp,status=status,notes=S+reason)
insert('proposals',id=R,project_id=P,opportunity_id=O,title=S+'HarborTrace Phase I feasibility proposal',status='drafting',notes=DISCLAIMER+'Practice draft only. Do not submit these materials. No checklist item is confirmed against an actual solicitation.')
sections=[
('Technical problem and proposed solution','section','drafting','Operators need timely process measurements without increasing calibration and cleaning workload. HarborTrace proposes a replaceable ammonia-sensing cartridge plus an operator display. Intended use is operational monitoring, not permit-compliance reporting.','Document baseline sampling effort at real sites.'),
('Innovation and competitive advantage','section','needs_evidence','The proposed advantage is reduced maintenance burden at comparable accuracy. Do not claim better performance than installed probes until side-by-side testing measures accuracy, drift, cleaning time and cost.','Competitor specifications and independent head-to-head data.'),
('Research objectives and technical milestones','section','drafting','Objective 1, months 1-2: build five cartridges and test a 1-50 mg/L NH4-N range. Target error is <=10% or 0.5 mg/L, whichever is larger. Objective 2, months 3-4: test three wastewater matrices for 30 days, targeting <=10% drift after calibration. Objective 3, months 5-6: prepare a 90-day operational pilot with two sites and a written maintenance protocol. These are proposed gates, not achieved results.','Raw paired measurements, reference-method details, maintenance logs and QA protocol.'),
('Technical feasibility and preliminary evidence','section','needs_evidence','The fictional bench scenario has 18 synthetic-water measurements across three concentrations. Mean absolute error is assumed at 7%; this small, invented dataset says nothing about real-water fouling or commercial performance. No real experiment has occurred.','Actual lab report, raw data, replicates and method validation.'),
('Commercial applications and customer demand','section','needs_evidence','Five simulated interviews: three operators describe a meaningful problem, one partly agrees and one sees no need. Two express conditional pilot interest. None commits to buy. This is a small convenience sample, not market validation.','Real interviews, purchase-process map and nonbinding pilot-interest letters.'),
('Market and competition','section','drafting','A bottom-up exercise assumes 500 reachable sites at $4,800 annual consumables revenue each: $2.4M annual recurring potential, not a sourced market estimate. Existing manual tests and installed probes compete on cost, accuracy and maintenance. Validate the count and buyer budgets before using this estimate.','Sourced site counts, buyer budget evidence and competitor costs.'),
('Development and commercialization strategy','section','drafting','Complete six-month feasibility work first. Proceed to field pilots only if performance and IP gates pass. Convert to a paid product after reliability and procurement checks. Phase II is competitive, not guaranteed; private pilot revenue and other financing are alternatives.','Evaluation rights, pilot agreements and financing options.'),
('Project team and relevant expertise','section','drafting','Fictional team: Maya Chen, founder and instrumentation engineer; Luis Rivera, sensor chemist; part-time field-operations adviser still to recruit. Founder eligibility as PI and all employment commitments are unresolved. Names describe fictional personas, not real experts.','Actual CVs, employment commitments and PI eligibility review.'),
('Budget and justification','document','drafting','Illustrative six-month research budget: personnel $120,000; fringe $30,000; materials $24,000; external analytical testing $18,000; travel $6,000; indirect costs $42,000. Total $240,000. Fringe assumes 25% of personnel; indirect costs assume 21.2121% of the $198,000 direct-cost base. Neither rate is negotiated or approved. No fee or TABA is included. Verify allowable costs and subcontract limits.','Supplier quotes, rate basis and actual solicitation budget instructions.'),
('Company information, registrations and certifications','certification','needs_evidence','HarborTrace is a fictional pre-revenue U.S. startup with two founders. No real entity, UEI, SAM registration, SBIR registry ID or certifications exist. The demo does not mark any registration as completed.','Actual formation, ownership, size, registration and certifications.'),
('Research partners and subcontractors','section','drafting','An external analytical laboratory would compare sensor outputs with reference measurements; the proposed $18,000 service is a budget assumption. No partner has agreed to participate. This exercise is SBIR, not STTR.','Statement of work, quote and allowed work-allocation check.'),
('Letters of support / IP access evidence','evidence','needs_evidence','Request evidence of evaluation rights from the actual IP owner and pilot-interest letters from real sites. No letters exist in this demo, and no lab endorsement should be implied.','Authentic lab and pilot letters with permission to use them.')]
for i,(title,kind,status,draft,evidence) in enumerate(sections):
    insert('proposal_sections',proposal_id=R,title=S+title,kind=kind,required_status='confirm_in_solicitation',guidance='This is a practice outline. Confirm required sections, limits and format against a real solicitation.',draft=DISCLAIMER+draft,draft_is_ai_generated=True,evidence_needed=S+evidence,status=status,sort=i)
# A few completed tasks make progress visible, while the blockers remain honest.
tasks=[
('Write the business thesis','validation',-14,'done','Scenario team: Maya. Define buyer, problem and measurable benefit.','',None),
('Compare three candidate technologies','validation',-12,'done','Scenario team: Maya and Luis. Score all ten dimensions; keep confidence low until supported.','',None),
('Summarize five discovery interviews','validation',-7,'done','Scenario team: Maya. Three positive, one partial, one negative; two conditional pilots.','',None),
('Verify IP ownership and evaluation rights','licensing',3,'in_progress','Scenario owner: Maya. Ask the real lab for patent identifiers and evaluation terms before hardware work.','',None),
('Get the lab evaluation-rights response','licensing',5,'blocked','Scenario owner: Maya. Do not use lab IP commercially without appropriate rights.','No real lab permission or patent identifiers exist.',None),
('Review technical acceptance criteria','proposal',2,'todo','Scenario owner: Luis. Confirm range, error, drift and maintenance thresholds with prospective users.','',None),
('Validate supplier quotes and indirect-cost basis','proposal',7,'todo','Scenario owner: Maya. Reconcile the $240,000 budget and confirm cost rules.','',None),
('Check company and PI eligibility','funding',9,'todo','Scenario owner: Maya. Formation, ownership, size and PI employment are not yet verified.','',None),
('Find a real solicitation and verify its deadline','funding',10,'todo','The practice opportunity is fictional. Use an official agency source before planning any actual application.','',None),
('Request a local SBDC advising session','general',4,'todo','Business planning and registration guidance. This task is not an appointment or application.','',None),
('Perform an internal proposal review','proposal',21,'todo','Review technical plan, budget, risks and missing attachments. Do not submit the sample proposal.','',None)]
for i,(title,area,due,status,description,blocker,dep) in enumerate(tasks):
    row=dict(project_id=P,title=S+title,area=area,due_date=day(due),status=status,description=S+description,blocker=S+blocker if blocker else '',priority=1 if i in [3,4,5] else 2,created_by='template',completed_at=ref('now()') if status=='done' else None,evidence=S+'Completed only within the fictional scenario.' if status=='done' else '')
    if i==3: row['id']=ref('ip_task')
    if i==9: row['id']=ref('help_task')
    if area=='proposal': row['proposal_id']=R
    insert('tasks',**row)
ms=[('customer_discovery','Interview five more operators',14,'in_progress','Seek disconfirming evidence; recruit outside the founders\' network.'),('demand_evidence','Obtain two genuine pilot-interest letters',30,'todo','Conditional interview interest is not a sales commitment.'),('prototype','Build five bench cartridges',60,'blocked','Prototype work is gated by evaluation rights.'),('technical_performance','Pass 30-day real-water drift test',120,'todo','Target <=10% drift; record raw data and failures.'),('ip_licensing','Agree appropriate evaluation rights',30,'blocked','No license has been signed.'),('regulatory','Review intended-use and safety claims',90,'todo','Operational use only; no compliance-reporting claim without validation.'),('pilots','Complete two 90-day operational pilots',270,'todo','Contingent on technical performance and signed agreements.'),('manufacturing','Validate cartridge assembly yield and suppliers',300,'todo','Target 90% yield in a 50-unit batch; target is hypothetical.'),('partners','Contract a reference-testing laboratory',45,'todo','Budget $18,000; no agreement or quote yet.'),('phase2','Decide whether Phase II is justified',180,'todo','Use feasibility evidence and actual program rules. No automatic next award.'),('phase3','Test paid-pilot and private-financing options',300,'todo','No SBIR money assumed for Phase III or sales.'),('revenue','Secure first paid product order',365,'todo','Target only, not forecast revenue. Requires successful pilots and purchasing approval.')]
for cat,title,due,status,desc in ms:
    insert('tasks',project_id=P,title=S+title,description=S+desc,kind='milestone',roadmap_category=cat,area='commercialization',due_date=day(due),status=status,blocker=S+'Evaluation rights must be secured.' if status=='blocked' else '',depends_on=ref('ip_task') if cat in ['prototype','ip_licensing'] else None,created_by='template')
for kind,text,answer,block in [('risk','Will fouling erase the maintenance advantage?','',True),('eligibility','Does the actual company meet ownership, size and PI employment rules?','',True),('question','Which buyer can approve a pilot?','In the scenario, the plant manager controls pilot spend; verify with actual customers.',False),('assumption','Will operators pay $4,800 per year for consumables?','',False),('risk','Can cash last until a funding decision?','',False)]:
    insert('questions',project_id=P,opportunity_id=O if kind=='eligibility' else None,kind=kind,text=S+text,answer=S+answer if answer else '',status='answered' if answer else 'open',blocking=block,area='funding' if kind=='eligibility' else 'validation')
license_qs=[('patent_status','What patents and claims apply?','No real patent or application number has been supplied.'),('ownership','Who owns and can license the IP?','Fictional laboratory only; actual ownership must be documented.'),('availability','Is the intended field available?','No availability claim has been verified.'),('exclusivity','Is exclusivity necessary?','Initial preference is evaluation access; commercial exclusivity would need evidence and negotiation.'),('agreement_types','Which agreement supports the pilot?','Proposed evaluation license before a commercial license.'),('technical_assistance','Can inventors support adaptation?','Proposed two technical sessions; availability and cost unknown.'),('terms','What fees and diligence terms apply?','No quoted terms. Model license costs separately from research budget.'),('best_fit','What is the lowest-commitment next step?','Request evaluation terms and a technical discussion before committing funds.')]
for i,(topic,q,finding) in enumerate(license_qs):
    insert('licensing_items',project_id=P,topic=topic,question=q,finding=S+finding,confidence='hypothesis',status='investigating' if i<3 else 'open',sort=i,explainer='Treat this as a question for the actual IP owner. General information, not legal advice.')
insert('contacts',id=C,project_id=P,lab_id=L,technology_id=T,name=S+'Jordan Reed',role='[SAMPLE] Technology-transfer contact',organization=S+'Estuary Research Laboratory',email='jordan.reed@example.invalid',notes=DISCLAIMER+'Reserved non-deliverable address. No verified contact exists.')
insert('contacts',project_id=P,name=S+'Alex Morgan',role='[SAMPLE] Pilot-site operations lead',organization=S+'Rivermill Process Works',email='alex.morgan@example.invalid',notes=DISCLAIMER+'Fictional customer persona. Conditional interest, no purchase agreement.')
insert('agreements',project_id=P,agreement_type='evaluation_license',counterparty=S+'Estuary Research Laboratory',status='considering',key_terms=S+'Proposed six-month test-only access, defined field of use, no sale rights. All terms and fees subject to actual owner agreement.',notes=DISCLAIMER+'No executed document, signature or commitment.')
insert('communications',project_id=P,contact_id=C,direction='outbound',status='draft',to_address='jordan.reed@example.invalid',subject=S+'Request for evaluation terms and technical discussion',body=DISCLAIMER+'This is an unsent practice note. We are exploring an operational ammonia-monitoring product for industrial wastewater plants. Before testing lab IP, we need to understand ownership, permitted evaluation use, access to technical data and expected fees. Could an appropriate contact discuss these questions? No rights or commitments are assumed.')
insert('communications',project_id=P,direction='note',channel='meeting',status='logged',subject=S+'Internal licensing review',body=DISCLAIMER+'Maya and Luis prefer a limited evaluation arrangement. They have not contacted a real lab. Next step: identify an authentic technology and authorized transfer office.',occurred_at=ref("now() - interval '4 days'"))
interviews=[('Operator A','Rivermill Process Works','yes',True,'Grab samples three times per shift.','Would consider a time-limited pilot if calibration stays under 15 minutes per week. No budget commitment.','Cleaning, not dashboard features, would determine whether we use it.'),('Operator B','Pine Harbor Materials','yes',True,'Installed probe plus weekly lab checks.','Conditional pilot interest after independent performance data. Price not discussed.','We cannot add another daily cleaning job.'),('Manager C','West Inlet Packaging','partly',False,'Monthly lab service and process checks.','Pilot requires plant-manager approval and an environmental review.','Who owns the alarm response when the sensor is wrong?'),('Manager D','Clearbank Foods','no',False,'Existing analyzer meets needs.','No willingness to pay; current process is adequate.','Switching would add work without a clear benefit.'),('Operator E','Tideway Process Services','yes',False,'Portable colorimetric kits.','A $400/month consumables concept is worth investigating, not accepted.','Give us a maintenance cost comparison, not a new dashboard.')]
for i,(who,org,pain,pilot,solution,wtp,quote) in enumerate(interviews):
    insert('interviews',project_id=P,interviewee=S+who,organization=S+org,role='[SAMPLE] Wastewater operations persona',segment='[SAMPLE] Industrial wastewater',interview_date=day(-12+i),problem_confirmed=pain,pilot_interest=pilot,current_solution=S+solution,willingness_to_pay=S+wtp,key_quotes=S+'Invented quote: '+quote,notes=DISCLAIMER+'Simulated discovery exercise. Not actual customer evidence.',next_step=S+'Replace this example with a consented interview and a documented buying process.')
insert('program_tracking',project_id=P,program_id='sbdc',status='considering',task_id=ref('help_task'),notes='[SAMPLE] Consider a local business advisor. No appointment or enrollment. Official program information is separate from this fictional scenario.')
insert('program_tracking',project_id=P,program_id='score',status='considering',notes='[SAMPLE] Consider mentoring on a paid-pilot sales plan. No mentor assigned.')
docs=[
('Start here: company brief and demo guide','note', '''HarborTrace Instruments is a fictional pre-revenue venture. Its product concept is an ammonia-monitoring cartridge for industrial wastewater operators.
Team: Maya Chen (instrumentation and customer discovery), Luis Rivera (sensor chemistry). Both are fictional. A field-operations adviser is still needed. No real entity, registrations, patents, revenues or awards exist.
Current stage: practice Phase I proposal preparation, with unresolved IP access and field reliability. Licensing and proposal work can overlap; funding is not assumed.
Try this route: Dashboard > Discover > Compare > My Projects > Licensing > Funding > Proposal Workspace > Commercialization Roadmap > Documents. The guided-demo banner links every step.
Safe practice: edit the business thesis; complete the technical-criteria task; log an interview; edit a proposal section and export it. All sample dates move relative to the day you create the demo. Remove demo data deletes the entire sample workspace, including your edits, but leaves unrelated work alone.
Decision this week: can the team define an independent real-water test and secure evaluation rights? If not, pause product development.'''),
('Selection memo: why this technology','research','''Three fictional candidates were compared on all ten dimensions with low-confidence evidence. The ammonia cartridge fits the proposed founders and a reachable buyer better than the optical module or corrosion patch. It is not investment-ready. Licensing scores remain low because rights are unknown.
Go/no-go gates: documented evaluation rights; real-water performance within the proposed error/drift limits; two credible pilot sites; plausible maintenance savings. Failure of any gate triggers redesign or stopping, not automatic progression to Phase II.'''),
('Six-month research budget and company runway','note','''Research proposal exercise: personnel $120,000 + fringe $30,000 + materials $24,000 + analytical testing $18,000 + travel $6,000 + indirect costs $42,000 = $240,000. No fee or TABA included. All figures are estimates, not an allowable-cost determination.
Company cash scenario, separate from the proposed research award: $90,000 founder capital, $10,000 monthly pre-award burn, nine months of runway if burn is constant. Assume zero grant receipts and zero sales until they occur. A funding delay of four months consumes $40,000 and leaves $50,000. Maintain a three-month ($30,000) reserve; six months of spending reaches that threshold. Do not double-count founder cash as grant revenue.'''),
('Unit economics and reachable-market assumptions','research','''Hypothetical price: $3,000 installation hardware plus $400/month consumables per site. Hardware cost estimate $1,800 gives $1,200 (40%) gross profit before installation support. Consumables cost estimate $160/month gives $240 (60%) monthly gross profit before field support and warranty.
At ten sites, illustrative hardware revenue is $30,000 and annual consumables revenue is $48,000. The $78,000 total is a scenario, not a forecast or bookings. Support labor could erase the margin. At 500 reachable sites, consumables potential is $2.4M/year; 500 is an unsourced assumption that needs a bottom-up site list.
Test maintenance time, cartridge life, renewal rates, buyer approval limits and channel costs before trusting this model.'''),
('Technical test plan and acceptance gates','technical_evidence','''Proposed test range 1-50 mg/L NH4-N. Bench target: error <=10% or 0.5 mg/L, whichever is larger. Use paired reference measurements, five cartridges and blanks/standards. Independently define sample handling and interference controls.
Then test three representative wastewater matrices for 30 days, with a target <=10% drift after calibration. Track cleaning minutes, downtime, replacement rates and temperature. No claim of successful testing exists. If drift or fouling fails the gate, pause pilots and revise design.
After permission and safety reviews, plan two 90-day operational pilots. Never use this demonstration as a compliance-reporting method.'''),
('Customer-discovery synthesis','interview','''Five invented interviews: three confirm the problem, one partly agrees, one does not. Two express conditional pilot interest; zero signed letters, paid orders or committed budgets. This is training material only.
The strongest recurring objection is cleaning and calibration workload. A negative interview shows that a functioning incumbent can make switching unattractive. Next: recruit five genuine operators outside the founder network and ask about current spend, maintenance time, false alarms and purchase authority.'''),
('Risk register and stop rules','research','''Technical risk: fouling and interference. Owner Luis. Mitigation: paired real-water measurements. Stop if cleaning eliminates the labor benefit.
IP risk: no rights or verified ownership. Owner Maya. Mitigation: confirm claims, owner and evaluation scope. Stop protected-IP testing without permission.
Demand risk: interest may not become budget. Owner Maya. Mitigation: buyer interviews and pilot agreements. Do not call interest revenue.
Financial risk: nine-month initial cash runway, no guaranteed award. Owner Maya. Mitigation: reserve threshold and paid-pilot alternatives.
Regulatory risk: overclaiming compliance use. Obtain appropriate advice and validated methods before making such claims.'''),
('Practice solicitation: not an official call','solicitation','''This authored exercise asks for a six-month feasibility plan, a $240,000 illustrative budget, a team plan and evidence of IP access. It is not an official solicitation, deadline, eligibility determination or award.
Every proposal checklist item remains "Check solicitation". Before a real application, replace this record with an official source and check amendments, submission window/time zone, cost rules, PI employment, company eligibility and required attachments.'''),
('Licensing preparation checklist','legal','''Questions for the actual lab: Who owns the claims? Are there co-owners? What evaluation use is permitted? What data and inventor support are available? What fees, confidentiality limits, reporting and diligence requirements apply? What evidence of IP access will a funder require?
The demo includes only a proposed evaluation pathway and an unsent inquiry. It does not imply rights, permission, exclusivity or lab endorsement. General information, not legal advice.''')]
for title,kind,body in docs:
    insert('documents',project_id=P,technology_id=T,opportunity_id=O if kind=='solicitation' else None,kind=kind,title=S+title,body=DISCLAIMER+'\n\n'+body,is_ai_generated=True)
insert('sources',project_id=P,technology_id=T,claim='[SAMPLE] Accuracy, price and market-size assumptions',field='scenario assumptions',url='',evidence_level='hypothesis',excerpt='No external source: fictional scenario assumptions. Do not treat these as lab evidence.')
head="""-- Atomic, private demonstration workspace. No production or external records are seeded.
CREATE TABLE demo_workspaces (
  user_id text PRIMARY KEY DEFAULT auth.user_id(),
  project_id uuid NOT NULL,
  technology_ids uuid[] NOT NULL,
  opportunity_ids uuid[] NOT NULL,
  lab_id uuid NOT NULL,
  proposal_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE demo_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_select ON demo_workspaces FOR SELECT TO authenticated USING (user_id = auth.user_id());
CREATE POLICY own_insert ON demo_workspaces FOR INSERT TO authenticated WITH CHECK (user_id = auth.user_id());
CREATE POLICY own_update ON demo_workspaces FOR UPDATE TO authenticated USING (user_id = auth.user_id()) WITH CHECK (user_id = auth.user_id());
CREATE POLICY own_delete ON demo_workspaces FOR DELETE TO authenticated USING (user_id = auth.user_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON demo_workspaces TO authenticated;

-- SECURITY INVOKER is deliberate: all inserts/deletes are subject to the caller's RLS.
-- One transaction and a per-user lock make retries and concurrent tabs safe.
CREATE FUNCTION manage_demo(operation text DEFAULT 'create') RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  existing demo_workspaces%ROWTYPE;
  pid uuid := gen_random_uuid(); lid uuid := gen_random_uuid();
  tid uuid := gen_random_uuid(); uid2 uuid := gen_random_uuid(); vid uuid := gen_random_uuid();
  oid uuid := gen_random_uuid(); oid2 uuid := gen_random_uuid(); prid uuid := gen_random_uuid();
  cid uuid := gen_random_uuid(); ip_task uuid := gen_random_uuid(); help_task uuid := gen_random_uuid();
BEGIN
  IF auth.user_id() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF operation NOT IN ('create','remove') OR operation IS NULL THEN RAISE EXCEPTION 'Unknown demo operation'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('lab-to-market-demo:' || auth.user_id(), 0));
  SELECT * INTO existing FROM demo_workspaces WHERE user_id = auth.user_id();
  IF existing.user_id IS NOT NULL THEN
    IF operation = 'create' AND EXISTS (SELECT 1 FROM projects WHERE id=existing.project_id) THEN
      UPDATE projects SET archived=false WHERE id=existing.project_id;
      RETURN to_jsonb(existing);
    END IF;
    -- Deletes target only the caller's registered demo roots. RLS applies to every statement.
    DELETE FROM projects WHERE id=existing.project_id;
    DELETE FROM technologies WHERE id=ANY(existing.technology_ids) AND is_sample;
    DELETE FROM opportunities WHERE id=ANY(existing.opportunity_ids) AND is_sample;
    DELETE FROM labs WHERE id=existing.lab_id;
    DELETE FROM demo_workspaces WHERE user_id=auth.user_id();
  END IF;
  IF operation = 'remove' THEN RETURN jsonb_build_object('removed',true); END IF;
"""
foot="""
INSERT INTO demo_workspaces (project_id, technology_ids, opportunity_ids, lab_id, proposal_id)
VALUES (pid, ARRAY[tid,uid2,vid], ARRAY[oid,oid2], lid, prid);
RETURN (SELECT to_jsonb(d) FROM demo_workspaces d WHERE user_id=auth.user_id());
END $$;
REVOKE ALL ON FUNCTION manage_demo(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION manage_demo(text) TO authenticated;
"""
p=Path('prisma/migrations/20261012000000_complete_demo/migration.sql');p.parent.mkdir(exist_ok=True);p.write_text(head+'\n'.join(lines)+foot)
print(len(lines),'sample records; migration',p)
