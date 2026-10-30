import { flag, on, type Args } from '../args.ts';
import { api, CliError } from '../api.ts';
import { emit, jsonMode, printLines } from '../format.ts';

type GrantHit = {
  id?: string;
  number?: string;
  title?: string;
  agency?: string;
  agencyName?: string;
  openDate?: string;
  closeDate?: string;
  oppStatus?: string;
};

type PatentHit = {
  key?: string;
  title?: string;
  assignee?: string;
  country?: string;
  url?: string;
  snippet?: string;
};

function keywords(args: Args, from: number): string {
  const words = args._.slice(from).filter(word => !word.startsWith('-'));
  const text = words.join(' ').trim();
  if (!text) throw new CliError('Add a search phrase.');
  return text;
}

function field(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export async function grantsSearch(args: Args): Promise<void> {
  const keyword = keywords(args, 2);
  const instrument = flag(args, 'instrument') ?? '';
  const start = Number(flag(args, 'start') ?? '0');
  const body = await api<{ items: GrantHit[]; total: number; source?: string }>(`/grants/search`, {
    body: {
      keyword,
      start: Number.isFinite(start) ? start : 0,
      instrument,
      smallBusinessOnly: on(args, 'small-business'),
    },
  });
  const items = body.items ?? [];
  printLines(
    items.map(hit => ({
      title: hit.title || 'Untitled opportunity',
      meta: [hit.agencyName || hit.agency, hit.number, hit.closeDate ? `closes ${hit.closeDate}` : '', hit.oppStatus].filter(Boolean).join(' · '),
      command: hit.id ? `grants import ${hit.id}` : undefined,
    })),
    jsonMode(args),
    body,
    'No matching Grants.gov opportunities.',
  );
  if (!jsonMode(args)) console.log(`\n${body.total ?? items.length} hits. A match is not an eligibility decision. Confirm the notice on Grants.gov.`);
}

export async function grantsImport(args: Args): Promise<void> {
  const id = args._[2];
  if (!id || !/^\d{1,10}$/.test(id)) throw new CliError('Use the numeric Grants.gov opportunity id from the search.');
  const saved = await api<{ id: string; created: boolean }>('/grants/import', { body: { id } });
  const project = flag(args, 'project');
  if (project) {
    await api('/data/rest/project_opportunities', {
      method: 'POST',
      body: { project_id: project, opportunity_id: saved.id, status: 'considering', notes: '' },
    });
  }
  const follow = project ? `Linked to project ${project}.` : `Attach it with: grants import ${id} --project <projectId>`;
  emit(jsonMode(args), { ...saved, projectId: project ?? null }, `${saved.created ? 'Saved' : 'Already saved'} opportunity ${saved.id}.\n${follow}`);
}

export async function patentsSearch(args: Args): Promise<void> {
  const q = keywords(args, 2);
  const page = Number(flag(args, 'page') ?? '0');
  const body = await api<{ items?: PatentHit[]; total?: number; links?: { label: string; url: string }[]; error?: string }>('/patents/search', {
    body: { q, owner: flag(args, 'owner') ?? '', page: Number.isFinite(page) ? page : 0 },
  });
  const items = body.items ?? [];
  printLines(
    items.map(hit => ({
      title: hit.title || hit.key || 'Patent',
      meta: [hit.key, hit.assignee, hit.country].filter(Boolean).join(' · '),
      command: hit.key ? `patents import ${hit.key}` : hit.url,
    })),
    jsonMode(args),
    body,
    'No patents came back. Try a broader phrase, or open the same search on Google Patents.',
  );
  if (!jsonMode(args) && body.links?.length) {
    console.log('\nSame search elsewhere:');
    for (const link of body.links) console.log(`  ${link.label}: ${link.url}`);
  }
}

export async function patentsImport(args: Args): Promise<void> {
  const key = args._[2];
  if (!key) throw new CliError('Pass a publication number from the search, such as US1234567B2.');
  const saved = await api<{ id: string; created: boolean; partial?: boolean }>('/patents/import', { body: { key } });
  const note = saved.partial ? 'Only the search snippet was saved. Open the official record before you rely on it.' : 'Open the record and confirm status with the patent office.';
  emit(
    jsonMode(args),
    saved,
    `${saved.created ? 'Saved' : 'Already in your collection'} ${saved.id}.\n${note}\n  tech show ${saved.id}`,
  );
}

export async function sbir(args: Args): Promise<void> {
  const keyword = args._.slice(1).join(' ').trim();
  const agency = flag(args, 'agency') ?? '';
  const params = new URLSearchParams();
  if (keyword) params.set('keyword', keyword);
  if (agency) params.set('agency', agency);
  const body = await api<{ available: boolean; message?: string; results?: Record<string, unknown>[]; apiUrl?: string }>(
    `/sbir/solicitations?${params}`,
  );
  if (!body.available) {
    const message = body.message || 'SBIR.gov did not return solicitations.';
    if (jsonMode(args)) console.log(JSON.stringify(body, null, 2));
    else console.log(`${message}\n${body.apiUrl ?? 'https://www.sbir.gov'}`);
    return;
  }
  const results = body.results ?? [];
  printLines(
    results.map(row => ({
      title: field(row, ['solicitation_title', 'title', 'topic_title', 'solicitationTitle', 'name']) || 'Solicitation',
      meta: [
        field(row, ['agency', 'agency_name']),
        field(row, ['solicitation_number', 'number']),
        field(row, ['close_date', 'current_close_date', 'closeDate']),
      ].filter(Boolean).join(' · '),
    })),
    jsonMode(args),
    body,
    'No open solicitations matched. Check the agency site before you treat that as a closed program.',
  );
  if (!jsonMode(args)) console.log('\nTopics and deadlines come only from the current official solicitation. This list is not an application.');
}
