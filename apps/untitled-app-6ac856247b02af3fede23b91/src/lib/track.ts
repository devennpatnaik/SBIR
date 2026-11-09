/** Product track: SBIR commercialization vs worldwide patent discovery. */
import { useEffect, useState } from 'react';

export type ProductTrack = 'sbir' | 'patents';

const STORAGE_KEY = 'ltm:active-track';

export const TRACK_LABEL: Record<ProductTrack, string> = {
  sbir: 'DFU match',
  patents: 'Patents (demoted)',
};

export function isProductTrack(v: string | null | undefined): v is ProductTrack {
  return v === 'sbir' || v === 'patents';
}

export function readStoredTrack(): ProductTrack | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return isProductTrack(v) ? v : null;
  } catch {
    return null;
  }
}

export function persistTrack(track: ProductTrack) {
  try {
    localStorage.setItem(STORAGE_KEY, track);
    sessionStorage.setItem(STORAGE_KEY, track);
  } catch { /* private mode */ }
  window.dispatchEvent(new CustomEvent('ltm-track-change', { detail: { track } }));
}

/** Default home path inside a track (without leading hash). */
export function trackHome(track: ProductTrack): string {
  // DFU MVP: land on the ranked pursue queue, not the SBIR curriculum home.
  return track === 'sbir' ? 'sbir/pursue' : 'patents/home';
}

export function otherTrack(track: ProductTrack): ProductTrack {
  return track === 'sbir' ? 'patents' : 'sbir';
}

export function useTrack(): ProductTrack {
  const [track, setTrack] = useState<ProductTrack>(() => readStoredTrack() ?? 'sbir');
  useEffect(() => {
    const sync = () => setTrack(readStoredTrack() ?? 'sbir');
    sync();
    window.addEventListener('ltm-track-change', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('ltm-track-change', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);
  return track;
}
