import { Hono } from 'hono';
import { appUser } from '../lib/auth';
import type { Env } from '../lib/env';
import { headings, mainHtml, meta, title, toText } from '../lib/html';

/** Known technology-listing sources and the lab/agency hints we can look for in page text. */
const SOURCES: { host: RegExp; name: string }[] = [
  { host: /techlinkcenter\.org$/i, name: 'TechLink' },
  { host: /labpartnering\.org$/i, name: 'DOE Lab Partnering Service' },
  { host: /federallabs\.org$/i, name: 'Federal Laboratory Consortium' },
  { host: /\.gov$/i, name: 'Government website' },
];

const LABS: { re: RegExp; lab: string; agency: string }[] = [
  ['Oak Ridge National Laboratory', 'DOE'], ['Argonne National Laboratory', 'DOE'], ['Lawrence Berkeley National Laboratory', 'DOE'],
  ['Lawrence Livermore National Laboratory', 'DOE'], ['Los Alamos National Laboratory', 'DOE'], ['Sandia National Laboratories', 'DOE'],
  ['Pacific Northwest National Laboratory', 'DOE'], ['National Renewable Energy Laboratory', 'DOE'], ['Idaho National Laboratory', 'DOE'],
  ['Brookhaven National Laboratory', 'DOE'], ['Savannah River National Laboratory', 'DOE'], ['National Energy Technology Laboratory', 'DOE'],
  ['Ames National Laboratory', 'DOE'], ['Ames Laboratory', 'DOE'], ['Fermi National Accelerator Laboratory', 'DOE'], ['SLAC National Accelerator Laboratory', 'DOE'],
  ['Princeton Plasma Physics Laboratory', 'DOE'], ['Thomas Jefferson National Accelerator Facility', 'DOE'],
  ['Naval Research Laboratory', 'DoD (Navy)'], ['Naval Surface Warfare Center', 'DoD (Navy)'], ['Naval Air Warfare Center', 'DoD (Navy)'], ['Naval Undersea Warfare Center', 'DoD (Navy)'], ['Naval Information Warfare Center', 'DoD (Navy)'],
  ['Air Force Research Laboratory', 'DoD (Air Force)'], ['Army Research Laboratory', 'DoD (Army)'], ['DEVCOM', 'DoD (Army)'], ['Walter Reed Army Institute of Research', 'DoD (Army)'],
  ['U.S. Army Medical Research', 'DoD (Army)'], ['Army Corps of Engineers', 'DoD (Army)'], ['Engineer Research and Development Center', 'DoD (Army)'],
  ['NASA', 'NASA'], ['National Institutes of Health', 'HHS (NIH)'], ['Centers for Disease Control', 'HHS (CDC)'], ['Food and Drug Administration', 'HHS (FDA)'],
  ['National Institute of Standards and Technology', 'Commerce (NIST)'], ['NOAA', 'Commerce (NOAA)'], ['Agricultural Research Service', 'USDA'],
  ['Department of Veterans Affairs', 'VA'], ['Environmental Protection Agency', 'EPA'], ['U.S. Geological Survey', 'Interior (USGS)'],
].map(([lab, agency]) => ({ re: new RegExp(lab!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), lab: lab!, agency: agency! }));

const PATENT_RE = /\b(?:U\.?S\.?\s*(?:Pat(?:ent)?\.?\s*(?:No\.?)?\s*)?)?(\d{1,2},\d{3},\d{3}|(?:US)?\s?\d{7,8}\s?B[12]|(?:US\s?)?20\d{2}\/?\d{7}\s?A1)\b/g;
const APP_RE = /\b(?:application|appl\.?|serial)\s*(?:no\.?|number)?\s*:?\s*(\d{2}\/\d{3},\d{3}|\d{2}\/\d{6}|PCT\/US\d{2,4}\/\d+)/gi;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.(?:gov|mil|edu|org|com)\b/gi;
const PHONE_RE = /\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g;
const TRL_RE = /\b(?:TRL|technology readiness level)\s*:?\s*(\d)(?:\s*[-–]\s*(\d))?/i;

const uniq = (xs: string[]) => [...new Set(xs.map(x => x.trim()).filter(Boolean))];

export const extractRoutes = new Hono<{ Bindings: Env }>().post('/', async c => {
  const user = await appUser(c.env, c.req.raw);
  if (!user) return c.json({ error: 'Sign in first' }, 401);

  const body = (await c.req.json().catch(() => null)) as { url?: string; html?: string } | null;
  let url: URL;
  try {
    url = new URL(String(body?.url ?? ''));
    if (!/^https?:$/.test(url.protocol) || /^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(url.hostname)) throw new Error('bad');
  } catch {
    return c.json({ error: 'Enter a full public http(s) URL' }, 400);
  }

  const sourceName = SOURCES.find(s => s.host.test(url.hostname))?.name ?? 'Other website';
  const fetchedAt = new Date().toISOString();
  let html = typeof body?.html === 'string' ? body.html : '';
  let httpStatus = 0;

  if (!html) {
    try {
      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LabToMarket/1.0; research tool)', Accept: 'text/html,application/xhtml+xml' },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
      httpStatus = res.status;
      if (!res.ok) {
        return c.json({ ok: false, sourceName, fetchedAt, httpStatus, warning: `The site answered HTTP ${res.status}. Open the link yourself and enter details manually, or paste the page text.` });
      }
      html = (await res.text()).slice(0, 2_000_000);
    } catch (error) {
      return c.json({ ok: false, sourceName, fetchedAt, httpStatus, warning: `Could not reach the site (${error instanceof Error ? error.message : 'network error'}). Enter details manually or paste the page text.` });
    }
  }

  const pageTitle = meta(html, 'og:title') || title(html);
  const description = meta(html, 'og:description') || meta(html, 'description');
  const text = toText(mainHtml(html)).slice(0, 30000);
  const all = `${pageTitle}\n${description}\n${text}`;
  const lab = LABS.find(l => l.re.test(all));
  const trl = all.match(TRL_RE);
  const limited = text.length < 400;

  return c.json({
    ok: true,
    sourceName,
    fetchedAt,
    httpStatus,
    limited,
    warning: limited
      ? `${sourceName} renders its pages in the browser, so only ${text.length} characters of text could be read automatically. Open the link, copy the technology description, and paste it into "Paste page text" to extract more — or fill the form manually.`
      : '',
    title: pageTitle.replace(/\s*[|–-]\s*(TechLink|FLC|Lab Partnering Service|DOE).*$/i, '').trim(),
    description,
    headings: headings(html),
    text,
    patents: uniq([...all.matchAll(PATENT_RE)].map(m => m[1] ?? '')).slice(0, 20),
    applications: uniq([...all.matchAll(APP_RE)].map(m => m[1] ?? '')).slice(0, 20),
    patentPending: /patent[\s-]pending/i.test(all),
    emails: uniq(all.match(EMAIL_RE) ?? []).slice(0, 10),
    phones: uniq(all.match(PHONE_RE) ?? []).slice(0, 5),
    labGuess: lab?.lab ?? '',
    agencyGuess: lab?.agency ?? '',
    trl: trl ? trl.slice(1).filter(Boolean).join('–') : '',
  });
});
