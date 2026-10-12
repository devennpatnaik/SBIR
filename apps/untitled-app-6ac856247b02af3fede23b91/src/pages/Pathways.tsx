import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowLeft, BookOpen, FilePenLine, ListChecks, Loader2 } from 'lucide-react';
import { PATHWAYS, pathwayByKey, type Pathway } from '@project/pathways';
import { useQuery, updateRow, invalidate, fmtDate } from '../lib/data';
import { useActiveProjectId, navigate } from '../lib/router';
import { pathwayApi, openWorkflowChat, type ProjectPathway, type WorkflowRun } from '../lib/pathways';
import type { Project, Task, Question, Communication } from '../lib/types';
import { DocList } from '../components/DocList';
import { TaskList, QuestionList } from '../components/ProjectParts';
import { Badge, Button, Card, Disclosure, displayName, Empty, ErrorNote, InlineText, PageHeader, Select, SourceLink, Tabs, useAsync } from '../components/ui';

export function Pathways({id}:{id?:string}){
 const projects=useQuery<Project>('projects',q=>q.eq('archived',false).order('updated_at',{ascending:false}));
 const [active,setActive]=useActiveProjectId();const project=projects.data.find(p=>p.id===active)??projects.data[0];
 const plans=useQuery<ProjectPathway>('project_pathways',q=>q.eq('project_id',project?.id??'').order('created_at'),[project?.id],!!project);
 const [category,setCategory]=useState('All routes');const action=useAsync();const spec=id?pathwayByKey(id):undefined;
 const existing=plans.data.find(p=>p.pathway_key===id);
 const build=()=>action.run(async()=>{if(!project||!spec)return;await pathwayApi('/pathways/plan',{projectId:project.id,pathwayKey:spec.key});plans.reload();});
 return <div>
  {id&&<a href="#/pathways" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-600"><ArrowLeft size={15}/>All pathways</a>}
  <PageHeader title={spec?.name??'More than one way forward.'} subtitle={spec?.summary??'Combine the rights, resources, validation and money your idea needs. A license, a collaboration and a funding award are different things.'}/>
  {projects.data.length>1?<div className="mb-7 max-w-sm"><Select aria-label="Project for pathways" value={project?.id} onChange={e=>setActive(e.target.value)} options={projects.data.map(p=>[p.id,displayName(p.name)] as [string,string])}/></div>:project&&<p className="mb-7 text-sm text-slate-500">For {displayName(project.name)}</p>}
  <ErrorNote error={action.error||plans.error||projects.error}/>
  {id&&!spec?<Empty title="Pathway not found"/>:spec?<>
   <section className="pathway-money"><p className="eyebrow">HOW MONEY AND RESOURCES MOVE</p><h2 className="editorial">{spec.money}</h2><p>{spec.boundary}</p></section>
   {existing?<Plan key={existing.id} plan={existing} spec={spec}/>:<>
    <div className="plan-start"><div><h2 className="editorial">Make this a working plan.</h2><p>Creates six connected tasks, three open questions, a preparation outline and an unsent inquiry. Reopening preserves your edits. Nothing is sent, signed or submitted.</p></div><Button variant="primary" busy={action.busy} disabled={projects.loading||plans.loading} onClick={()=>project?void build():navigate('discover')}>{project?'Build this plan':'Start with a technology'}</Button></div>
    <div className="pathway-step-preview">{spec.steps.map((s,i)=><div key={s.title}><span>{String(i+1).padStart(2,'0')}</span><div><h3>{s.title}</h3><p>{s.description}</p></div></div>)}</div><Guidance spec={spec}/>
   </>}
  </>:<>
   {!!plans.data.length&&<div className="my-pathways"><p className="eyebrow">YOUR PROJECT’S PATHWAYS</p><div>{plans.data.map(p=><a href={`#/pathways/${p.pathway_key}`} key={p.id}>{pathwayByKey(p.pathway_key)?.name}<span>{p.status==='active'?'Working':p.status}</span><ArrowUpRight size={15}/></a>)}</div></div>}
   <Tabs tabs={['All routes','IP rights','Collaboration','Customer discovery','Funding','Revenue'].map(x=>[x,x] as [string,string])} value={category} onChange={setCategory}/>
   <div className="pathway-grid">{PATHWAYS.filter(p=>p.key!=='getting_started'&&(category==='All routes'||p.category===category)).map(p=><article key={p.key} className="pathway-card"><p className="eyebrow">{p.category}</p><h2 className="editorial"><a href={`#/pathways/${p.key}`}>{p.name}</a></h2><p>{p.summary}</p><div className="pathway-card-money">{p.money}</div><a className="pathway-card-link" href={`#/pathways/${p.key}`}>{plans.data.some(x=>x.pathway_key===p.key)?'Open your plan':'Explore this route'}<ArrowUpRight size={18}/></a></article>)}</div>
   <p className="mt-8 text-xs leading-relaxed text-slate-500">These are major pathway categories, not a complete list of programs or an eligibility decision. They can be combined. General information, not legal, tax or investment advice. Current calls and counterparties set the actual terms.</p>
  </>}
 </div>;
}
const ACTIONS=[{key:'research',title:'Research the fit',note:'Find authoritative guidance, the right office and unanswered questions.',Icon:BookOpen},{key:'draft',title:'Draft the packet',note:'Use your project facts to prepare route-specific materials and an unsent inquiry.',Icon:FilePenLine},{key:'review',title:'Review readiness',note:'Check requirements, evidence, costs, IP and gaps before you act.',Icon:ListChecks}];
function Plan({plan,spec}:{plan:ProjectPathway;spec:Pathway}){
 const tasks=useQuery<Task>('tasks',q=>q.eq('pathway_id',plan.id).order('created_at'),[plan.id]);
 const questions=useQuery<Question>('questions',q=>q.eq('pathway_id',plan.id).order('created_at'),[plan.id]);
 const comms=useQuery<Communication>('communications',q=>q.eq('pathway_id',plan.id).order('created_at'),[plan.id]);
 const jobs=useQuery<WorkflowRun>('workflow_runs',q=>q.eq('pathway_id',plan.id).order('created_at',{ascending:false}),[plan.id]);
 const [tab,setTab]=useState('steps');const action=useAsync();const keys=useRef<Record<string,string>>({});const [pollError,setPollError]=useState<string|null>(null);
 const running=jobs.data.filter(j=>j.status==='running');const runKey=running.map(j=>j.id).join(',');
 useEffect(()=>{if(!runKey)return;let alive=true;const tick=async()=>{try{await Promise.all(runKey.split(',').map(id=>pathwayApi(`/pathways/runs/${id}`)));if(alive){setPollError(null);invalidate();}}catch(e){if(alive)setPollError(e instanceof Error?e.message:'Could not refresh the action.');}};void tick();const timer=setInterval(()=>void tick(),5000);return()=>{alive=false;clearInterval(timer);};},[runKey]);
 const start=(key:string)=>action.run(async()=>{keys.current[key]??=crypto.randomUUID();await pathwayApi('/pathways/run',{pathwayId:plan.id,action:key,requestKey:keys.current[key]});delete keys.current[key];jobs.reload();});
 const done=tasks.data.filter(t=>t.status==='done').length;const open=questions.data.filter(q=>q.status==='open').length;
 return <>
  <div className="pathway-actions">{ACTIONS.map(a=><button type="button" key={a.key} disabled={action.busy||running.some(j=>j.action===a.key)} onClick={()=>void start(a.key)}><a.Icon size={20}/><h3>{a.title}</h3><p>{a.note}</p><span>{running.some(j=>j.action===a.key)?'Working…':'Create an AI draft ↗'}</span></button>)}</div>
  <p className="mb-6 text-xs text-slate-500">These actions save new AI-labeled drafts, preserve your originals and continue after you leave. No automatic sending, submission, signatures or payments.</p>
  <ErrorNote error={action.error||pollError||jobs.error||tasks.error||questions.error||comms.error}/>
  {!!jobs.data.length&&<div className="workflow-runs" aria-live="polite">{jobs.data.slice(0,6).map(j=><div key={j.id}><div className="flex flex-wrap items-center gap-2">{j.status==='running'&&<Loader2 size={14} className="animate-spin"/>}<strong>{ACTIONS.find(a=>a.key===j.action)?.title}</strong><Badge tone={j.status==='failed'?'amber':j.status==='done'?'green':'slate'}>{j.status}</Badge><span className="text-xs text-slate-500">{fmtDate(j.created_at)}</span></div>{j.error&&<p className="mt-2 text-xs text-amber-800">{j.error}</p>}<div className="mt-2 flex flex-wrap gap-3">{j.status==='done'&&<button className="text-xs underline" onClick={()=>setTab('drafts')}>Read saved result</button>}{j.session_id&&<button className="text-xs underline" onClick={()=>openWorkflowChat(j.session_id!)}>Open conversation</button>}{j.status==='running'&&<button className="text-xs underline" onClick={()=>void action.run(async()=>{await pathwayApi(`/pathways/runs/${j.id}/cancel`,{});})}>Cancel action</button>}{['failed','canceled'].includes(j.status)&&<button className="text-xs underline" disabled={action.busy||running.some(x=>x.action===j.action)} onClick={()=>void start(j.action)}>Retry as a new run</button>}</div></div>)}</div>}
  <div className="pathway-progress"><span>{done}/{tasks.data.length} steps complete</span><span>{open} open questions</span><span>Preparation progress, not approval or eligibility</span></div>
  <Tabs tabs={[['steps','Steps'],['questions','Questions & evidence'],['drafts','Draft library'],['inquiry','Unsent inquiry'],['guidance','Guidance']]} value={tab} onChange={setTab}/>
  <div className="mt-6">
   {tab==='steps'&&<Card title="One step at a time"><TaskList projectId={plan.project_id} pathwayId={plan.id} area={spec.area} tasks={tasks.data}/></Card>}
   {tab==='questions'&&<Card title="Resolve these with evidence"><QuestionList projectId={plan.project_id} pathwayId={plan.id} area={spec.area} questions={questions.data}/></Card>}
   {tab==='drafts'&&<Card title="Working materials"><DocList scope={{project_id:plan.project_id,pathway_id:plan.id}}/></Card>}
   {tab==='inquiry'&&<>{comms.data.filter(c=>c.status==='draft').map(c=><Card key={c.id} title={displayName(c.subject)}><p className="mb-5 text-xs text-slate-500">Unsent. Verify every claim and the recipient before using this draft. Do not send fictional demo material.</p><InlineText label="Inquiry draft" multiline rows={12} value={c.body} onSave={body=>updateRow('communications',c.id,{body})}/></Card>)}{!comms.data.some(c=>c.status==='draft')&&<Empty title="No unsent inquiry here"/>}</>}
   {tab==='guidance'&&<Guidance spec={spec}/>}
  </div>
  <Disclosure title="Plan status & notes"><p className="mb-3 text-xs text-slate-500">This status describes your work on the pathway, not a signed agreement, government approval or funds received.</p><Select aria-label="Pathway work status" className="mb-5 max-w-xs" value={plan.status} onChange={e=>void action.run(()=>updateRow('project_pathways',plan.id,{status:e.target.value,updated_at:new Date().toISOString()}))} options={{considering:'Considering',preparing:'Preparing',active:'Working on this route',paused:'Paused',closed:'Closed'}}/><InlineText label="Pathway notes" multiline value={plan.notes} onSave={notes=>updateRow('project_pathways',plan.id,{notes,updated_at:new Date().toISOString()})}/></Disclosure>
 </>;
}
function Guidance({spec}:{spec:Pathway}){return <div className="space-y-6"><Card title="Questions to answer"><ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed">{spec.checks.map(x=><li key={x}>{x}</li>)}</ul></Card><Card title="What the preparation packet covers"><ul className="list-disc space-y-2 pl-5 text-sm">{spec.sections.map(x=><li key={x}>{x}</li>)}</ul></Card><div className="space-y-3">{spec.sources.map(s=><div key={s.url}><SourceLink url={s.url} label={s.label}/></div>)}<p className="text-xs text-slate-500">General guidance reviewed {spec.checked_on}. Not an open-call check or legal advice. Recheck current rules and deadlines with the relevant institution.</p></div></div>;}
