import type { Env } from './env';
export class DataError extends Error { constructor(message:string,public status:number){super(message);} }
/** Always the caller's token, never the owner connection. RLS applies to every request. */
export async function userData<T>(env:Env,request:Request,path:string,method='GET',body?:unknown):Promise<T>{
 const response=await fetch(`${env.NEON_DATA_API_URL.replace(/\/+$/,'')}/${path}`,{method,headers:{Authorization:request.headers.get('Authorization')??'','Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await response.json().catch(()=>null) as {message?:string}|null;
 if(!response.ok)throw new DataError(data?.message||`Database request failed (${response.status})`,response.status);
 return data as T;
}
