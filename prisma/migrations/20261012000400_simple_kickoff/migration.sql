INSERT INTO pathway_catalog(key,spec) VALUES('getting_started',$json${"key": "getting_started", "name": "Your first plan", "category": "Getting started", "money": "First find a credible route. No license, funding, investment return or customer revenue is assumed.", "summary": "Turn your starting idea into one useful next step.", "boundary": "A researched starting point, not an eligibility decision or an agreement. Verify current rules and counterparties before acting.", "area": "general", "checks": ["What do we know from an authoritative source, rather than an assumption?", "Who owns the rights or makes the relevant financing decision?", "What is the smallest useful next step, and what must be verified first?"], "steps": [{"title": "Review your first plan", "description": "Read the short research result. Check that it reflects what you want to build or finance."}, {"title": "Choose one promising lead", "description": "Pick a sourced technology, partner or financing route to investigate. You do not need to decide the whole business today."}, {"title": "Prepare your first conversation", "description": "Check the right recipient and prepare the questions you want to ask. Nothing is sent on your behalf."}], "sections": ["Your idea in plain English", "What we found and how we know", "Possible routes, not eligibility approvals", "One useful next step", "Questions still to answer"], "sources": [{"label": "USPTO: how research reaches the market", "url": "https://www.uspto.gov/ip-policy/patent-policy/technology-transfer"}], "inquiry": "Could you help identify the appropriate technology-transfer or program contact and the first requirements to verify?", "checked_on": "2026-10-11"}$json$::jsonb);
UPDATE pathway_catalog SET spec=$json${"key": "federal_license", "name": "License a federal invention", "category": "IP rights", "money": "Usually you pay fees or royalties to the licensor. The lab does not normally pay you.", "summary": "Secure exclusive, partially exclusive or nonexclusive rights to a federal invention.", "boundary": "A license is permission to use IP, not an R&D award. Verify ownership, availability, field of use and manufacturing obligations with the licensor.", "area": "licensing", "checks": ["Who owns the invention, and what patent rights are currently available?", "What field, territory, exclusivity and U.S. manufacturing obligations apply?", "What fees, royalties, diligence milestones and evidence of capability will the lab require?"], "steps": [{"title": "Confirm ownership and the licensing contact", "description": "Find the official listing, patent identifiers and authorized licensing office. Record sources; a listing alone is not a license."}, {"title": "Define the rights you need", "description": "Compare evaluation, option, nonexclusive and exclusive rights, including field and geography."}, {"title": "Prepare a development and marketing plan", "description": "Describe customer problem, evidence, development milestones, resources, commercialization timeline and risks. 35 USC 209 requires a development or marketing plan for a federal patent license."}, {"title": "Build a licensing cost and obligations model", "description": "Keep upfront fees, patent costs, minimum royalties, running royalties and reporting obligations separate from award income. Do not invent terms."}, {"title": "Review the application and negotiate with the licensor", "description": "Obtain the office\u2019s actual forms and seek legal review; draft correspondence remains unsent."}, {"title": "Track execution and ongoing compliance", "description": "Only record execution after human confirmation. Track diligence, reporting, payments and any manufacturing commitments."}], "sections": ["Commercialization summary", "Technology and requested rights", "Customer problem and evidence", "Development milestones and resources", "Go-to-market and manufacturing plan", "Financial assumptions and royalty scenarios", "Risks, diligence and open terms"], "sources": [{"label": "Federal licensing requirements, 35 USC 209", "url": "https://www.law.cornell.edu/uscode/text/35/209"}, {"label": "USPTO technology-transfer overview", "url": "https://www.uspto.gov/ip-policy/patent-policy/technology-transfer"}], "inquiry": "Could you confirm the current availability of these rights, the licensing process, and your required commercialization-plan format?", "checked_on": "2026-10-11"}$json$::jsonb WHERE key='federal_license';
UPDATE pathway_catalog SET spec=$json${"key": "university_license", "name": "University / Bayh-Dole license", "category": "IP rights", "money": "You pay the institution under negotiated terms, often royalties, fees or equity. This is not an SBIR-style award.", "summary": "Commercialize university-owned IP, including inventions arising from federally funded research.", "boundary": "Federal funding does not mean the government owns the patent. Confirm chain of title and the institution\u2019s authority; retained government rights and other obligations may apply.", "area": "licensing", "checks": ["Has the institution confirmed ownership, inventorship and its authority to license?", "Is this a federally funded subject invention, and which government or sponsor rights remain?", "What license scope, diligence, patent reimbursement, royalty, equity and manufacturing terms apply?"], "steps": [{"title": "Find the institution\u2019s technology-transfer office", "description": "Verify the official university listing and authorized contact, not only a lab or researcher."}, {"title": "Check title, funding and encumbrances", "description": "Ask about assignments, federal funding, sponsor rights, co-owners and prior licenses."}, {"title": "Prepare the commercialization case", "description": "Build market evidence, development plan, team capability and requested rights."}, {"title": "Model institutional license economics", "description": "Separate royalties, equity, patent expenses, milestone payments and minimums from cash available to the company."}, {"title": "Review option and license documents", "description": "Ask counsel to review scope, diligence, retained rights, U.S. manufacturing, publication and improvements."}, {"title": "Track license performance", "description": "Record execution only on confirmation; track reporting, payments and diligence obligations."}], "sections": ["Invention and chain-of-title questions", "Requested license scope", "Commercialization and development plan", "Team and resources", "Economics and diligence", "Government and sponsor rights", "Unresolved legal terms"], "sources": [{"label": "NIST Bayh-Dole framework", "url": "https://www.nist.gov/tpo/policy-coordination/bayh-dole-act"}, {"label": "NIST ownership and reporting FAQs", "url": "https://www.nist.gov/tpo/policy-coordination/bayh-dole-act/2018-faqs"}, {"label": "USPTO technology-transfer overview", "url": "https://www.uspto.gov/ip-policy/patent-policy/technology-transfer"}], "inquiry": "Could your technology-transfer office confirm ownership, funding-related obligations, available rights and your startup licensing process?", "checked_on": "2026-10-11"}$json$::jsonb WHERE key='university_license';
UPDATE pathway_catalog SET spec=$json${"key": "crada", "name": "CRADA collaboration", "category": "Collaboration", "money": "The lab can contribute people, facilities, equipment and IP, but not funds to the non-federal partner under 15 USC 3710a.", "summary": "Work jointly with a federal lab on a mission-aligned research effort.", "boundary": "A CRADA is not a procurement contract or a financial-assistance cooperative agreement. Budget the company\u2019s own costs and any payments to the lab separately.", "area": "licensing", "checks": ["Does the proposed work align with the lab\u2019s mission and available resources?", "Who supplies each resource and pays each cost, without lab funds flowing to the non-federal partner under the CRADA?", "How will background IP, new inventions, licensing options, publication and protected data be handled?"], "steps": [{"title": "Identify a lab collaborator and mission fit", "description": "Verify the official partnership office and relevant technical group."}, {"title": "Write a joint statement of work", "description": "Separate lab and company work packages, milestones, people, facilities and deliverables."}, {"title": "Map contributions and funding sources", "description": "List cash and in-kind resources by party. Do not show the CRADA as a cash award to the company."}, {"title": "Map IP, data and publication terms", "description": "Distinguish pre-existing rights from new inventions and any option to negotiate a license."}, {"title": "Prepare the collaboration package for review", "description": "Include work plan, contributions, background IP and questions; obtain the lab\u2019s process and legal review."}, {"title": "Track the agreement and research milestones", "description": "No work or execution is presumed. Record agreed terms and milestones only after confirmation."}], "sections": ["Joint research objective", "Lab and company work packages", "Contributions and responsibility matrix", "Background IP and new invention treatment", "Data, publication and confidentiality", "Milestones and governance", "Unresolved terms and approvals"], "sources": [{"label": "CRADA authority and no-funds rule, 15 USC 3710a", "url": "https://www.law.cornell.edu/uscode/text/15/3710a"}, {"label": "USPTO technology-transfer overview", "url": "https://www.uspto.gov/ip-policy/patent-policy/technology-transfer"}], "inquiry": "Would this joint research objective fit a CRADA at your lab? Please advise on mission fit, contributions, background IP and your review process.", "checked_on": "2026-10-11"}$json$::jsonb WHERE key='crada';
CREATE OR REPLACE FUNCTION create_pathway_plan(target_project uuid, selected_pathway text) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE uid text:=public.app_user_id(); p projects%ROWTYPE; spec jsonb; path_id uuid; item jsonb; prev uuid; task_id uuid; packet text; sample_prefix text:=''; src text:='';
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT * INTO p FROM projects WHERE id=target_project AND user_id=uid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Project not found'; END IF;
 SELECT c.spec INTO spec FROM pathway_catalog c WHERE key=selected_pathway;
 IF spec IS NULL THEN RAISE EXCEPTION 'Unknown pathway'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(target_project::text||selected_pathway,0));
 SELECT id INTO path_id FROM project_pathways WHERE project_id=target_project AND pathway_key=selected_pathway;
 IF path_id IS NOT NULL THEN RETURN jsonb_build_object('id',path_id,'created',false); END IF;
 INSERT INTO project_pathways(project_id,pathway_key) VALUES(target_project,selected_pathway) RETURNING id INTO path_id;
 IF EXISTS(SELECT 1 FROM technologies WHERE id=p.technology_id AND is_sample) THEN sample_prefix:='[SAMPLE] '; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(spec->'steps') LOOP
   INSERT INTO tasks(project_id,pathway_id,title,description,area,priority,created_by,depends_on)
   VALUES(target_project,path_id,sample_prefix||(item->>'title'),item->>'description',spec->>'area',2,'template',prev) RETURNING id INTO task_id;
   prev:=task_id;
 END LOOP;
 FOR item IN SELECT value FROM jsonb_array_elements(spec->'checks') LOOP
   INSERT INTO questions(project_id,pathway_id,kind,area,text,blocking) VALUES(target_project,path_id,'question',spec->>'area',sample_prefix||(item#>>'{}'),true);
 END LOOP;
 FOR item IN SELECT value FROM jsonb_array_elements(spec->'sources') LOOP
   src:=src||E'
- '||(item->>'label')||': '||(item->>'url');
 END LOOP;
 packet:='# '||sample_prefix||(spec->>'name')||E' working plan

Planning template, not verified evidence, an executed agreement or an award. Nothing has been sent or submitted. General information, not legal advice.

';
 IF sample_prefix<>'' THEN packet:=packet||E'Fictional demonstration. Do not submit or contact real counterparties using these facts.

'; END IF;
 packet:=packet||'## Money flow'||E'
'||(spec->>'money')||E'

'||(spec->>'boundary')||E'

## Recorded project context (not independently verified)
'||p.name||E'
Problem: '||p.problem||E'
Customer: '||p.target_customer||E'
Working thesis: '||p.business_thesis||E'
';
 FOR item IN SELECT value FROM jsonb_array_elements(spec->'sections') LOOP
   packet:=packet||E'
## '||(item#>>'{}')||E'
To prepare. Add sourced facts, separate estimates and hypotheses, and identify unanswered questions.
';
 END LOOP;
 packet:=packet||E'
## Guidance sources
General guidance reviewed '||(spec->>'checked_on')||'. Recheck current program rules and all deadlines.'||src;
 INSERT INTO documents(project_id,pathway_id,kind,title,body,source_url,is_ai_generated)
 VALUES(target_project,path_id,'note',sample_prefix||(spec->>'name')||' working plan',packet,spec->'sources'->0->>'url',false);
 IF selected_pathway<>'getting_started' THEN
 INSERT INTO communications(project_id,pathway_id,area,direction,channel,status,subject,body)
 VALUES(target_project,path_id,spec->>'area','outbound','email','draft',sample_prefix||(spec->>'name')||' inquiry',sample_prefix||E'DRAFT FOR HUMAN REVIEW. Not sent. Verify the recipient and every claim before use.

Hello [verified recipient],

'||(spec->>'inquiry')||E'

Our recorded project concept (unverified): '||p.business_thesis||E'

[Your name and organization]');
 END IF;
 RETURN jsonb_build_object('id',path_id,'created',true);
END $$;
REVOKE ALL ON FUNCTION create_pathway_plan(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_pathway_plan(uuid,text) TO authenticated;

ALTER TABLE projects ADD COLUMN intake_key uuid;
ALTER TABLE projects ADD COLUMN kickoff_answers jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX projects_intake_unique ON projects(user_id,intake_key) WHERE intake_key IS NOT NULL;
CREATE FUNCTION create_simple_plan(request_key uuid, answers jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE uid text:=public.app_user_id(); pid uuid; tid uuid; path jsonb; idea text:=trim(answers->>'idea'); source text:=coalesce(answers->>'source','');
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF request_key IS NULL OR idea IS NULL OR length(idea)<3 OR length(idea)>1200 OR coalesce(answers->>'goal','') NOT IN ('discover','rights','funding','customers') OR coalesce(answers->>'role','') NOT IN ('founder','investor') OR coalesce(answers->>'starting','') NOT IN ('idea','link') THEN RAISE EXCEPTION 'Complete the three starting questions'; END IF;
 IF length(source)>2000 OR (source<>'' AND source!~* '^https?://[^[:space:]]+$') THEN RAISE EXCEPTION 'Use a public http or https source link'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid||request_key::text,0));
 SELECT id INTO pid FROM projects WHERE user_id=uid AND intake_key=request_key;
 IF pid IS NOT NULL THEN
  SELECT jsonb_build_object('id',id) INTO path FROM project_pathways WHERE project_id=pid AND pathway_key='getting_started';
  RETURN jsonb_build_object('projectId',pid,'pathwayId',path->>'id','created',false);
 END IF;
 INSERT INTO technologies(name,description,source_url,source_name,ip_info,origin_kind)
 VALUES(left(idea,90),idea,source,'Your starting idea; not independently verified','No technology availability or IP rights have been verified.','unknown') RETURNING id INTO tid;
 INSERT INTO projects(technology_id,name,status,business_thesis,problem,intake_key,kickoff_answers)
 VALUES(tid,left(idea,90),'validating_opportunity',idea,idea,request_key,answers) RETURNING id INTO pid;
 path:=create_pathway_plan(pid,'getting_started');
 RETURN jsonb_build_object('projectId',pid,'pathwayId',path->>'id','created',true);
END $$;
REVOKE ALL ON FUNCTION create_simple_plan(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_simple_plan(uuid,jsonb) TO authenticated;
