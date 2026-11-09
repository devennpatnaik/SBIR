import { useEffect, useState } from 'react';
import { isProductTrack, persistTrack, readStoredTrack, type ProductTrack } from './track';

/** Routes that live outside a product track (auth, welcome, kickoff wizard). */
const TRACKLESS = new Set(['signin', 'signup', 'start', '']);

type Parsed = { track: ProductTrack | null; route: string[] };

function parseHash(): Parsed {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [pathPart, query = ''] = raw.split('?');
  const parts = (pathPart || '').split('/').filter(Boolean);
  const sp = new URLSearchParams(query);
  let track: ProductTrack | null = null;
  let route = parts;

  if (isProductTrack(parts[0])) {
    track = parts[0];
    route = parts.slice(1);
  } else if (isProductTrack(sp.get('track'))) {
    track = sp.get('track') as ProductTrack;
  }

  // Legacy aliases
  if (!track && parts[0] === 'sbir-path') {
    track = 'sbir';
    route = ['path', ...parts.slice(1)];
  }
  if (!track && parts[0] === 'explore') {
    track = 'patents';
    route = parts.slice(1).length ? parts.slice(1) : ['home'];
  }

  return { track, route };
}

/** Sync track from URL ↔ storage; rewrite bare in-app paths to include the track prefix. */
function syncTrackFromLocation(): Parsed {
  const parsed = parseHash();
  const first = parsed.route[0] ?? '';
  if (parsed.track) {
    if (readStoredTrack() !== parsed.track) persistTrack(parsed.track);
    return parsed;
  }
  if (TRACKLESS.has(first) || first === 'signin' || first === 'signup' || first === 'start') {
    return parsed;
  }
  // Bare path like #/dashboard or #/discover — attach stored/default track
  if (first) {
    const track = readStoredTrack() ?? 'sbir';
    const rest = parsed.route.join('/');
    const next = `#/${track}/${rest}${window.location.hash.includes('?') ? `?${window.location.hash.split('?')[1]}` : ''}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', next);
    }
    persistTrack(track);
    return { track, route: parsed.route };
  }
  return parsed;
}

const parse = () => {
  const { track, route } = syncTrackFromLocation();
  // Empty path: track URL (#/sbir or #/patents) → home; bare #/ → welcome ([])
  if (!route.length) return track ? ['home'] : [];
  return route;
};

export function useRoute(): string[] {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const h = () => { setRoute(parse()); window.scrollTo(0, 0); };
    h();
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return route;
}

/** Track from the URL only (null on welcome / auth). */
export function getUrlTrack(): ProductTrack | null {
  return parseHash().track;
}

export function getActiveTrack(): ProductTrack {
  const { track } = parseHash();
  return track ?? readStoredTrack() ?? 'sbir';
}

/**
 * Navigate within the active track (auto-prefix), or switch tracks when path starts
 * with `sbir/` or `patents/`. Trackless auth/kickoff paths stay unprefixed.
 */
export const navigate = (path: string) => {
  const clean = path.replace(/^\//, '');
  const first = clean.split('/')[0] ?? '';

  if (clean === 'sbir' || clean.startsWith('sbir/')) {
    persistTrack('sbir');
    window.location.hash = `/${clean === 'sbir' ? 'sbir/pursue' : clean}`;
    return;
  }
  if (clean === 'patents' || clean.startsWith('patents/')) {
    persistTrack('patents');
    window.location.hash = `/${clean === 'patents' ? 'patents/home' : clean}`;
    return;
  }
  // Legacy
  if (clean === 'sbir-path' || clean.startsWith('sbir-path/')) {
    persistTrack('sbir');
    window.location.hash = '/sbir/path';
    return;
  }
  if (first === 'start' || first === 'signin' || first === 'signup') {
    window.location.hash = `/${clean}`;
    return;
  }
  if (!clean) {
    window.location.hash = '/';
    return;
  }

  const track = readStoredTrack() ?? getActiveTrack();
  persistTrack(track);
  window.location.hash = `/${track}/${clean}`;
};

/** Enter a track and land on its home (or an optional in-track path). */
export function enterTrack(track: ProductTrack, inTrackPath?: string) {
  persistTrack(track);
  const fallback = track === 'sbir' ? 'pursue' : 'home';
  const path = (inTrackPath ?? fallback).replace(/^\//, '');
  window.location.hash = `/${track}/${path || fallback}`;
}

let account = '';
export function setStorageUser(id: string) { account = id; }
const storageKey = () => `ltm:${account}:active-project`;
const subs = new Set<(id: string | null) => void>();
export function getActiveProject(): string | null { return localStorage.getItem(storageKey()); }
export function setActiveProject(id: string | null) {
  if (id) localStorage.setItem(storageKey(), id); else localStorage.removeItem(storageKey());
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

window.addEventListener('storage', e => { if (e.key === storageKey()) subs.forEach(s => s(getActiveProject())); });
