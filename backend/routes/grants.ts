import { Hono } from 'hono';
import { appUser } from '../lib/auth';
import { DataError, userData } from '../lib/user-data';
import type { Env } from '../lib/env';
import { normalizeGrant } from '../lib/grants';
const api='https://api.grants.gov/v1/api/';
async function grants(path:string,body:unknown){
 const r=await fetch(api+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw new Error(`Grants.gov returned ${r.status}. Use the official portal or try again later.`);
 const x=await r.json() as {errorcode:number;msg?:string;data:Record<string,unknown>};if(x.errorcode!==0)throw new Error(x.msg||'Grants.gov could not complete the request.');return x.data;
}
const app=new Hono<{Bindings:Env}>();
app.onError((e,c)=>c.json({error:e instanceof Error?e.message:'Opportunity discovery is unavailable. Please retry or use the official portal.'},e instanceof DataError&&e.status<500?400:502));
app.use('*',async(c,next)=>{try{if(!await appUser(c.env,c.req.raw))return c.json({error:'Sign in required.'},401);await next();}catch(e){return c.json({error:e instanceof Error?e.message:'Opportunity discovery unavailable.'},502);}});
app.post('/search',async c=>{
 const b=await c.req.json();if(typeof b.keyword!=='string'||!b.keyword.trim()||b.keyword.length>250)return c.json({error:'Enter a search phrase (up to 250 characters).'},400);
 const start=Number.isInteger(b.start)&&b.start>=0&&b.start<=10000?b.start:0;
 const data=await grants('search2',{keyword:b.keyword.trim(),rows:12,startRecordNum:start,oppStatuses:'posted|forecasted',eligibilities:b.smallBusinessOnly?'23|99':'',fundingInstruments:['G','CA','PC','O'].includes(b.instrument)?b.instrument:''});
 return c.json({items:data.oppHits??[],total:data.hitCount??0,start,checkedAt:new Date().toISOString(),source:'https://www.grants.gov/search-grants'});
});
app.post('/import',async c=>{
 const b=await c.req.json();if(!/^\d{1,10}$/.test(String(b.id)))return c.json({error:'Choose a valid Grants.gov opportunity.'},400);
 const id=String(b.id);const query=`opportunities?external_provider=eq.grants.gov&external_id=eq.${id}`;
 const existing=await userData<{id:string}[]>(c.env,c.req.raw,query);if(existing[0])return c.json({id:existing[0].id,created:false});
 const detail=await grants('fetchOpportunity',{opportunityId:Number(id)});const values=normalizeGrant(detail);
 try{const rows=await userData<{id:string}[]>(c.env,c.req.raw,'opportunities','POST',values);return c.json({id:rows[0]?.id,created:true});}
 catch(e){if(e instanceof DataError&&e.status===409){const rows=await userData<{id:string}[]>(c.env,c.req.raw,query);if(rows[0])return c.json({id:rows[0].id,created:false});}throw e;}
});
export const grantsRoutes=app;
