// Patent records are public data, never instructions. Google Patents is a public search service,
// not an official patent office record, and nothing in a record proves commercial use or licensing.
type Obj=Record<string,unknown>;
const text=(x:unknown)=>typeof x==='string'?x:typeof x==='number'?String(x):'';
const entities:Record<string,string>={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',hellip:'…',mdash:'-',ndash:'-'};
export const plain=(x:unknown)=>text(x).replace(/<[^>]*>/g,' ').replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi,(m,e:string)=>e[0]==='#'?String.fromCodePoint(e[1]?.toLowerCase()==='x'?parseInt(e.slice(2),16):Number(e.slice(1))):entities[e.toLowerCase()]??m).replace(/\s+/g,' ').trim();
export const PATENT_COUNTRIES=['US','EP','WO','CN','JP','KR','DE','GB','FR','CA','AU','IN'] as const;
export type OwnerKind='federal_lab'|'university'|'company'|'individual'|'unknown';
/** Deterministic label from the listed assignee only. It is a hint, not a verified ownership fact. */
export function classifyOwner(assignee:string):OwnerKind{
 const a=assignee.trim();if(!a)return 'individual';
 if(/united states of america|secretary of the (navy|army|air force)|national aeronautics|\bnasa\b|department of (energy|health|agriculture|commerce|defense|the navy|the army|veterans)|u\.?s\.? government|national institutes of health|government of the united states/i.test(a))return 'federal_lab';
 if(/universit|college|regents|institute of technology|polytechnic|school of medicine|board of trustees|research foundation|universidad|universität|hochschule|\bmit\b/i.test(a))return 'university';
 if(/\b(inc|incorporated|llc|l\.l\.c|ltd|limited|corp|corporation|co|company|gmbh|ag|sa|sas|s\.a|bv|b\.v|nv|plc|kk|oy|ab|spa|s\.p\.a|srl|pty|holdings|technologies|group)\b\.?/i.test(a))return 'company';
 return 'unknown';
}
export type PatentSearch={q:string;country?:string;status?:string;owner?:string;age?:string;page?:number};
const term=(v:string)=>encodeURIComponent(v).replace(/%20/g,'+');
/** Builds the inner Google Patents query string, e.g. q=(water+sensor)&country=US&before=filing:20061018 */
export function searchParams(s:PatentSearch,today=new Date()):string{
 const q=s.q.trim().replace(/[()&=]/g,' ').replace(/\s+/g,' ');
 const p:string[]=[`q=(${term(q)})`,'num=10','type=PATENT'];
 if(s.country&&(PATENT_COUNTRIES as readonly string[]).includes(s.country))p.push(`country=${s.country}`);
 if(s.status==='GRANT'||s.status==='APPLICATION')p.push(`status=${s.status}`);
 if(s.owner&&s.owner.trim())p.push(`assignee=${term(s.owner.trim().replace(/[&=]/g,' ').slice(0,120))}`);
 const cutoff=new Date(Date.UTC(today.getUTCFullYear()-20,today.getUTCMonth(),today.getUTCDate())).toISOString().slice(0,10).replace(/-/g,'');
 if(s.age==='old')p.push(`before=filing:${cutoff}`);
 if(s.age==='recent')p.push(`after=filing:${cutoff}`);
 if(s.page&&s.page>0)p.push(`page=${Math.min(Math.floor(s.page),20)}`);
 return p.join('&');
}
export const validKey=(k:unknown):k is string=>typeof k==='string'&&/^[A-Z]{2}[0-9A-Z]{3,16}[A-Z][0-9]?$/.test(k);
export const recordUrl=(key:string)=>`https://patents.google.com/patent/${key}/en`;
export const espacenetUrl=(key:string)=>`https://worldwide.espacenet.com/patent/search?q=pn%3D${encodeURIComponent(key)}`;
export function normalizeHit(r:Obj){
 const p=(r.patent&&typeof r.patent==='object'?r.patent:{}) as Obj;const key=text(p.publication_number);
 if(!validKey(key))return null;
 const assignee=plain(p.assignee);
 return {key,title:plain(p.title).replace(/…$/,'').trim()||key,snippet:plain(p.snippet),assignee,inventor:plain(p.inventor),priorityDate:text(p.priority_date),filingDate:text(p.filing_date),grantDate:text(p.grant_date),publicationDate:text(p.publication_date),country:key.slice(0,2),ownerKind:classifyOwner(assignee),url:recordUrl(key),espacenet:espacenetUrl(key)};
}
export type PatentHit=NonNullable<ReturnType<typeof normalizeHit>>;
export function normalizeResults(raw:unknown){
 const res=((raw as Obj)?.results??{}) as Obj;const clusters=Array.isArray(res.cluster)?res.cluster as Obj[]:[];
 const items=clusters.flatMap(c=>Array.isArray(c.result)?c.result as Obj[]:[]).map(normalizeHit).filter((x):x is PatentHit=>!!x);
 return {items,total:Number(res.total_num_results)||items.length,pages:Number(res.total_num_pages)||1};
}
const prop=(html:string,name:string)=>{const m=html.match(new RegExp(`itemprop="${name}"[^>]*>([^<]*)`));return m?plain(m[1]):'';};
const props=(html:string,name:string)=>[...html.matchAll(new RegExp(`itemprop="${name}"[^>]*>([^<]*)`,'g'))].map(m=>plain(m[1])).filter(Boolean);
/** Reads the public record page. Status and expiry are Google's estimates and must be verified officially. */
export function parseDetail(html:string){
 const exp=html.match(/itemprop="expiration"[^>]*datetime="(\d{4}-\d{2}-\d{2})"/)?.[1]??null;
 const abstract=plain(html.match(/<div[^>]*class="abstract[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1]??'')||plain(html.match(/<meta name="description" content="([^"]*)"/)?.[1]??'');
 // Owners and inventors come only from the record's own header, before events, citations and "cited by" lists.
 const cut=['itemprop="events"','itemprop="forwardReferences','itemprop="backwardReferences','<section itemprop="claims"'].map(m=>html.indexOf(m)).filter(i=>i>0);
 const head=html.slice(0,cut.length?Math.min(...cut):html.length);
 const claim=plain(html.match(/<div[^>]*class="claim-text"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/)?.[1]??'').slice(0,1500);
 return {title:prop(html,'title'),status:prop(html,'ifiStatus')||prop(html,'status'),expires:exp,abstract:abstract.slice(0,4000),firstClaim:claim,currentOwners:[...new Set(props(head,'assigneeCurrent'))],originalOwners:[...new Set(props(head,'assigneeOriginal'))],inventors:[...new Set(props(head,'inventor'))].slice(0,12),priorityDate:html.match(/itemprop="priorityDate"[^>]*datetime="(\d{4}-\d{2}-\d{2})"/)?.[1]??''};
}
export function statusLabel(status:string){
 const s=status.toLowerCase();
 if(!s)return 'Status not shown';
 if(s.startsWith('active'))return 'Appears in force';
 if(s.includes('pending'))return 'Application pending';
 if(/expired|lapsed|abandon|withdrawn|ceased|revoked/.test(s))return 'Appears expired or lapsed';
 return status;
}
export function technologyFromPatent(key:string,d:ReturnType<typeof parseDetail>,checkedAt:string){
 const owners=d.currentOwners.length?d.currentOwners:d.originalOwners;const owner=owners.join('; ');const kind0=owners[0]||'';const kind=classifyOwner(kind0);
 const label=statusLabel(d.status);const lapsed=label==='Appears expired or lapsed';
 return {
  name:(d.title||key).slice(0,300),description:d.abstract||'No abstract was available in the public record.',source_url:recordUrl(key),source_name:'Google Patents public record (not an official patent office record)',
  inventors:d.inventors.join(', '),patent_numbers:key,patent_key:key,patent_status:d.status.slice(0,120),patent_expires:d.expires,patent_assignee:owner.slice(0,300),patent_country:key.slice(0,2),
  origin_kind:kind==='unknown'?'other':kind,lab_name:kind==='university'||kind==='federal_lab'?owner.slice(0,300):'',licensing_status:'unknown',
  ip_info:`Public record checked ${checkedAt.slice(0,10)}: ${label}${d.expires?`, estimated expiry ${d.expires}`:''}. Listed owner: ${owner||'none listed (may be inventor-owned)'}. Status, expiry and owner come from Google Patents and must be confirmed in the official patent office and assignment records. ${lapsed?'An expired or lapsed patent can generally be practiced without a license, but other patents may still apply; get a freedom-to-operate opinion.':'Whether it is already used in a product or licensed is unknown.'} General information, not legal advice.`,
  open_questions:'Who owns this patent today according to the official assignment record?\nIs it in force in the countries where we would sell, and when does it expire?\nIs it already used in a product or licensed to someone?\nWould the owner discuss an option or license, and who is the right contact?',
  source_text:[`Abstract: ${d.abstract}`,d.firstClaim?`First claim (excerpt): ${d.firstClaim}`:'',`Original owner(s): ${d.originalOwners.join('; ')}`,`Current owner(s) per Google Patents: ${d.currentOwners.join('; ')}`,`Priority date: ${d.priorityDate}`].filter(Boolean).join('\n\n').slice(0,20000),
  source_fetched_at:checkedAt,
 };
}

/** Same search on official and public services, so a busy endpoint never strands the user. */
export function externalSearchLinks(q:string,params:string){
 const words=encodeURIComponent(q.trim().slice(0,250));
 return [{label:'Google Patents',url:`https://patents.google.com/?${params.replace(/&num=10|&type=PATENT/g,'')}`},{label:'Espacenet (European Patent Office)',url:`https://worldwide.espacenet.com/patent/search?q=${words}`},{label:'PATENTSCOPE (WIPO)',url:`https://patentscope.wipo.int/search/en/result.jsf?query=${words}`},{label:'USPTO Patent Public Search',url:'https://ppubs.uspto.gov/pubwebapp/'}];
}
const s=(x:unknown,n:number)=>typeof x==='string'?plain(x).slice(0,n):'';
/** Builds a minimal record from the search hit the user selected when the full record is unavailable. */
export function technologyFromHit(key:string,hit:unknown,checkedAt:string){
 if(!hit||typeof hit!=='object')return null;const h=hit as Obj;if(h.key!==key)return null;
 const title=s(h.title,300);if(!title)return null;const owner=s(h.assignee,300);const kind=classifyOwner(owner);
 return {name:title,description:s(h.snippet,2000)||'Only the search-result summary was available. Open the record for the abstract and claims.',source_url:recordUrl(key),source_name:'Google Patents search result (full record not yet loaded; not an official record)',
  inventors:s(h.inventor,600),patent_numbers:key,patent_key:key,patent_status:'',patent_expires:null,patent_assignee:owner,patent_country:key.slice(0,2),origin_kind:kind==='unknown'?'other':kind,lab_name:kind==='university'||kind==='federal_lab'?owner:'',licensing_status:'unknown',
  ip_info:`Saved from a search result on ${checkedAt.slice(0,10)}. Legal status and expiry were not loaded. Listed applicant: ${owner||'none listed'}. Check the official patent office and assignment records. General information, not legal advice.`,
  open_questions:'Is this patent in force, and when does it expire?\nWho owns it today according to the official assignment record?\nIs it already used in a product or licensed?\nWould the owner discuss an option or license?',
  source_text:`Search snippet: ${s(h.snippet,2000)}\nPriority date: ${s(h.priorityDate,20)}\nFiling date: ${s(h.filingDate,20)}\nGrant date: ${s(h.grantDate,20)}`,source_fetched_at:checkedAt};
}
