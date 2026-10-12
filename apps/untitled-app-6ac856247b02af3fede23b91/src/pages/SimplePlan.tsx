import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { useQuery, updateRow, invalidate } from '../lib/data';
import { useActiveProjectId } from '../lib/router';
import { pathwayApi, openWorkflowChat, type ProjectPathway, type WorkflowRun } from '../lib/pathways';
import type { Doc, Project, Task } from '../lib/types';
import { Button, Disclosure, displayName, ErrorNote, useAsync } from '../components/ui';
export function SimplePlan({projectId}:{projectId:string}){
 const [,setActive]=useActiveProjectId();
 const project=useQuery<Project>('projects',q=>q.eq('id',projectId),[projectId]);
 const paths=useQuery<ProjectPathway>('project_pathways',q=>q.eq('project_id',projectId).eq('pathway_key','getting_started'),[projectId]);const path=paths.data[0];
 const tasks=useQuery<Task>('tasks',q=>q.eq('pathway_id',path?.id??'').order('created_at'),[path?.id],!!path);
 const jobs=useQuery<WorkflowRun>('workflow_runs',q=>q.eq('pathway_id',path?.id??'').order('created_at',{ascending:false}),[path?.id],!!path);
 const docs=useQuery<Doc>('documents',q=>q.eq('pathway_id',path?.id??'').eq('is_ai_generated',true).order('created_at',{ascending:false}),[path?.id],!!path);
 const job=jobs.data[0];const result=docs.data[0];const p=project.data[0];const running=jobs.data.filter(x=>x.status==='running').map(x=>x.id).join(',');const [pollError,setPollError]=useState('');const action=useAsync();const key=useRef(crypto.randomUUID());
 useEffect(()=>{if(!running)return;let live=true;const tick=async()=>{try{await Promise.all(running.split(',').map(id=>pathwayApi(`/pathways/runs/${id}`)));if(live){setPollError('');invalidate();}}catch{if(live)setPollError('We couldn’t refresh progress. Your saved idea is still here. Try refreshing in a moment.');}};void tick();const timer=setInterval(()=>void tick(),5000);return()=>{live=false;clearInterval(timer);};},[running]);
 const start=()=>action.run(async()=>{if(!path)return;await pathwayApi('/pathways/run',{pathwayId:path.id,action:'research',requestKey:key.current});key.current=crypto.randomUUID();});
 const complete=(t:Task)=>action.run(async()=>{if(t.depends_on&&!tasks.data.some(x=>x.id===t.depends_on&&x.status==='done'))throw new Error('Finish the previous step first.');await updateRow('tasks',t.id,{status:'done',completed_at:new Date().toISOString()});});
 useEffect(()=>{if(p)setActive(p.id);},[p?.id,setActive]);
 const ordered:Task[]=[];let cursor=tasks.data.find(t=>!t.depends_on);while(cursor&&!ordered.some(t=>t.id===cursor!.id)){ordered.push(cursor);const id=cursor.id;cursor=tasks.data.find(t=>t.depends_on===id);}
 const next=ordered.find(t=>t.status!=='done'&&t.status!=='skipped'&&(!t.depends_on||tasks.data.some(x=>x.id===t.depends_on&&x.status==='done')));
 if(project.loading)return <p role="status">Opening your plan…</p>;
 if(!p)return <ErrorNote error={project.error||'This plan is not available to your account.'}/>;
 const talk=()=>job?.session_id?openWorkflowChat(job.session_id):window.dispatchEvent(new CustomEvent('ltm-workflow-chat'));
 return <div className="simple-plan"><p className="eyebrow">YOUR IDEA HAS A STARTING POINT</p><h1 className="editorial">One useful step<br/>at a time.</h1><p className="simple-plan-idea">{displayName(p.name)}</p><ErrorNote error={action.error||pollError||paths.error||tasks.error||docs.error||jobs.error}/>
  {running?<section className="simple-research" role="status"><Loader2 size={23} className="animate-spin"/><div><h2>We’re looking into your idea.</h2><p>Finding real sources and a sensible place to start. You can leave and come back. This usually takes a few minutes.</p><button onClick={()=>void action.run(async()=>{await Promise.all(running.split(',').map(id=>pathwayApi(`/pathways/runs/${id}/cancel`,{})));})}>Stop research</button></div></section>:!result?<section className="simple-research"><Sparkles size={24}/><div><h2>{job?.status==='failed'?'Your idea is saved. Let’s try the research again.':job?.status==='canceled'?'Pick this up whenever you’re ready.':'Ready to look into it?'}</h2><p>{job?.error||'We’ll research your idea and save a short starting plan here.'}</p><Button variant="primary" busy={action.busy} disabled={!path} onClick={()=>void start()}>{job?'Try research again':'Research my idea'}</Button></div></section>:null}
  {result&&<section className="simple-next"><p className="eyebrow">YOUR NEXT SMALL STEP</p><h2 className="editorial">{next?.title||'Keep following your curiosity.'}</h2><p>{next?.description||'Your first three steps are complete. Talk with your guide about what comes next.'}</p><Button variant="primary" onClick={()=>next===ordered[0]?document.getElementById('first-plan')?.scrollIntoView({behavior:'smooth'}):talk()}>{next===ordered[0]?'Read my plan':'Talk it through'}<ArrowRight size={17}/></Button></section>}
  {result&&<section id="first-plan" className="simple-plan-result"><p className="eyebrow">A STARTING PLAN, RESEARCHED FOR YOU</p><Markdown components={{a:props=><a {...props} target="_blank" rel="noopener noreferrer"/>}}>{result.body}</Markdown><p className="simple-draft-label">AI-assisted working draft. Check sources and important details before acting.</p>{next===ordered[0]&&next&&<Button busy={action.busy} onClick={()=>void complete(next)}><Check size={16}/>I’ve reviewed this</Button>}</section>}
  <button className="plan-talk" onClick={talk}><Sparkles size={19}/><span>Have a question? Talk to your guide.</span><ArrowRight size={18}/></button>
  <Disclosure title="Your three starting steps"><ol className="simple-steps">{ordered.map((t,i)=><li key={t.id}><span>{t.status==='done'?<Check size={16}/>:i+1}</span><div><h3>{t.title}</h3><p>{t.description}</p>{result&&t.id===next?.id&&i>0&&<button disabled={action.busy} onClick={()=>void complete(t)}>I’ve done this</button>}</div></li>)}</ol></Disclosure>
  <Disclosure title="When you want to go deeper"><div className="simple-deeper"><a href={`#/projects/${projectId}`}>Full project workspace ↗</a><a href="#/pathways">Licensing, collaboration & financing routes ↗</a><a href="#/funding">Saved opportunities & live grant search ↗</a><a href="#/documents">All your notes and drafts ↗</a><a href="#/start">Start another idea ↗</a>{!running&&<Button size="sm" busy={action.busy} onClick={()=>void start()}>Research again (save a new draft)</Button>}</div></Disclosure>
 </div>;
}
