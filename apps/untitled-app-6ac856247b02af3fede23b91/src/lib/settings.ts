import { client } from '../client';
import { defaultWeights } from './constants';
import { invalidate, useQuery } from './data';
import type { HelpProfile } from './programs';

export type Settings = { user_id: string; weights: Record<string, number>; profile: string; help_profile: HelpProfile };
export function useSettings() {
  const q = useQuery<Settings>('user_settings', b => b.limit(1));
  const s = q.data[0];
  return { weights: { ...defaultWeights(), ...(s?.weights ?? {}) }, profile: s?.profile ?? '', helpProfile: (s?.help_profile ?? {}) as HelpProfile, loading: q.loading };
}
export async function saveSettings(values: Partial<Pick<Settings, 'weights' | 'profile' | 'help_profile'>>) {
  const { data } = await client.from('user_settings').select('user_id').limit(1);
  const res = data && data.length
    ? await client.from('user_settings').update({ ...values, updated_at: new Date().toISOString() }).eq('user_id', (data[0] as { user_id: string }).user_id)
    : await client.from('user_settings').insert({ ...values });
  if (res.error) throw new Error(res.error.message);
  invalidate();
}
