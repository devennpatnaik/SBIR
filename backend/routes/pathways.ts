import { Hono } from 'hono';
import { appUser } from '../lib/auth';
import { openAgentSession, sendAgentMessage } from '../lib/agents';
import { DataError, userData } from '../lib/user-data';
import type { Env } from '../lib/env';
import { pathwayByKey } from '@project/pathways';
const uuid=(x:unknown):x is string=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
type Run={id:string;project_id:string;pathway_id:string;action:string;status:string;session_id:string|null};
const app=new Hono<{Bindings:Env}>();
app.onError((e,c)=>c.json({error:e instanceof DataError?e.message:'The pathway service could not complete this request. Your saved work is preserved; please retry.'},e instanceof DataError?(e.status===403?403:400):502));
app.use('*',async(c,next)=>{try{if(!await appUser(c.env,c.req.raw))return c.json({error:'Sign in required.'},401);await next();}catch(e){return c.json({error:e instanceof Error?e.message:'Pathway request failed.'},e instanceof DataError&&e.status===404?404:400);}});
app.post('/kickoff',async c=>{
 const b=await c.req.json();if(!uuid(b.requestKey)||!b.answers||typeof b.answers!=='object')return c.json({error:'Complete your starting questions.'},400);
 return c.json(await userData(c.env,c.req.raw,'rpc/create_simple_plan','POST',{request_key:b.requestKey,answers:b.answers}));
});
app.post('/plan',async c=>{
 const b=await c.req.json();if(!uuid(b.projectId)||!pathwayByKey(b.pathwayKey))return c.json({error:'Choose a project and a supported pathway.'},400);
 const result=await userData(c.env,c.req.raw,'rpc/create_pathway_plan','POST',{target_project:b.projectId,selected_pathway:b.pathwayKey});return c.json(result);
});
app.post('/run',async c=>{
 const b=await c.req.json();if(!uuid(b.pathwayId)||!uuid(b.requestKey)||!['research','draft','review'].includes(b.action))return c.json({error:'Invalid workflow request.'},400);
 const result=await userData<{id:string;created:boolean}>(c.env,c.req.raw,'rpc/start_pathway_workflow','POST',{target_pathway:b.pathwayId,requested_action:b.action,idempotency_key:b.requestKey});
 if(!result.created)return c.json(result);
 if(!c.env.BOURNE_RUNTIME_URL){
  await userData(c.env,c.req.raw,`workflow_runs?id=eq.${result.id}&status=eq.running`,'PATCH',{status:'failed',error:'Research assistant is not configured on this self-hosted deployment. Pathway plans still work; agent research/draft/review jobs need a separate assistant runtime.',updated_at:new Date().toISOString(),completed_at:new Date().toISOString()});
  return c.json({...result,assistantUnavailable:true});
 }
 const work=(async()=>{
  try{
   const rows=await userData<Run[]>(c.env,c.req.raw,`workflow_runs?id=eq.${result.id}`);const run=rows[0];if(!run)throw new Error('Workflow not found.');
   const session=await openAgentSession(c.env,c.req.raw,'assistant');
   const saved=await userData<Run[]>(c.env,c.req.raw,`workflow_runs?id=eq.${run.id}&status=eq.running`,'PATCH',{session_id:session,updated_at:new Date().toISOString()});
   if(!saved.length)return;
   const turn=await sendAgentMessage(c.env,c.req.raw,session,`[Authorized pathway action]\nThe user clicked ${run.action} for their pathway. Use the pathway-workflows skill. workflow_run_id=${run.id}; project_id=${run.project_id}; pathway_id=${run.pathway_id}; action=${run.action}. Read the owned running row and pathway_catalog before work. You are authorized to save ONE new AI-labeled document linked by workflow_run_id and to update ONLY this run's status. Do not ask for a second approval for those bounded writes. Do not change any other records, send messages, submit applications, execute agreements or spend money. Missing facts are gaps, not permission to invent. Finish with saved output and status done, or status failed with an explanation.`);
   if(!turn)throw new Error('The agent session was already busy. Retry this action.');
  }catch(e){await userData(c.env,c.req.raw,`workflow_runs?id=eq.${result.id}&status=eq.running`,'PATCH',{status:'failed',error:e instanceof Error?e.message:'Could not start the action.',updated_at:new Date().toISOString()});}
 })();
 // Cloudflare Workers expose waitUntil; Bun/Node self-host just awaits.
 const ctx=(c as {executionCtx?:{waitUntil?:(p:Promise<unknown>)=>void}}).executionCtx;
 if(ctx?.waitUntil)ctx.waitUntil(work);else await work;
 return c.json(result);
});
app.post('/runs/:id/cancel',async c=>{
 const id=c.req.param('id');if(!uuid(id))return c.json({error:'Invalid run.'},400);
 const rows=await userData<Run[]>(c.env,c.req.raw,`workflow_runs?id=eq.${id}`);const run=rows[0];if(!run)return c.json({error:'Run not found.'},404);
 const stopped=await userData<Run[]>(c.env,c.req.raw,`workflow_runs?id=eq.${id}&status=eq.running`,'PATCH',{status:'canceled',updated_at:new Date().toISOString(),completed_at:new Date().toISOString()});
 if(stopped.length&&run.session_id&&c.env.BOURNE_RUNTIME_URL)await fetch(`${c.env.BOURNE_RUNTIME_URL}/agent-sessions/${encodeURIComponent(run.session_id)}/cancel`,{method:'POST',headers:{Authorization:c.req.header('Authorization')!}}).catch(()=>null);
 return c.json({stopped:stopped.length>0});
});
/** Polling also reconciles an agent that terminated without saving a result. */
app.get('/runs/:id',async c=>{
 const id=c.req.param('id');if(!uuid(id))return c.json({error:'Invalid run.'},400);
 const rows=await userData<Run[]>(c.env,c.req.raw,`workflow_runs?id=eq.${id}`);const run=rows[0];if(!run)return c.json({error:'Run not found.'},404);
 if(run.status==='running'&&run.session_id&&c.env.BOURNE_RUNTIME_URL){
  const res=await fetch(`${c.env.BOURNE_RUNTIME_URL}/agent-sessions/${encodeURIComponent(run.session_id)}`,{headers:{Authorization:c.req.header('Authorization')!}});
  if(res.ok){const snapshot=await res.json() as {turns?:{terminal?:{finishReason?:string}|null}[]};const last=snapshot.turns?.at(-1);
   if(last?.terminal){await userData(c.env,c.req.raw,`workflow_runs?id=eq.${id}&status=eq.running`,'PATCH',{status:'failed',error:'The agent stopped without completing a saved result. Open its conversation for details, or retry.',updated_at:new Date().toISOString()});}
  }
 }
 return c.json((await userData<Run[]>(c.env,c.req.raw,`workflow_runs?id=eq.${id}`))[0]);
});
export const pathwayRoutes=app;
