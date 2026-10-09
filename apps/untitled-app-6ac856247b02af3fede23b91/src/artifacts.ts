import { client } from './client';
import { authHeaders, readJson, runtimeUrl } from './runtime';

/**
 * One row of bourne_artifacts: something an agent wrote for its user. A document's
 * Markdown is in each revision's content; a file's bytes are behind artifactUrl().
 * user_id is null for an artifact the app itself provides; organization_id is the
 * organization the user was acting in, null for a personal artifact.
 */
export type Artifact = {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  type: 'document' | 'file';
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

/**
 * One row of bourne_artifact_revisions: one time an agent wrote the artifact.
 * content is the Markdown of a document revision and null for a file revision.
 */
export type ArtifactRevision = {
  id: string;
  artifact_id: string;
  run_id: string;
  function_name: string;
  content: string | null;
  name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

/** Lists the artifacts the app's policies let the signed-in user read, most recently written first. */
export async function listArtifacts(): Promise<Artifact[]> {
  const { data, error } = await client
    .from('bourne_artifacts')
    .select()
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Artifact[];
}

/** Lists an artifact's revisions, newest first; the first is its current content. */
export async function artifactRevisions(artifactId: string): Promise<ArtifactRevision[]> {
  const { data, error } = await client
    .from('bourne_artifact_revisions')
    .select()
    .eq('artifact_id', artifactId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ArtifactRevision[];
}

/** Lists the revisions one agent turn wrote, in the order it wrote them. */
export async function runArtifacts(runId: string): Promise<ArtifactRevision[]> {
  const { data, error } = await client
    .from('bourne_artifact_revisions')
    .select()
    .eq('run_id', runId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ArtifactRevision[];
}

/**
 * Resolves a short-lived URL serving a file artifact's bytes, for an img, iframe, embed or link:
 * its latest revision, or the one named.
 */
export async function artifactUrl(artifactId: string, revisionId?: string): Promise<string> {
  const query = revisionId ? `?revision=${encodeURIComponent(revisionId)}` : '';
  const response = await fetch(runtimeUrl(`/artifacts/${artifactId}/url${query}`), {
    headers: await authHeaders(),
  });
  const { url } = await readJson<{ url: string }>(response);
  return url;
}

/** Deletes an artifact, with all its revisions, if the app's policies let the signed-in user. */
export async function deleteArtifact(artifactId: string): Promise<void> {
  const { error } = await client.from('bourne_artifacts').delete().eq('id', artifactId);
  if (error) throw new Error(error.message);
}
