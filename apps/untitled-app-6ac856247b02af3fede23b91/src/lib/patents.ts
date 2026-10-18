import { authHeaders } from '../runtime';
import { invalidate } from './data';
export type PatentHit={key:string;title:string;snippet:string;assignee:string;inventor:string;priorityDate:string;filingDate:string;grantDate:string;publicationDate:string;country:string;ownerKind:'federal_lab'|'university'|'company'|'individual'|'unknown';url:string;espacenet:string};
export type PatentLink={label:string;url:string};
export type PatentResults={items:PatentHit[];total:number;pages:number;checkedAt:string;links:PatentLink[];sourceName:string};
export class PatentError extends Error{constructor(message:string,public links:PatentLink[]=[]){super(message);}}
export async function patentApi<T>(path:string,body:unknown):Promise<T>{
 const r=await fetch(`${import.meta.env.VITE_BOURNE_BACKEND_URL}${path}`,{method:'POST',headers:{...await authHeaders(),'Content-Type':'application/json'},body:JSON.stringify(body)});
 const result=await r.json().catch(()=>({error:'The patent service returned an unreadable response.'}));
 if(!r.ok)throw new PatentError(result.error||`Request failed (${r.status})`,Array.isArray(result.links)?result.links:[]);
 if(path.endsWith('/import'))invalidate();return result as T;
}
export const OWNER_LABEL:Record<PatentHit['ownerKind'],string>={federal_lab:'U.S. government',university:'University',company:'Company',individual:'No owner listed',unknown:'Owner type unclear'};
