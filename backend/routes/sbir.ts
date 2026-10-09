import { Hono } from 'hono';
import { appUser } from '../lib/auth';
import type { Env } from '../lib/env';

/**
 * Proxies the official SBIR.gov public solicitation API (https://www.sbir.gov/api).
 * The API has been intermittently unavailable; when it fails we say so rather than
 * returning anything invented.
 */
export const sbirRoutes = new Hono<{ Bindings: Env }>().get('/solicitations', async c => {
  const user = await appUser(c.env, c.req.raw);
  if (!user) return c.json({ error: 'Sign in first' }, 401);

  const params = new URLSearchParams();
  const keyword = c.req.query('keyword') ?? '';
  const agency = c.req.query('agency') ?? '';
  if (keyword) params.set('keyword', keyword);
  if (agency) params.set('agency', agency);
  if (c.req.query('open') !== '0') params.set('open', '1');
  params.set('rows', '50');
  const apiUrl = `https://api.www.sbir.gov/public/api/solicitations?${params}`;

  try {
    const res = await fetch(apiUrl, { headers: { Accept: 'application/json', 'User-Agent': 'LabToMarket/1.0' }, signal: AbortSignal.timeout(20000) });
    const textBody = await res.text();
    if (!res.ok) {
      return c.json({ available: false, apiUrl, status: res.status, message: `SBIR.gov API answered HTTP ${res.status}: ${textBody.slice(0, 200)}` });
    }
    let data: unknown;
    try {
      data = JSON.parse(textBody);
    } catch {
      return c.json({ available: false, apiUrl, status: res.status, message: 'SBIR.gov API returned something other than JSON.' });
    }
    return c.json({ available: true, apiUrl, retrievedAt: new Date().toISOString(), results: Array.isArray(data) ? data : [] });
  } catch (error) {
    return c.json({ available: false, apiUrl, status: 0, message: `Could not reach SBIR.gov API: ${error instanceof Error ? error.message : 'network error'}` });
  }
});
