import { SbirPath } from './pages/SbirPath';
import { Patents } from './pages/Patents';
import { Install } from './components/Install';
import { QuickStart, Welcome, GUEST_START } from './pages/QuickStart';
import { SimplePlan } from './pages/SimplePlan';
import { Pathways } from './pages/Pathways';
import { useEffect, useState } from 'react';
import { Menu, X, ArrowUpRight, LogOut, Sparkles } from 'lucide-react';
import { client, useSession } from './client';
import { setStorageUser, useActiveProjectId, useRoute, navigate } from './lib/router';
import { clearWriteError, invalidate, useDataError, useQuery } from './lib/data';
import { DemoGuide, DemoLauncher } from './components/Demo';
import type { Project } from './lib/types';
import { Dashboard } from './pages/Dashboard';
import { Discover } from './pages/Discover';
import { TechnologyDetail } from './pages/TechnologyDetail';
import { Compare } from './pages/Compare';
import { Projects } from './pages/Projects';
import { ProjectWorkspace } from './pages/ProjectWorkspace';
import { Licensing } from './pages/Licensing';
import { Funding } from './pages/Funding';
import { OpportunityDetail } from './pages/OpportunityDetail';
import { Proposals } from './pages/Proposals';
import { Roadmap } from './pages/Roadmap';
import { Documents } from './pages/Documents';
import { Help } from './pages/Help';
import { AssistantDrawer } from './components/Assistant';
import { Insights } from './pages/Insights';

const EXPLORE = [{ key: 'discover', label: 'Technologies' }, { key: 'patents', label: 'Patents worldwide' }, { key: 'compare', label: 'Compare' }, { key: 'insights', label: 'What we learned' }, { key: 'pathways', label: 'Pathways' }, { key: 'funding', label: 'Funding & revenue' }];
const WORKSPACE = [{ key: 'projects', label: 'My project' }, { key: 'licensing', label: 'Licensing' }, { key: 'proposals', label: 'Applications' }, { key: 'roadmap', label: 'Roadmap' }, { key: 'documents', label: 'Library' }];
const SECTION_OF: Record<string, string> = { tech: 'discover', funding: 'funding' };

export function App() {
  const { data: session, isPending } = useSession();
  const entryRoute=useRoute();
  useEffect(()=>{if(session&&['signin','signup'].includes(entryRoute[0]??''))navigate(sessionStorage.getItem(GUEST_START)?'start':'dashboard');},[session?.user.id,entryRoute[0]]);
  if (isPending) return <p role="status" className="p-8 text-sm text-slate-500">Opening your workspace…</p>;
  const preset=entryRoute[0]==='start'&&(entryRoute[1]==='sbir'||entryRoute[1]==='explore')?entryRoute[1]:undefined;
  if (!session) return entryRoute[0]==='start'?<QuickStart key={preset??''} preset={preset}/>:entryRoute[0]==='sbir-path'?<SbirPath signedIn={false}/>:['signin','signup'].includes(entryRoute[0]??'')?<SignIn key={entryRoute[0]} initialMode={entryRoute[0]==='signup'?'signUp':'signIn'}/>:<Welcome/>;
  setStorageUser(session.user.id);
  return <Workspace key={session.user.id} user={session.user} />;
}

