import { useEffect, useState } from 'react';

const parse = () => (window.location.hash.replace(/^#\/?/, '').split('?')[0] || 'dashboard').split('/').filter(Boolean);
export function useRoute(): string[] {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const h = () => { setRoute(parse()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return route;
}
export const navigate = (path: string) => { window.location.hash = `/${path.replace(/^\//, '')}`; };

const KEY = 'ltm:active-project';
const subs = new Set<(id: string | null) => void>();
export function getActiveProject(): string | null { return localStorage.getItem(KEY); }
export function setActiveProject(id: string | null) {
  if (id) localStorage.setItem(KEY, id); else localStorage.removeItem(KEY);
  subs.forEach(s => s(id));
}
export function useActiveProjectId(): [string | null, (id: string | null) => void] {
  const [id, setId] = useState(getActiveProject);
  useEffect(() => { subs.add(setId); return () => { subs.delete(setId); }; }, []);
  return [id, setActiveProject];
}

/** Reads ?key=value from the hash route (re-read on every render; App re-renders on hash change). */
export function hashParam(key: string): string | null {
  const q = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(q).get(key);
}
export function setHashParam(key: string, value: string) {
  const [path, q = ''] = window.location.hash.split('?');
  const sp = new URLSearchParams(q);
  sp.set(key, value);
  window.history.replaceState(null, '', `${path}?${sp}`);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}
