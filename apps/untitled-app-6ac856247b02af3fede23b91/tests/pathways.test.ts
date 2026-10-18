import {test,expect} from 'bun:test';
import {PATHWAYS,pathwayByKey,packetSections,OPPORTUNITY_PROGRAMS,PROGRAM_REFERENCES} from '@project/pathways';
import {normalizeGrant,sourceDate} from '../../../backend/lib/grants';
test('pathways have distinct resource flows and sources',()=>{expect(new Set(PATHWAYS.map(x=>x.key)).size).toBe(PATHWAYS.length);for(const p of PATHWAYS){expect(p.steps.length).toBe(p.key==='getting_started'?3:p.key==='sbir_track'?7:6);expect(p.checks.length).toBe(3);expect(p.sources.length).toBeGreaterThan(0);expect(p.boundary.length).toBeGreaterThan(50);}expect(pathwayByKey('federal_license')!.money).toContain('you pay');expect(pathwayByKey('crada')!.money.toLowerCase()).toContain('not');});
test('debt and fund packets do not silently use Phase I templates',()=>{expect(packetSections('Loan').join(' ').toLowerCase()).toContain('repayment');expect(packetSections('Fund leverage').join(' ').toLowerCase()).toContain('private capital');expect(packetSections('Contract').join(' ')).not.toContain('Phase I');expect(OPPORTUNITY_PROGRAMS).toContain('Tax incentive');});
test('program map distinguishes access and does not assert open availability',()=>{expect(PROGRAM_REFERENCES.length).toBe(59);expect(new Set(PROGRAM_REFERENCES.map(x=>x.name)).size).toBe(59);for(const p of PROGRAM_REFERENCES){expect(p.availability).toBe('Not checked');expect(p.access.length).toBeGreaterThan(8);expect(p.source.startsWith('https://')).toBe(true);}expect(PROGRAM_REFERENCES.find(x=>x.name==='RBIC')!.note).toContain('non-leveraged');expect(PROGRAM_REFERENCES.find(x=>x.name==='GovTribe')!.note).toContain('Commercial');});
test('grant import preserves provenance and leaves deadline unverified',()=>{const d=normalizeGrant({id:123,opportunityTitle:'Clean water',opportunityNumber:'W-1',agencyDetails:{agencyName:'Example agency'},synopsis:{fundingInstruments:[{id:'CA',description:'Cooperative agreement'}],responseDateStr:'2027-03-02T00:00:00Z',synopsisDesc:'<p>Research &amp; tests</p>',applicantTypes:[{description:'Small businesses'}]}});expect(d.program).toBe('Cooperative agreement');expect(d.deadline_verified).toBe(false);expect(d.close_date).toBe('2027-03-02');expect(d.source_text).toContain('fundingInstruments');expect(d.technical_objective).toBe('Research & tests');expect(d.external_id).toBe('123');});
test('unparseable and impossible dates stay unknown',()=>{expect(sourceDate('next spring')).toBeNull();expect(sourceDate('2026-02-30')).toBeNull();expect(sourceDate(null)).toBeNull();});

import {suggestedNextStep} from '../src/lib/plan';
test('human next-step card retains complete qualifiers and has a safe fallback',()=>{
 expect(suggestedNextStep('## One useful next step\n\nAsk one operator, but do not assume a sale.\n\n## Sources\nLink')).toBe('Ask one operator, but do not assume a sale.');
 expect(suggestedNextStep('## One small next step\nCheck the current rules first.')).toBe('Check the current rules first.');
 expect(suggestedNextStep('No action heading')).toBeNull();
 expect(suggestedNextStep('## Your next step\n'+ 'x'.repeat(901))).toBeNull();
});
import {classifyOwner,parseDetail,searchParams,technologyFromHit,technologyFromPatent,statusLabel,validKey,normalizeResults} from '../../../backend/lib/patents';
test('SBIR path is a distinct seven-step route with the 2026 reauthorization and no invented amounts',()=>{
 const s=pathwayByKey('sbir_track')!;expect(s.steps.length).toBe(7);expect(s.boundary).toContain('September 30, 2031');expect(s.boundary).toContain('119-83');
 expect(JSON.stringify(s)).not.toMatch(/\$\d/);expect(s.money).toContain('takes no equity');
 const p=pathwayByKey('patent_license')!;expect(p.money).toContain('pay the patent owner');expect(p.boundary).toContain('territorial');
});
test('patent owners are labelled from the listed assignee only',()=>{
 expect(classifyOwner('')).toBe('individual');expect(classifyOwner('The Regents Of The University Of California')).toBe('university');
 expect(classifyOwner('The United States Of America As Represented By The Secretary Of The Navy')).toBe('federal_lab');
 expect(classifyOwner('Fluidion Sas')).toBe('company');expect(classifyOwner('Bao Tran')).toBe('unknown');
});
test('patent search query keeps filters and the 20-year cut-off',()=>{
 const q=searchParams({q:'water (sensor) & x',country:'US',status:'GRANT',age:'old',owner:'Navy'},new Date('2026-10-18T12:00:00Z'));
 expect(q).toBe('q=(water+sensor+x)&num=10&type=PATENT&country=US&status=GRANT&assignee=Navy&before=filing:20061018');
 expect(searchParams({q:'a b',country:'ZZ',status:'nope'})).toBe('q=(a+b)&num=10&type=PATENT');
 expect(validKey('US12595447B2')).toBe(true);expect(validKey('US1;DROP')).toBe(false);
 expect(normalizeResults({results:{total_num_results:2,cluster:[{result:[{patent:{publication_number:'US6536272B1',title:' Water &amp; monitoring &hellip;',assignee:'University Of Miami'}},{patent:{publication_number:'bad'}}]}]}}).items).toEqual([expect.objectContaining({key:'US6536272B1',title:'Water & monitoring',ownerKind:'university'})]);
});
test('patent record parsing ignores citing patents and never asserts availability',()=>{
 const html='<span itemprop="title">Water module</span><dd itemprop="assigneeCurrent">Example University</dd><dd itemprop="assigneeOriginal">Example University</dd><span itemprop="inventor">Ada Lane</span><span itemprop="ifiStatus">Expired - Fee Related</span><time itemprop="expiration" datetime="2020-10-19">x</time><div class="abstract">A sampler &amp; pump.</div><li itemprop="events"></li><tr itemprop="forwardReferences"><span itemprop="assigneeOriginal">Big Other Corp</span></tr>';
 const d=parseDetail(html);expect(d.currentOwners).toEqual(['Example University']);expect(d.originalOwners).toEqual(['Example University']);expect(d.expires).toBe('2020-10-19');expect(statusLabel(d.status)).toBe('Appears expired or lapsed');
 const t=technologyFromPatent('US6536272B1',d,'2026-10-18T00:00:00Z');expect(t.origin_kind).toBe('university');expect(t.licensing_status).toBe('unknown');expect(t.ip_info).toContain('freedom-to-operate');expect(t.source_name).toContain('not an official');
 expect(technologyFromHit('US1234567B2',{key:'US9999999B2',title:'x'},'2026-10-18')).toBeNull();
 const h=technologyFromHit('US1234567B2',{key:'US1234567B2',title:'<b>Probe</b>',assignee:''},'2026-10-18')!;expect(h.name).toBe('Probe');expect(h.origin_kind).toBe('individual');expect(h.patent_status).toBe('');
});
