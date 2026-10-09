import { useState } from 'react';
import { client, useSession } from './client';

export function App() {
  const { data: session, isPending } = useSession();

  if (isPending) return null;
  if (!session) return <SignIn />;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <header className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{session.user.email}</span>
        <button
          type="button"
          onClick={() => client.auth.signOut()}
          className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
        >
          Sign out
        </button>
      </header>
    </main>
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
      const result =
        mode === 'signUp' ?
          await client.auth.signUp.email({ email, password, name: email }) :
          await client.auth.signIn.email({ email, password });

      setError(result.error?.message ?? '');
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={event => event.preventDefault()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
            className="rounded-md border border-input px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            minLength={8}
            required
            className="rounded-md border border-input px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          onClick={() => submit('signIn')}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Sign in
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => submit('signUp')}
          className="rounded-md border border-input px-3 py-2 text-sm hover:bg-accent"
        >
          Create account
        </button>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
