import { SbirPath } from './pages/SbirPath';
import { SbirHome } from './pages/SbirHome';
import { Patents } from './pages/Patents';
import { Install } from './components/Install';
import { QuickStart, Welcome, GUEST_START } from './pages/QuickStart';
import { SimplePlan } from './pages/SimplePlan';
import { Pathways } from './pages/Pathways';
import { useEffect, useState } from 'react';
import { Menu, X, ArrowUpRight, LogOut, Sparkles, Landmark, Globe2 } from 'lucide-react';
import { client, useSession } from './client';
import { enterTrack, setStorageUser, useActiveProjectId, useRoute, navigate, getUrlTrack } from './lib/router';
import { useTrack, TRACK_LABEL, type ProductTrack } from './lib/track';
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

const SBIR_EXPLORE = [
  { key: 'discover', label: 'Gov R&D' },
  { key: 'compare', label: 'Compare' },
  { key: 'insights', label: 'What we learned' },
  { key: 'pathways', label: 'Pathways' },
  { key: 'funding', label: 'SBIR & funding' },
];
const SBIR_WORKSPACE = [
  { key: 'projects', label: 'My project' },
  { key: 'licensing', label: 'Licensing' },
  { key: 'proposals', label: 'Applications' },
  { key: 'roadmap', label: 'Roadmap' },
  { key: 'documents', label: 'Library' },
];
const PATENT_NAV = [
  { key: 'home', label: 'Search patents' },
  { key: 'shortlist', label: 'Shortlist' },
  { key: 'compare', label: 'Compare' },
  { key: 'documents', label: 'Notes & files' },
];
const SECTION_OF: Record<string, string> = {
  tech: 'discover',
  funding: 'funding',
  home: 'home',
  path: 'path',
  shortlist: 'shortlist',
  dashboard: 'home',
};

export function App() {
  const { data: session, isPending } = useSession();
  const entryRoute = useRoute();
  const track = useTrack();

  useEffect(() => {
    if (session && ['signin', 'signup'].includes(entryRoute[0] ?? '')) {
      navigate(sessionStorage.getItem(GUEST_START) ? 'start' : (track === 'patents' ? 'patents/home' : 'sbir/home'));
    }
  }, [session?.user.id, entryRoute[0], track]);

  if (isPending) return <p role="status" className="p-8 text-sm text-slate-500">Opening your workspace…</p>;

  const preset = entryRoute[0] === 'start' && (entryRoute[1] === 'sbir' || entryRoute[1] === 'explore') ? entryRoute[1] : undefined;

  if (!session) {
    if (entryRoute[0] === 'start') return <QuickStart key={preset ?? ''} preset={preset} />;
    if (['signin', 'signup'].includes(entryRoute[0] ?? '')) {
      return <SignIn key={entryRoute[0]} initialMode={entryRoute[0] === 'signup' ? 'signUp' : 'signIn'} />;
    }
    // Guest track surfaces — only when URL includes a track prefix
    const urlTrack = getUrlTrack();
    if (urlTrack === 'sbir') {
      if (entryRoute[0] === 'path') return <SbirPath signedIn={false} />;
      return <SbirHome signedIn={false} />;
    }
    if (urlTrack === 'patents') {
      return (
        <div className="guest-track-shell">
          <header className="guest-track-header">
            <a className="wordmark" href="#/"><span className="brand-mark">↗</span>lab to market.</a>
            <a href="#/signin">Sign in</a>
          </header>
          <Patents signedIn={false} />
        </div>
      );
    }
    return <Welcome />;
  }

  setStorageUser(session.user.id);
  return <Workspace key={session.user.id} user={session.user} />;
}

