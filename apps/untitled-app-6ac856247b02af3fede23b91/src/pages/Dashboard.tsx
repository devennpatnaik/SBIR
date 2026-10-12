import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { DemoLauncher } from '../components/Demo';
import { useBundle } from '../lib/bundle';
import { statusIndex, statusLabel } from '../lib/constants';
import { fmtDate, useQuery } from '../lib/data';
import { analyze } from '../lib/nextAction';
import { navigate, useActiveProjectId } from '../lib/router';
import type { Project } from '../lib/types';
import { Button, ErrorNote, Select, displayName } from '../components/ui';

export function SeedArt() {
  return <svg className="seed-art" viewBox="0 0 180 180" fill="none" aria-hidden="true"><path d="M90 157V86" stroke="#738966" strokeWidth="1.5"/><path d="M90 124C30 127 15 64 31 30C81 29 108 70 90 124Z" fill="#c6d2ab"/><path d="M90 124C153 125 168 78 157 48C109 46 86 79 90 124Z" fill="#a0b28a"/><path d="M90 124L40 42M90 124L148 59" stroke="#738966"/><circle cx="116" cy="25" r="13" stroke="#8fa379"/><path d="M109 25h14m-7-7v14" stroke="#8fa379"/></svg>;
}
export function Dashboard() {
  const projects = useQuery<Project>('projects', q => q.eq('archived', false).order('updated_at', { ascending: false }));
  const [active, setActive] = useActiveProjectId();
  const current = projects.data.find(p => p.id === active) ?? projects.data[0];
  const b = useBundle(current?.id);
  if (projects.loading) return <p role="status" className="py-20 text-center text-sm text-slate-500">Finding where you left off…</p>;
  if (projects.error) return <ErrorNote error={projects.error}/>;
  if (!current) return <div>
    <div className="home-heading"><div><p className="eyebrow">A SPACE FOR WHAT COMES NEXT</p><h1 className="editorial">Good ideas start<br/>with curiosity.</h1></div><p>Find a technology worth pursuing. Make a plan to license it, fund it, and bring it into the world.</p></div>
    <div className="welcome-grid"><section className="welcome-start"><p className="eyebrow" style={{color:'#cedab9'}}>YOUR FIRST STEP</p><h2 className="editorial">Find your starting point.</h2><p>Save a technology from a federal laboratory. We’ll help you compare your options and work out what to do next.</p><Button className="!bg-[#edf0d2] !text-[#294f3d]" onClick={() => navigate('discover')}>Explore technologies <ArrowRight size={16}/></Button></section><DemoLauncher welcome/></div>
    <div className="journey"><span className="journey-label">A simple path</span>{['Explore','License','Fund','Build'].map((s,i)=><a key={s} href={`#/${['discover','licensing','funding','roadmap'][i]}`}><span>{i+1}</span>{s}</a>)}</div>
  </div>;
  const { actions, deadlines, blockers } = analyze(b);
  const next = actions[0];
  const idx = statusIndex(current.status);const phase=idx<2?0:idx<5?1:idx<9?2:3;
  return <div>
    <div className="home-heading"><div><p className="eyebrow">YOUR IDEA, IN MOTION</p><h1 className="editorial">A little progress,<br/>every day.</h1></div>{projects.data.length>1?<Select aria-label="Active project" value={current.id} onChange={e=>setActive(e.target.value)} options={projects.data.map(p=>[p.id,displayName(p.name)] as [string,string])} className="max-w-64"/>:<p>You don’t need to figure it all out today. Start with the next useful step.</p>}</div>
    <ErrorNote error={b.error}/>
    <div className="home-hero"><section className="next-step"><div className="eyebrow">YOUR NEXT STEP · {next?.area ?? 'PROJECT'}</div><h2 className="editorial">{b.loading?'Finding your next step…':displayName(next?.title ?? 'Make space for what’s next.')}</h2><p>{b.loading?'Checking your saved project.':displayName(next?.why ?? 'Review your project, add a task, or choose your next milestone.')}</p><button type="button" disabled={b.loading || !!b.error} className="hero-cta" onClick={()=>navigate(next?.link ?? `projects/${current.id}`)}>Let’s do this <ArrowRight size={17}/></button></section>
      <section className="project-preview"><SeedArt/><div className="eyebrow">THE IDEA YOU’RE PURSUING</div><h2 className="editorial relative max-w-[270px]">{displayName(current.name)}</h2><p className="project-text">{b.tech?displayName(b.tech.name):'Loading your technology…'}</p><p className="project-stage">Currently: {statusLabel(current.status)}</p><a href={`#/projects/${current.id}`}>Open your project <ArrowUpRight size={19}/></a></section></div>
    <div className="journey"><span className="journey-label">Your path</span>{['Explore','License','Fund','Build'].map((s,i)=><a className={phase===i?'current':''} aria-current={phase===i?'step':undefined} key={s} href={`#/${['discover','licensing','funding','roadmap'][i]}`}><span>{i+1}</span>{s}</a>)}</div>
    <div className="home-lower"><section><div className="section-heading"><h2>Coming up</h2><a href={`#/projects/${current.id}?tab=tasks`}>All tasks ↗</a></div>{b.loading?<p className="text-sm text-slate-500">Checking dates…</p>:<ul className="simple-list">{deadlines.slice(0,3).map(d=><li key={d.label+d.date}><a href={`#/${d.link}`}><span>{displayName(d.label)}{!d.verified&&<span className="block text-xs text-amber-800">Date needs verification</span>}</span><span className="date">{fmtDate(d.date)}</span></a></li>)}{!deadlines.length&&<li className="text-sm text-slate-500">No deadlines in the next 30 days.</li>}</ul>}</section>
      <section><div className="section-heading"><h2>Worth resolving</h2><a href={`#/projects/${current.id}?tab=questions`}>Open questions ↗</a></div><ul className="simple-list">{blockers.slice(0,2).map(x=><li key={x.label}><a href={`#/${x.link}`}><span>{displayName(x.label)}</span><ArrowUpRight className="shrink-0 text-slate-400" size={17}/></a></li>)}{!blockers.length&&<li className="text-sm text-slate-500">Nothing is marked as blocked right now.</li>}</ul></section></div>
  </div>;
}
