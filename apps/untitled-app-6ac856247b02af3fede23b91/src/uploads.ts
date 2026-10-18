import { client } from './client';
import { authHeaders, dataUrl, readJson } from './runtime';

export type Upload = {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

/** Prefer API list (works even when PostgREST insert grants are limited). */
export async function listUploads(): Promise<Upload[]> {
  try {
    const response = await fetch(dataUrl('/files/uploads'), { headers: await authHeaders() });
    const body = await readJson<{ uploads: Upload[] }>(response);
    return body.uploads ?? [];
  } catch {
    const { data, error } = await client.from('bourne_uploads').select().order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Upload[];
  }
}

export async function uploadFile(file: File): Promise<Upload> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(dataUrl('/files/uploads'), { method: 'POST', headers: await authHeaders(), body });
  return readJson<Upload>(response);
}

export async function uploadUrl(id: string): Promise<string> {
  const response = await fetch(dataUrl(`/files/uploads/${id}/download`), { headers: await authHeaders() });
  if (!response.ok) throw new Error('Could not open the upload.');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function deleteUpload(id: string): Promise<void> {
  const response = await fetch(dataUrl(`/files/uploads/${id}`), { method: 'DELETE', headers: await authHeaders() });
  await readJson<unknown>(response);
}
