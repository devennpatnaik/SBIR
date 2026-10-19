import { useState } from 'react';
import { ArrowUpRight, Check, Globe2, Search } from 'lucide-react';
import { enterTrack, navigate } from '../lib/router';
import { OWNER_LABEL, PatentError, patentApi, type PatentHit, type PatentLink, type PatentResults } from '../lib/patents';
import { Badge, Button, ErrorNote, Input, Notice, Select } from '../components/ui';
const COUNTRIES:[string,string][]=[['','All countries'],['US','United States'],['EP','European Patent Office'],['WO','International (PCT)'],['CN','China'],['JP','Japan'],['KR','South Korea'],['DE','Germany'],['GB','United Kingdom'],['FR','France'],['CA','Canada'],['AU','Australia'],['IN','India']];
type Filters={q:string;country:string;status:string;age:string;owner:string};
export function Patents({ signedIn = true }: { signedIn?: boolean }){
 const [f,setF]=useState<Filters>({q:'',country:'',status:'',age:'',owner:''});
 const [res,setRes]=useState<PatentResults|null>(null);const [page,setPage]=useState(0);const [busy,setBusy]=useState(false);
 const [error,setError]=useState<{message:string;links:PatentLink[]}|null>(null);const [saved,setSaved]=useState<Record<string,{id:string;partial:boolean}>>({});const [saving,setSaving]=useState('');const [saveError,setSaveError]=useState('');
 const search=async(p=0)=>{if(f.q.trim().length<2)return;setBusy(true);setError(null);try{setRes(await patentApi<PatentResults>('/patents/search',{...f,page:p}));setPage(p);}catch(e){setError({message:e instanceof Error?e.message:'Search failed.',links:e instanceof PatentError?e.links:[]});}finally{setBusy(false);}};
 const save=async(h:PatentHit)=>{
  if(!signedIn){navigate('signin');return;}
  setSaving(h.key);setSaveError('');try{const r=await patentApi<{id:string;partial?:boolean}>('/patents/import',{key:h.key,hit:h});setSaved(s=>({...s,[h.key]:{id:r.id,partial:!!r.partial}}));}catch(e){setSaveError(`${h.key}: ${e instanceof Error?e.message:'Could not save.'}`);}finally{setSaving('');}};
 const change=(p:Partial<Filters>)=>setF(v=>({...v,...p}));
 return <div className="patents-page track-home patents-track-home">
  <div className="track-banner patents" role="status">
   <Globe2 size={16}/>
   <span><strong>Worldwide patents</strong> — discovery only · may not be SBIR-eligible · no commercialization handholding</span>
   <button type="button" className="track-switch-btn" onClick={()=>enterTrack('sbir')}>Switch to SBIR route</button>
  </div>
  <p className="eyebrow">TRACK B · WORLDWIDE PATENTS</p>
  <h1 className="editorial">Find patents that<br/>haven’t been commercialized yet.</h1>
  <p className="patents-lede">Search <strong>patents registered anywhere in the world</strong> that look unused or unfinished. Inspect the record, shortlist leads, and keep light notes. This track is discovery-focused — it does <em>not</em> walk you through SBIR or commercialization coaching. Many patents here are <strong>not SBIR-eligible</strong>.</p>
  <form className="patents-search" onSubmit={e=>{e.preventDefault();void search(0);}}>
   <div className="search-box"><Search size={18}/><Input aria-label="Describe the technology" placeholder="e.g. low-cost lead detection in drinking water" value={f.q} maxLength={250} onChange={e=>change({q:e.target.value})}/></div>
   <Button variant="primary" type="submit" busy={busy} disabled={f.q.trim().length<2}>Search patents</Button>
  </form>
  <details className="patents-filters"><summary>Refine{(f.country||f.status||f.age||f.owner)&&<Badge>Filtered</Badge>}</summary><div>
   <Select aria-label="Country or office" value={f.country} onChange={e=>change({country:e.target.value})} options={COUNTRIES}/>
   <Select aria-label="Patent stage" value={f.status} onChange={e=>change({status:e.target.value})} options={[['','Granted and applications'],['GRANT','Granted patents'],['APPLICATION','Applications only']]}/>
   <Select aria-label="Filing age" value={f.age} onChange={e=>change({age:e.target.value})} options={[['','Any filing date'],['recent','Filed in the last 20 years'],['old','Filed 20+ years ago (often expired)']]}/>
   <Input aria-label="Owner name contains" placeholder="Owner, e.g. university or company" value={f.owner} maxLength={120} onChange={e=>change({owner:e.target.value})}/>
  </div></details>
  {error&&<div className="patents-busy" role="alert"><p>{error.message}</p>{error.links.length>0&&<ul>{error.links.map(l=><li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer">Search on {l.label} ↗</a></li>)}</ul>}</div>}
  <ErrorNote error={saveError}/>
  {res&&<section aria-live="polite">
   <p className="patents-count">{res.items.length?`About ${res.total.toLocaleString()} results from ${res.sourceName}, checked ${new Date(res.checkedAt).toLocaleString()}.`:'No patents matched. Try simpler words or fewer filters.'}</p>
   <div className="patent-list">{res.items.map(h=>{const s=saved[h.key];return <article key={h.key} className="patent-card">
    <div className="patent-meta"><Badge tone={h.ownerKind==='university'?'purple':h.ownerKind==='federal_lab'?'blue':h.ownerKind==='company'?'slate':'green'}>{OWNER_LABEL[h.ownerKind]}</Badge><span>{h.key}</span></div>
    <h2>{h.title}</h2>
    <p className="patent-owner">{h.assignee||'No owner listed (may belong to the inventor)'}{h.inventor&&` · Inventor: ${h.inventor}`}</p>
    <p className="patent-snippet">{h.snippet}</p>
    <p className="patent-dates">{[h.priorityDate&&`Priority ${h.priorityDate}`,h.filingDate&&`Filed ${h.filingDate}`,h.grantDate?`Granted ${h.grantDate}`:'Not granted (application)'].filter(Boolean).join(' · ')}</p>
    <div className="patent-actions">{s?<><span className="patent-saved"><Check size={15}/>Saved{s.partial?' (summary only)':''}</span><Button size="sm" onClick={()=>navigate(`tech/${s.id}`)}>Open</Button></>:<Button size="sm" variant="primary" busy={saving===h.key} disabled={!!saving} onClick={()=>void save(h)}>Save to my technologies</Button>}<a href={h.url} target="_blank" rel="noopener noreferrer">Full record <ArrowUpRight size={14}/></a></div>
   </article>;})}</div>
   {res.items.length>0&&<div className="patents-pager">{page>0&&<Button size="sm" disabled={busy} onClick={()=>void search(page-1)}>Previous</Button>}{page+1<Math.min(res.pages,20)&&<Button size="sm" disabled={busy} onClick={()=>void search(page+1)}>More results</Button>}</div>}
   <p className="patents-also"><Globe2 size={15}/> Also search: {res.links.map((l,i)=><span key={l.url}>{i>0&&' · '}<a href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a></span>)}</p>
  </section>}
  <Notice tone="slate">A patent record tells you who filed and whether it appears to be in force. It can’t tell you whether it’s already in a product, whether the owner will license it, or that you’re free to use it. Status and owners shown here come from Google Patents, not an official patent office. Confirm them in official records, and talk to a patent attorney before relying on a patent. General information, not legal advice.</Notice>
  <p className="track-switch">Need federal R&D funding coaching instead?{' '}
   <button type="button" onClick={()=>enterTrack('sbir')}>Switch to the SBIR route →</button>
  </p>
  {!signedIn&&<p className="patents-guest-note">You can search without an account. Sign in to shortlist patents to your saved leads.</p>}
 </div>;
}
