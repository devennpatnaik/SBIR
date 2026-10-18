import { Hono } from 'hono';
import { appUser } from '../lib/auth';
import { DataError, userData } from '../lib/user-data';
import type { Env } from '../lib/env';
import { externalSearchLinks, normalizeResults, parseDetail, recordUrl, searchParams, technologyFromHit, technologyFromPatent, validKey } from '../lib/patents';
const UA='Mozilla/5.0 (compatible; LabToMarket/1.0; patent research)';
const unavailable='The public patent search did not respond. Try again, or open the same search on Google Patents, Espacenet or PATENTSCOPE.';
const app=new Hono<{Bindings:Env}>();
app.onError((e,c)=>c.json({error:e instanceof DataError?e.message:e instanceof Error?e.message:unavailable},e instanceof DataError&&e.status<500?400:502));
app.use('*',async(c,next)=>{if(!await appUser(c.env,c.req.raw))return c.json({error:'Sign in required.'},401);await next();});
class Busy extends Error{}
async function cached(url:string,accept:string):Promise<string>{
 // Identical public queries are cached briefly so the shared public endpoint is not hammered.
 const cache=(globalThis as unknown as {caches?:{default?:Cache}}).caches?.default;const req=new Request(url);
 const hit=await cache?.match(req).catch(()=>undefined);if(hit)return hit.text();
 const r=await fetch(url,{headers:{'User-Agent':UA,Accept:accept},signal:AbortSignal.timeout(20000)});
 const body=await r.text();
 if(r.status===429||r.status===503||/<title>Sorry\.\.\.<\/title>/.test(body.slice(0,600)))throw new Busy('The public patent search is busy right now. Try again in a minute, or open the same search on one of the links below.');
 if(!r.ok)throw new Error(unavailable);
 await cache?.put(req,new Response(body,{headers:{'Cache-Control':'public, max-age=3600','Content-Type':accept}})).catch(()=>undefined);
 return body;
}
app.post('/search',async c=>{
 const b=await c.req.json();if(typeof b.q!=='string'||b.q.trim().length<2||b.q.length>250)return c.json({error:'Describe what you are looking for (2 to 250 characters).'},400);
 const params=searchParams({q:b.q,country:b.country,status:b.status,owner:typeof b.owner==='string'?b.owner:'',age:b.age,page:Number.isInteger(b.page)?b.page:0});
 const links=externalSearchLinks(b.q,params);
 try{
  const body=await cached(`https://patents.google.com/xhr/query?url=${encodeURIComponent(params)}&exp=`,'application/json');
  let raw:unknown;try{raw=JSON.parse(body);}catch{throw new Busy(unavailable);}
  return c.json({...normalizeResults(raw),checkedAt:new Date().toISOString(),links,sourceName:'Google Patents public search'});
 }catch(e){if(e instanceof Busy||e instanceof Error&&e.name==='TimeoutError')return c.json({error:e instanceof Busy?e.message:unavailable,links},503);throw e;}
});
app.post('/import',async c=>{
 const b=await c.req.json();if(!validKey(b.key))return c.json({error:'Choose a valid patent publication number.'},400);
 const key=b.key as string;const query=`technologies?patent_key=eq.${encodeURIComponent(key)}&select=id`;
 const existing=await userData<{id:string}[]>(c.env,c.req.raw,query);if(existing[0])return c.json({id:existing[0].id,created:false});
 const now=new Date().toISOString();let values:Record<string,unknown>;let partial=false;
 try{const detail=parseDetail(await cached(recordUrl(key),'text/html'));if(!detail.title&&!detail.abstract)throw new Error('incomplete');values=technologyFromPatent(key,detail,now);}
 catch(e){
  // Fall back to the search result the user picked, clearly marked as incomplete.
  const fallback=technologyFromHit(key,b.hit,now);if(!fallback)throw e instanceof Busy?e:new Error('The public patent record could not be opened. Try again, or add it manually from the official record.');values=fallback;partial=true;
 }
 try{const rows=await userData<{id:string}[]>(c.env,c.req.raw,'technologies','POST',values);return c.json({id:rows[0]?.id,created:true,partial});}
 catch(e){if(e instanceof DataError&&e.status===409){const rows=await userData<{id:string}[]>(c.env,c.req.raw,query);if(rows[0])return c.json({id:rows[0].id,created:false,partial});}throw e;}
});
export const patentRoutes=app;
