import type { Tables } from '@project/database';
import { authHeaders } from '../runtime';
import { apiBase } from './apiBase';
import { clearWriteError, invalidate } from './data';
export type ProjectPathway=Tables<'project_pathways'>;
export type WorkflowRun=Tables<'workflow_runs'>;
export async function pathwayApi<T>(path:string,body?:unknown):Promise<T>{
 const r=await fetch(`${apiBase()}${path}`,{method:body===undefined?'GET':'POST',headers:{...await authHeaders(),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const result=await r.json().catch(()=>({error:'The service returned an unreadable response.'}));if(!r.ok)throw new Error(result.error||`Request failed (${r.status})`);if(body!==undefined){clearWriteError();invalidate();}return result as T;
}
export function openWorkflowChat(sessionId:string){window.dispatchEvent(new CustomEvent('ltm-workflow-chat',{detail:{sessionId}}));}
