import { ArrowRight, Check, Compass, FlaskConical, Hammer, Rocket } from 'lucide-react';
import { pathwayByKey } from '@project/pathways';
import { enterTrack, navigate } from '../lib/router';
import { Button } from '../components/ui';
/** Plain-English explainer for the SBIR path. Works signed in or out. */
export function SbirPath({signedIn}:{signedIn:boolean}){
 const p=pathwayByKey('sbir_track')!;
 const phases=[[FlaskConical,'Phase I','Prove it can work','A smaller award to test technical feasibility, usually over several months to a year.'],[Hammer,'Phase II','Build and demonstrate it','A larger award for the strongest Phase I projects to develop a prototype.'],[Rocket,'Phase III','Sell it','Follow-on contracts or private sales. Paid from money outside the SBIR set-aside.']] as const;
 return <div className={signedIn?'sbir-path':'sbir-path standalone'}>
  {!signedIn&&<header className="sbir-top"><a className="wordmark" href="#/">  <span className="brand-mark">↗</span>lab to market.</a><a href="#/signin">Sign in</a></header>}
  <p className="eyebrow">TRACK A · SBIR ROUTE</p>
  <h1 className="editorial">Get paid to turn research<br/>into a product.</h1>
  <p className="sbir-lede">Federal agencies set aside part of their research budgets for small businesses. If your company wins an award, the agency pays you to do the research and development. You keep your company. The government takes no equity. This track is for SBIR-eligible government R&amp;D — not a general patent browse.</p>
  <div className="sbir-cta"><Button variant="primary" onClick={()=>navigate('start/sbir')}>Start my SBIR path <ArrowRight size={17}/></Button><button type="button" className="sbir-switch-link" onClick={()=>enterTrack('patents')}>Looking for worldwide patents instead?</button></div>
  <section className="sbir-phases" aria-label="The three phases">{phases.map(([Icon,label,title,note])=><article key={label}><Icon size={22} strokeWidth={1.5}/><span>{label}</span><h2>{title}</h2><p>{note}</p></article>)}</section>
  <section className="sbir-steps"><p className="eyebrow">YOUR SEVEN STEPS</p><h2 className="editorial">From an idea to a submitted proposal.</h2><ol>{p.steps.map((s,i)=><li key={s.title}><span>{i+1}</span><div><h3>{s.title}</h3><p>{s.description}</p></div></li>)}</ol></section>
  <section className="sbir-facts"><h2 className="editorial">Good to know</h2><ul>
   <li><Check size={16}/><span><strong>SBIR or STTR?</strong> With SBIR your company leads the research. STTR requires a formal partnership with a university, nonprofit research institution or federal lab, with set shares of the work.</span></li>
   <li><Check size={16}/><span><strong>A license is separate.</strong> If you build on a lab’s patent, you usually pay the lab for a license. The lab does not pay you. Ask early; you may not need a full license to apply.</span></li>
   <li><Check size={16}/><span><strong>Where things stand.</strong> {p.boundary}</span></li>
   <li><Check size={16}/><span><strong>You stay in control.</strong> We research, organize and draft. You confirm eligibility, and you submit. Nothing is sent or submitted for you.</span></li>
  </ul></section>
  <section className="sbir-sources"><p className="eyebrow">OFFICIAL SOURCES · CHECKED {p.checked_on}</p><ul>{p.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></li>)}</ul><p>General information, not legal advice.</p></section>
  <div className="sbir-cta end"><Button variant="primary" onClick={()=>navigate('start/sbir')}>Start my SBIR path <ArrowRight size={17}/></Button><button type="button" className="sbir-switch-link" onClick={()=>enterTrack('patents')}><Compass size={15}/> Switch to worldwide patents</button></div>
 </div>;
}
