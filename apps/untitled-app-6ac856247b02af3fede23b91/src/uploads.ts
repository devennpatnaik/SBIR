import { client } from './client';
import { authHeaders, readJson, runtimeUrl } from './runtime';

/**
 * One row of bourne_uploads. user_id is null for a file the app itself provides;
 * organization_id is the organization the uploader was acting in, null for a personal file.
 */
export type Upload = {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

/** Lists the uploads the app's policies let the signed-in user read, newest first. */
export async function listUploads(): Promise<Upload[]> {
  const { data, error } = await client
    .from('bourne_uploads')
    .select()
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Upload[];
}

/** Stores a file the signed-in user picked and returns its bourne_uploads row. */
export async function uploadFile(file: File): Promise<Upload> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(runtimeUrl('/uploads'), { method: 'POST', headers: await authHeaders(), body });
  return readJson<Upload>(response);
}

/** Resolves a short-lived URL serving the upload's bytes, for an img, iframe, embed or link. */
export async function uploadUrl(id: string): Promise<string> {
  const response = await fetch(runtimeUrl(`/uploads/${id}/url`), { headers: await authHeaders() });
  const { url } = await readJson<{ url: string }>(response);
  return url;
}

/** Deletes an upload the app's policies let the signed-in user delete. */
export async function deleteUpload(id: string): Promise<void> {
  const response = await fetch(runtimeUrl(`/uploads/${id}`), { method: 'DELETE', headers: await authHeaders() });
  await readJson<unknown>(response);
}
