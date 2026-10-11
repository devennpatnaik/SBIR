import { useEffect, useState } from 'react';
import { Menu, X, BookOpen, Briefcase, LifeBuoy, ClipboardList, FileText, FlaskConical, Gauge, Landmark, LogOut, Map, MessageSquare, Scale, Search } from 'lucide-react';
import { client, useSession } from './client';
import { setStorageUser, useActiveProjectId, useRoute, navigate } from './lib/router';
import { cn } from './lib/utils';
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

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: Gauge },
  { key: 'discover', label: 'Discover Technologies', icon: Search },
  { key: 'compare', label: 'Compare Technologies', icon: Scale },
  { key: 'projects', label: 'My Projects', icon: Briefcase },
  { key: 'licensing', label: 'Licensing', icon: Landmark },
  { key: 'funding', label: 'Funding Opportunities', icon: FlaskConical },
  { key: 'proposals', label: 'Proposal Workspace', icon: ClipboardList },
  { key: 'roadmap', label: 'Commercialization Roadmap', icon: Map },
  { key: 'documents', label: 'Documents & Research', icon: FileText },
];
const SECTION_OF: Record<string, string> = { tech: 'discover', funding: 'funding' };

export function App() {
  const { data: session, isPending } = useSession();
  if (isPending) return <p role="status" className="p-8 text-sm text-slate-500">Opening your workspace…</p>;
  if (!session) return <SignIn />;
  setStorageUser(session.user.id);
  return <Workspace key={session.user.id} user={session.user} />;
}

function Workspace({ user }: { user: { id: string; email: string } }) {
  const route = useRoute();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActive] = useActiveProjectId();
  const projects = useQuery<Project>('projects', q => q.eq('archived', false).order('updated_at', { ascending: false }));
  useEffect(() => {
    if (!projects.loading && !projects.error && !projects.data.some(p => p.id === activeId)) setActive(projects.data[0]?.id ?? null);
  }, [projects.data, projects.loading, projects.error, activeId, setActive]);
  useEffect(() => { setMenuOpen(false); }, [route.join('/')]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenuOpen(false); setAssistantOpen(false); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  const [section = 'dashboard', id] = route;
  const active = SECTION_OF[section] ?? section;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {menuOpen && <button type="button" aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-slate-900/40 md:hidden" onClick={() => setMenuOpen(false)} />}
      <aside id="main-navigation" className={cn('fixed inset-y-0 left-0 z-40 h-dvh w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:sticky md:top-0 md:flex', menuOpen ? 'flex' : 'hidden')}>
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
          <BookOpen className="size-5 text-blue-700" /><button aria-label="Close menu" type="button" onClick={() => setMenuOpen(false)} className="absolute right-2 top-2 p-2 md:hidden"><X className="size-4" /></button>
          <div>
            <div className="text-sm font-semibold leading-tight">Lab to Market</div>
            <div className="text-[11px] text-slate-500">Federal tech → SBIR → product</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Main">
          {NAV.map(n => (
            <a key={n.key} href={`#/${n.key}`} className={cn('flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm', active === n.key ? 'bg-blue-50 font-medium text-blue-800' : 'text-slate-700 hover:bg-slate-100')}>
              <n.icon className="size-4 shrink-0" />{n.label}
            </a>
          ))}
        </nav>
        <div className="space-y-2 border-t border-slate-100 p-3">
          <DemoLauncher />
          <a href="#/help" className={cn('flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium', active === 'help' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50')}>
            <LifeBuoy className="size-4" />Free help & programs
          </a>
          <button type="button" onClick={() => setAssistantOpen(true)} className="flex w-full items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            <MessageSquare className="size-4" />Research assistant
          </button>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="truncate" title={user.email}>{user.email}</span>
            <button type="button" aria-label="Sign out" title="Sign out" onClick={() => client.auth.signOut()} className="rounded p-1 hover:bg-slate-100"><LogOut className="size-3.5" /></button>
          </div>
        </div>
      </aside>
      <main id="workspace" className="min-w-0 flex-1 px-4 py-4 md:px-8 md:py-6">
        <header className="mb-4 flex items-center justify-between md:hidden"><span className="font-semibold">Lab to Market</span><button type="button" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(true)} className="rounded border bg-white p-2"><Menu className="size-5" /></button></header>
        <div className="mx-auto max-w-6xl">
          <DataErrorBanner />
          <DemoGuide section={section} />
          {section === 'dashboard' && <Dashboard />}
          {section === 'help' && <Help />}
          {section === 'discover' && <Discover />}
          {section === 'tech' && id && <TechnologyDetail id={id} />}
          {section === 'compare' && <Compare />}
          {section === 'projects' && !id && <Projects />}
          {section === 'projects' && id && <ProjectWorkspace id={id} />}
          {section === 'licensing' && <Licensing />}
          {section === 'funding' && !id && <Funding />}
          {section === 'funding' && id && <OpportunityDetail id={id} />}
          {section === 'proposals' && <Proposals id={id} />}
          {section === 'roadmap' && <Roadmap />}
          {section === 'documents' && <Documents />}
          {!['dashboard', 'discover', 'tech', 'compare', 'projects', 'licensing', 'funding', 'proposals', 'roadmap', 'documents', 'help'].includes(section) && (
            <p className="text-sm">Page not found. <button type="button" className="text-blue-700 underline" onClick={() => navigate('dashboard')}>Go to dashboard</button></p>
          )}
        </div>
      </main>
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

function SignIn() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <BookOpen className="mx-auto mb-2 size-8 text-blue-700" />
          <h1 className="text-xl font-semibold">Lab to Market</h1>
          <p className="mt-1 text-sm text-slate-600">Find a federal-lab technology, license it, fund it through SBIR/STTR, and bring it to market.</p>
        </div>
        <form noValidate onSubmit={e => { e.preventDefault(); void submit(e.currentTarget); }} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">{signUp ? 'Create your account' : 'Sign in'}</h2>
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
