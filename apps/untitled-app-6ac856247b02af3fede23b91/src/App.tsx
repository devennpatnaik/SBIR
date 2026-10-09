import { useState } from 'react';
import { BookOpen, Briefcase, ClipboardList, FileText, FlaskConical, Gauge, Landmark, LogOut, Map, MessageSquare, Scale, Search } from 'lucide-react';
import { client, useSession } from './client';
import { useRoute, navigate } from './lib/router';
import { cn } from './lib/utils';
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
  const route = useRoute();
  const [assistantOpen, setAssistantOpen] = useState(false);

  if (isPending) return null;
  if (!session) return <SignIn />;

  const [section = 'dashboard', id] = route;
  const active = SECTION_OF[section] ?? section;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
          <BookOpen className="size-5 text-blue-700" />
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
          <button type="button" onClick={() => setAssistantOpen(true)} className="flex w-full items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            <MessageSquare className="size-4" />Research assistant
          </button>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="truncate" title={session.user.email}>{session.user.email}</span>
            <button type="button" aria-label="Sign out" title="Sign out" onClick={() => client.auth.signOut()} className="rounded p-1 hover:bg-slate-100"><LogOut className="size-3.5" /></button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-6">
        <div className="mx-auto max-w-6xl">
          {section === 'dashboard' && <Dashboard />}
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
          {!['dashboard', 'discover', 'tech', 'compare', 'projects', 'licensing', 'funding', 'proposals', 'roadmap', 'documents'].includes(section) && (
            <p className="text-sm">Page not found. <button type="button" className="text-blue-700 underline" onClick={() => navigate('dashboard')}>Go to dashboard</button></p>
          )}
        </div>
      </main>
      <AssistantDrawer open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (mode: 'signIn' | 'signUp') => {
    setBusy(true);
    setError('');
    try {
      const result = mode === 'signUp'
        ? await client.auth.signUp.email({ email, password, name: email })
        : await client.auth.signIn.email({ email, password });
      setError(result.error?.message ?? '');
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <BookOpen className="mx-auto mb-2 size-8 text-blue-700" />
          <h1 className="text-xl font-semibold">Lab to Market</h1>
          <p className="mt-1 text-sm text-slate-600">Find a federal-lab technology, license it, fund it through SBIR/STTR, and bring it to market.</p>
        </div>
        <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <label className="flex flex-col gap-1 text-sm">Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required className="rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <button type="submit" disabled={busy} onClick={() => submit('signIn')} className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800">Sign in</button>
          <button type="button" disabled={busy} onClick={() => submit('signUp')} className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Create account</button>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">Your projects are private to your account.</p>
      </div>
    </main>
  );
}
