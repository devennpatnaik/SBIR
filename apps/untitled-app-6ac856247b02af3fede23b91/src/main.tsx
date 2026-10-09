import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const PRELOAD_RELOAD_STORAGE_KEY = 'bourne:preload-reloaded-at';
const PRELOAD_RELOAD_INTERVAL_MS = 10_000;

type PageErrorBoundaryState = { hasError: boolean };

class PageErrorBoundary extends Component<{ children: ReactNode }, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PageErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
          <p>Something went wrong loading this page.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
          >
            Reload
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

/** Reloads when a deploy replaces hashed files needed by a lazy import. */
const handlePreloadError = (event: Event): void => {
  const now = Date.now();
  const lastReloadAt = Number(sessionStorage.getItem(PRELOAD_RELOAD_STORAGE_KEY));
  if (now - lastReloadAt < PRELOAD_RELOAD_INTERVAL_MS) return;

  event.preventDefault();
  sessionStorage.setItem(PRELOAD_RELOAD_STORAGE_KEY, String(now));
  window.location.reload();
};

window.addEventListener('vite:preloadError', handlePreloadError);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PageErrorBoundary>
      <App />
    </PageErrorBoundary>
  </StrictMode>,
);