function Workspace({ user }: { user: { id: string; email: string } }) {
  const route = useRoute();
  const track = useTrack();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const open = () => setAssistantOpen(true);
    window.addEventListener('ltm-workflow-chat', open);
    return () => window.removeEventListener('ltm-workflow-chat', open);
  }, []);
  const [activeId, setActive] = useActiveProjectId();
  const projects = useQuery<Project>('projects', q => q.eq('archived', false).order('updated_at', { ascending: false }));
  useEffect(() => {
    if (!projects.loading && !projects.error && !projects.data.some(p => p.id === activeId)) setActive(projects.data[0]?.id ?? null);
  }, [projects.data, projects.loading, projects.error, activeId, setActive]);
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
    document.querySelector<HTMLAnchorElement>('.context-nav a[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [route.join('/'), track]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) {
        if (menuOpen) { setMenuOpen(false); document.querySelector<HTMLButtonElement>('.menu-trigger')?.focus(); }
        if (assistantOpen) { setAssistantOpen(false); document.querySelector<HTMLButtonElement>('.ask-button')?.focus(); }
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen, assistantOpen]);
  useEffect(() => { if (menuOpen) document.querySelector<HTMLAnchorElement>('#workspace-menu a')?.focus(); }, [menuOpen]);

  const [section = 'home', id] = route;
  const active = SECTION_OF[section] ?? section;
  const simple = !!projects.data.find(p => p.id === activeId)?.intake_key;
  const fullProjectLink = activeId ? `projects/${activeId}` : 'projects';
  const projectLink = simple && activeId ? `plan/${activeId}` : activeId ? `projects/${activeId}` : 'projects';

  const isPatents = track === 'patents';
  const exploreKeys = isPatents ? PATENT_NAV.map(n => n.key) : SBIR_EXPLORE.map(n => n.key);
  const group = section === 'plan' || section === 'path'
    ? (section === 'path' ? 'today' : 'workspace')
    : exploreKeys.includes(active) || active === 'discover' || active === 'shortlist'
      ? 'explore'
      : SBIR_WORKSPACE.some(n => n.key === active)
        ? 'workspace'
        : 'today';

  const subnav = isPatents
    ? (['start', 'plan', 'path'].includes(section) ? [] : PATENT_NAV)
    : (['start', 'plan', 'path'].includes(section) ? [] : group === 'explore' ? SBIR_EXPLORE : group === 'workspace' ? SBIR_WORKSPACE : []);

  const homeHref = isPatents ? '#/patents/home' : '#/sbir/home';

  return (
    <div className={`app-shell track-${track}`}>
      <a className="skip-link" href="#workspace" onClick={e => { e.preventDefault(); document.getElementById('workspace')?.focus(); }}>Skip to content</a>
      <header className="app-header">
        <div className="header-inner">
          <a href={homeHref} className="wordmark" aria-label="Lab to Market home"><span className="brand-mark">↗</span>lab to market<span className="brand-dot">.</span></a>
          <nav className="primary-nav" aria-label="Main">
            {isPatents ? (
              <>
                <a href="#/patents/home" aria-current={active === 'home' ? 'page' : undefined}>Patents</a>
                <a href="#/patents/shortlist" aria-current={active === 'shortlist' || active === 'discover' ? 'page' : undefined}>Shortlist</a>
                <a href="#/patents/compare" aria-current={active === 'compare' ? 'page' : undefined}>Compare</a>
              </>
            ) : (
              <>
                <a href="#/sbir/home" aria-current={group === 'today' && active !== 'help' ? 'page' : undefined}>Today</a>
                <a href="#/sbir/discover" aria-current={group === 'explore' ? 'page' : undefined}>Gov R&amp;D</a>
                <a href={`#/sbir/${projectLink}`} aria-current={group === 'workspace' || section === 'plan' ? 'page' : undefined}>{simple ? 'My plan' : 'Workspace'}</a>
              </>
            )}
          </nav>
          <div className="header-actions">
            <TrackChip track={track} />
            <button type="button" onClick={() => setAssistantOpen(true)} className="ask-button" aria-label="Research assistant"><Sparkles size={16} /><span>Ask a guide</span></button>
            <button type="button" className="menu-trigger" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="workspace-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {subnav.length > 0 && (
          <nav className="context-nav" aria-label={isPatents ? 'Patent track sections' : group === 'explore' ? 'SBIR explore' : 'Project sections'}>
            {subnav.map(n => (
              <a
                key={n.key}
                aria-current={active === n.key || (n.key === 'shortlist' && active === 'discover') ? 'page' : undefined}
                href={`#/${track}/${n.key === 'projects' ? projectLink : n.key === 'shortlist' ? 'shortlist' : n.key}`}
              >
                {n.label}
              </a>
            ))}
          </nav>
        )}
      </header>
      {menuOpen && (
        <>
          <button className="menu-backdrop" type="button" aria-label="Close navigation overlay" onClick={() => setMenuOpen(false)} />
          <div id="workspace-menu" className="workspace-menu">
            <div className="eyebrow">Active track</div>
            <p className="menu-track-label">{TRACK_LABEL[track]}</p>
            <button type="button" className="menu-track-switch" onClick={() => enterTrack(track === 'sbir' ? 'patents' : 'sbir')}>
              Switch to {track === 'sbir' ? 'worldwide patents' : 'SBIR route'} <ArrowUpRight size={16} />
            </button>
            <div className="eyebrow">Your space</div>
            {isPatents ? (
              <>
                <a href="#/patents/home">Search patents <ArrowUpRight size={16} /></a>
                <a href="#/patents/shortlist">Shortlist <ArrowUpRight size={16} /></a>
                <a href="#/patents/documents">Notes &amp; files <ArrowUpRight size={16} /></a>
              </>
            ) : (
              <>
                <a href="#/sbir/home">SBIR home <ArrowUpRight size={16} /></a>
                <a href="#/sbir/path">The SBIR path <ArrowUpRight size={16} /></a>
                <a href="#/start/sbir">Start an SBIR idea <ArrowUpRight size={16} /></a>
                <a href="#/sbir/funding">SBIR &amp; funding <ArrowUpRight size={16} /></a>
                <a href={`#/sbir/${fullProjectLink}`}>Full workspace <ArrowUpRight size={16} /></a>
                <a href="#/sbir/help">Free help &amp; programs <ArrowUpRight size={16} /></a>
              </>
            )}
            <Install />
            {!isPatents && <DemoLauncher />}
            <div className="menu-account"><span>{user.email}</span><button type="button" aria-label="Sign out" onClick={() => client.auth.signOut()}><LogOut size={16} /></button></div>
          </div>
        </>
      )}
      <main id="workspace" tabIndex={-1} className="workspace-main">
        <DataErrorBanner />
        {!isPatents && <DemoGuide section={section === 'home' ? 'dashboard' : section} />}
        <div className="page-content" key={`${track}-${section}-${id ?? ''}`}>
          {renderPage({ section, id, track, userId: user.id })}
        </div>
      </main>
      <footer className="app-footer">
        <span>{isPatents ? 'Discover first. Decide later.' : 'One thoughtful step at a time.'}</span>
        {isPatents
          ? <button type="button" className="footer-track-link" onClick={() => enterTrack('sbir')}>Need SBIR coaching? Switch tracks ↗</button>
          : <a href="#/sbir/help">A little help along the way ↗</a>}
      </footer>
      <AssistantDrawer userId={user.id} open={assistantOpen} onClose={() => setAssistantOpen(false)} track={track} />
    </div>
  );
}