function Workspace({ user }: { user: { id: string; email: string } }) {
  const route = useRoute();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(()=>{const open=()=>setAssistantOpen(true);window.addEventListener('ltm-workflow-chat',open);return()=>window.removeEventListener('ltm-workflow-chat',open);},[]);
  const [activeId, setActive] = useActiveProjectId();
  const projects = useQuery<Project>('projects', q => q.eq('archived', false).order('updated_at', { ascending: false }));
  useEffect(() => {
    if (!projects.loading && !projects.error && !projects.data.some(p => p.id === activeId)) setActive(projects.data[0]?.id ?? null);
  }, [projects.data, projects.loading, projects.error, activeId, setActive]);
  useEffect(() => { setMenuOpen(false); window.scrollTo(0,0); document.querySelector<HTMLAnchorElement>('.context-nav a[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'center'}); }, [route.join('/')]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) { if(menuOpen){setMenuOpen(false);document.querySelector<HTMLButtonElement>('.menu-trigger')?.focus();} if(assistantOpen){setAssistantOpen(false);document.querySelector<HTMLButtonElement>('.ask-button')?.focus();} } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen, assistantOpen]);
  useEffect(() => { if(menuOpen) document.querySelector<HTMLAnchorElement>('#workspace-menu a')?.focus(); }, [menuOpen]);
  const [section = 'dashboard', id] = route;
  const active = SECTION_OF[section] ?? section;
  const simple=!!projects.data.find(p=>p.id===activeId)?.intake_key;

  const group = section==='plan'?'workspace':EXPLORE.some(n => n.key === active) ? 'explore' : WORKSPACE.some(n => n.key === active) ? 'workspace' : 'today';
  const subnav = ['start','plan','sbir-path'].includes(section) ? [] : group === 'explore' ? EXPLORE : group === 'workspace' ? WORKSPACE : [];
  const fullProjectLink=activeId?`projects/${activeId}`:'projects';
  const projectLink = simple&&activeId?`plan/${activeId}`:activeId ? `projects/${activeId}` : 'projects';
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace" onClick={e=>{e.preventDefault();document.getElementById('workspace')?.focus();}}>Skip to content</a>
      <header className="app-header">
        <div className="header-inner">
          <a href="#/dashboard" className="wordmark" aria-label="Lab to Market home"><span className="brand-mark">↗</span>lab to market<span className="brand-dot">.</span></a>
          <nav className="primary-nav" aria-label="Main">
            <a href="#/dashboard" aria-current={group === 'today' && active !== 'help' ? 'page' : undefined}>Today</a>
            <a href="#/discover" aria-current={group === 'explore' ? 'page' : undefined}>Explore</a>
            <a href={`#/${projectLink}`} aria-current={group === 'workspace'||section==='plan' ? 'page' : undefined}>{simple?'My plan':'Workspace'}</a>
          </nav>
          <div className="header-actions">
            <button type="button" onClick={() => setAssistantOpen(true)} className="ask-button" aria-label="Research assistant"><Sparkles size={16} /><span>Ask a guide</span></button>
            <button type="button" className="menu-trigger" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="workspace-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
          </div>
        </div>
        {subnav.length > 0 && <nav className="context-nav" aria-label={group === 'explore' ? 'Explore sections' : 'Project sections'}>{subnav.map(n => <a key={n.key} aria-current={active === n.key ? 'page' : undefined} href={`#/${n.key === 'projects' ? projectLink : n.key}`}>{n.label}</a>)}</nav>}
      </header>
      {menuOpen && <><button className="menu-backdrop" type="button" aria-label="Close navigation overlay" onClick={() => setMenuOpen(false)}/><div id="workspace-menu" className="workspace-menu">
        <div className="eyebrow">Your space</div>
        <a href="#/start">Start an idea <ArrowUpRight size={16}/></a>
        <a href="#/sbir-path">The SBIR path <ArrowUpRight size={16}/></a>
        <a href="#/patents">Search patents worldwide <ArrowUpRight size={16}/></a>
        <a href="#/pathways">Explore all routes <ArrowUpRight size={16}/></a>
        <a href={`#/${fullProjectLink}`}>Full workspace <ArrowUpRight size={16}/></a>
        <a href="#/projects">All projects <ArrowUpRight size={16}/></a>
        <a href="#/help">Free help & programs <ArrowUpRight size={16}/></a>
        <Install/>
        <DemoLauncher />
        <div className="menu-account"><span>{user.email}</span><button type="button" aria-label="Sign out" onClick={() => client.auth.signOut()}><LogOut size={16}/></button></div>
      </div></>}
      <main id="workspace" tabIndex={-1} className="workspace-main">
        <DataErrorBanner />
        <DemoGuide section={section} />
        <div className="page-content" key={section + (id ?? '')}>
          {section === 'dashboard' && <Dashboard />}
          {section === 'start' && <QuickStart key={id??''} userId={user.id} preset={id==='sbir'||id==='explore'?id:undefined}/>}
          {section === 'sbir-path' && <SbirPath signedIn/>}
          {section === 'patents' && <Patents />}
          {section === 'plan' && id && <SimplePlan projectId={id}/>}
          {section === 'help' && <Help />}
          {section === 'discover' && <Discover />}
          {section === 'tech' && id && <TechnologyDetail id={id} />}
          {section === 'compare' && <Compare />}
          {section === 'insights' && <Insights />}
          {section === 'pathways' && <Pathways id={id}/>}
          {section === 'projects' && !id && <Projects />}
          {section === 'projects' && id && <ProjectWorkspace id={id} />}
          {section === 'licensing' && <Licensing />}
          {section === 'funding' && !id && <Funding />}
          {section === 'funding' && id && <OpportunityDetail id={id} />}
          {section === 'proposals' && <Proposals id={id} />}
          {section === 'roadmap' && <Roadmap />}
          {section === 'documents' && <Documents />}
          {!['start','sbir-path','patents','plan','signin','signup','dashboard', 'discover', 'tech', 'compare', 'insights', 'pathways', 'projects', 'licensing', 'funding', 'proposals', 'roadmap', 'documents', 'help'].includes(section) && (
            <p className="text-sm">Page not found. <button type="button" className="text-blue-700 underline" onClick={() => navigate('dashboard')}>Go to dashboard</button></p>
          )}
        </div>
      </main>
      <footer className="app-footer"><span>One thoughtful step at a time.</span><a href="#/help">A little help along the way ↗</a></footer>
      <AssistantDrawer userId={user.id} open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}

function DataErrorBanner() {
  const message = useDataError();
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <span><strong>Something needs attention.</strong> {message}</span>
      <button type="button" onClick={() => { clearWriteError(); invalidate(); }} className="shrink-0 font-medium underline">Try again</button>
    </div>
  );
}

function friendlyAuthError(message: string, mode: 'signIn' | 'signUp'): string {
  const m = message.toLowerCase();
  if (m.includes('email or password') || m.includes('credentials') || m.includes('incorrect')) return 'Email or password is incorrect. If you are new, use Create an account.';
  if (m.includes('already') || m.includes('exists')) return 'An account with this email already exists. Use Sign in instead.';
  if (m.includes('invalid email address') || m.includes('body.email')) return 'Enter a valid email address.';
  if (m.includes('password') && (m.includes('small') || m.includes('short') || m.includes('least'))) return 'Password must be at least 8 characters.';
  if (mode === 'signIn' && (m.includes('invalid') || m.includes('not found'))) return 'Email or password is incorrect. If you are new, use Create an account.';
  return message || (mode === 'signUp' ? 'Could not create the account.' : 'Sign in failed.');
}

function SignIn({initialMode='signIn'}:{initialMode?:'signIn'|'signUp'}) {
  const [mode, setMode] = useState<'signIn' | 'signUp'>(initialMode);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Read the fields from the form itself so browser/password-manager autofill is always included.
  const submit = async (form: HTMLFormElement) => {
    const data = new FormData(form);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const confirm = String(data.get('confirm') ?? '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address.');
    if (mode === 'signUp' && password.length < 8) return setError('Choose a password of at least 8 characters.');
    if (mode === 'signIn' && !password) return setError('Enter your password.');
    if (mode === 'signUp' && password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    setError('');
    try {
      const result = mode === 'signUp'
        ? await client.auth.signUp.email({ email, password, name: email })
        : await client.auth.signIn.email({ email, password });
      if (result.error) setError(friendlyAuthError(result.error.message ?? '', mode));
    } catch (caught) {
      setError(friendlyAuthError(caught instanceof Error ? caught.message : '', mode));
    } finally {
      setBusy(false);
    }
  };

  const signUp = mode === 'signUp';
  return (
    <main className="auth-page"><div className="auth-story"><a href="#" className="wordmark"><span className="brand-mark">↗</span>lab to market.</a><div><p className="eyebrow">FROM RESEARCH TO REAL LIFE</p><h1>Your next idea<br/>starts here.</h1><p>A quieter space to explore lab technologies, plan your business, and take the next step.</p></div><span>Explore. Make a plan. Move forward.</span></div>
      <div className="auth-form">
        <div className="mb-8"><p className="eyebrow">YOUR PRIVATE WORKSPACE</p><h2 className="editorial text-4xl">{signUp ? 'Make room for your idea.' : 'Welcome back.'}</h2><p className="mt-3 text-sm text-slate-500">{signUp ? 'Your starting idea will be here after you sign up.' : 'Pick up where you left off.'}</p></div>
        <form noValidate onSubmit={e => { e.preventDefault(); void submit(e.currentTarget); }} className="flex flex-col gap-5">

          <label className="flex flex-col gap-1 text-sm">Email
            <input name="email" type="email" autoComplete="email" inputMode="email" className="rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">Password
            <input name="password" type="password" autoComplete={signUp ? 'new-password' : 'current-password'} className="rounded-md border border-slate-300 px-3 py-2" />
            {signUp && <span className="text-xs text-slate-500">At least 8 characters.</span>}
          </label>
          {signUp && (
            <label className="flex flex-col gap-1 text-sm">Confirm password
              <input name="confirm" type="password" autoComplete="new-password" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          )}
          {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60">
            {busy ? 'Please wait…' : signUp ? 'Create account' : 'Sign in'}
          </button>
          <p className="text-center text-sm text-slate-600">
            {signUp ? 'Already have an account? ' : 'New here? '}
            <button type="button" className="font-medium text-blue-700 hover:underline" onClick={() => { setMode(signUp ? 'signIn' : 'signUp'); setError(''); }}>
              {signUp ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">Your projects are private to your account.</p>
      </div>
    </main>
  );
}
