// API text is data, never markup or agent instructions. The complete original JSON stays separate.
type Obj=Record<string,unknown>;
const obj=(x:unknown):Obj=>x&&typeof x==='object'&&!Array.isArray(x)?x as Obj:{};
const text=(x:unknown)=>typeof x==='string'?x:typeof x==='number'?String(x):'';
const plain=(x:unknown)=>text(x).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const list=(x:unknown)=>Array.isArray(x)?x.map(obj):[];
export function sourceDate(value:unknown):string|null{
 const s=text(value);const match=s.match(/^(\d{4}-\d{2}-\d{2})/);if(!match)return null;const date=match[1]!;const d=new Date(date+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===date?date:null;
}
export function normalizeGrant(d:Obj){
 const s=obj(d.synopsis||d.forecast);const agency=obj(d.agencyDetails);const instruments=list(s.fundingInstruments);const id=text(d.id);if(!/^\d+$/.test(id)||!text(d.opportunityTitle))throw new Error('Grants.gov did not return a complete opportunity. Use the official page.');
 const codes=instruments.map(x=>text(x.id));const program=codes.length===1?({G:'Grant',CA:'Cooperative agreement',PC:'Contract'}[codes[0]!]||'Other'):'Other';
 const descriptions=instruments.map(x=>text(x.description)).join('; ');
 return {external_provider:'grants.gov',external_id:id,program,topic_title:text(d.opportunityTitle),solicitation_title:text(d.opportunityTitle),solicitation_number:text(d.opportunityNumber),agency:text(agency.agencyName)||text(d.owningAgencyCode),source_url:`https://www.grants.gov/search-results-detail/${id}`,award_type:descriptions,technical_objective:plain(s.synopsisDesc),eligibility:[...list(s.applicantTypes).map(x=>text(x.description)),plain(s.applicantEligibilityDesc)].filter(Boolean).join('\n'),open_date:sourceDate(s.postingDateStr),close_date:sourceDate(s.responseDateStr),deadline_verified:false,deadline_source_url:`https://www.grants.gov/search-results-detail/${id}`,award_amount:text(s.awardCeilingFormatted)?`Ceiling reported: $${text(s.awardCeilingFormatted)}; confirm the notice`:'Check the official notice',restrictions:`Cost sharing reported by API: ${s.costSharing===true?'yes':s.costSharing===false?'no':'not specified'}. Check the complete notice and amendments. A search hit is not an eligibility decision.`,submission_system:'Read the official notice and its application package. No automatic submission.',source_text:JSON.stringify(d,null,2).slice(0,180000),last_checked_at:new Date().toISOString(),fit_notes:'Imported from the live Grants.gov API. Applicant fit, all requirements and the exact deadline time/time zone remain to be verified.'};
}