function TrackChip({ track }: { track: ProductTrack }) {
  const Icon = track === 'sbir' ? Landmark : Globe2;
  return (
    <button
      type="button"
      className={`track-chip ${track}`}
      title="Switch product track"
      onClick={() => enterTrack(track === 'sbir' ? 'patents' : 'sbir')}
    >
      <Icon size={14} />
      <span>{TRACK_LABEL[track]}</span>
    </button>
  );
}

function renderPage({
  section, id, track, userId,
}: {
  section: string;
  id?: string;
  track: ProductTrack;
  userId: string;
}) {
  const isPatents = track === 'patents';

  if (section === 'home' || section === 'dashboard') {
    return isPatents ? <Patents signedIn /> : <SbirHome signedIn />;
  }
  if (section === 'start') return <QuickStart key={id ?? ''} userId={userId} preset={id === 'sbir' || id === 'explore' ? id : undefined} />;
  if (section === 'path' || section === 'sbir-path') {
    if (isPatents) {
      return (
        <div className="track-redirect">
          <p>The SBIR path belongs to the SBIR route.</p>
          <button type="button" onClick={() => enterTrack('sbir', 'path')}>Open SBIR route →</button>
        </div>
      );
    }
    return <SbirPath signedIn />;
  }
  if (section === 'patents') return <Patents signedIn />;
  if (section === 'shortlist') return <Discover trackMode="patents" />;
  if (section === 'plan' && id) return <SimplePlan projectId={id} />;
  if (section === 'help') {
    if (isPatents) return <Patents signedIn />;
    return <Help />;
  }
  if (section === 'discover') return <Discover trackMode={isPatents ? 'patents' : 'sbir'} />;
  if (section === 'tech' && id) return <TechnologyDetail id={id} trackMode={isPatents ? 'patents' : 'sbir'} />;
  if (section === 'compare') return <Compare />;
  if (section === 'insights') {
    if (isPatents) return <Discover trackMode="patents" />;
    return <Insights />;
  }
  if (section === 'pathways') {
    if (isPatents) return <Patents signedIn />;
    return <Pathways id={id} />;
  }
  if (section === 'projects' && !id) {
    if (isPatents) return <Discover trackMode="patents" />;
    return <Projects />;
  }
  if (section === 'projects' && id) {
    if (isPatents) return <TechnologyDetail id={id} trackMode="patents" />;
    return <ProjectWorkspace id={id} />;
  }
  if (section === 'licensing') {
    if (isPatents) return <Discover trackMode="patents" />;
    return <Licensing />;
  }
  if (section === 'funding' && !id) {
    if (isPatents) return <Patents signedIn />;
    return <Funding />;
  }
  if (section === 'funding' && id) {
    if (isPatents) return <Patents signedIn />;
    return <OpportunityDetail id={id} />;
  }
  if (section === 'proposals') {
    if (isPatents) return <Discover trackMode="patents" />;
    return <Proposals id={id} />;
  }
  if (section === 'roadmap') {
    if (isPatents) return <Discover trackMode="patents" />;
    return <Roadmap />;
  }
  if (section === 'documents') return <Documents />;

  return (
    <p className="text-sm">Page not found. <button type="button" className="text-blue-700 underline" onClick={() => navigate(isPatents ? 'patents/home' : 'sbir/home')}>Go to track home</button></p>
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

function SignIn({ initialMode = 'signIn' }: { initialMode?: 'signIn' | 'signUp' }) {
  const [mode, setMode] = useState<'signIn' | 'signUp'>(initialMode);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
    <main className="auth-page"><div className="auth-story"><a href="#" className="wordmark"><span className="brand-mark">↗</span>lab to market.</a><div><p className="eyebrow">FROM RESEARCH TO REAL LIFE</p><h1>Your next idea<br />starts here.</h1><p>A quieter space to explore lab technologies, plan your business, and take the next step.</p></div><span>Pick a track. Make a plan. Move forward.</span></div>
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
