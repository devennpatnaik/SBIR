import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import postgres from 'postgres';
import type { Env } from './env';

export function dataDir(env: Env): string {
  return env.DATA_DIR || '/data';
}

export async function ensureDirs(env: Env): Promise<void> {
  const root = dataDir(env);
  await mkdir(join(root, 'uploads'), { recursive: true });
  await mkdir(join(root, 'artifacts'), { recursive: true });
}

function db(env: Env) {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return postgres(env.DATABASE_URL, { max: 2, connect_timeout: 15 });
}

export type StoredUpload = {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export async function listUploadsForUser(env: Env, userId: string): Promise<StoredUpload[]> {
  const sql = db(env);
  try {
    return await sql<StoredUpload[]>`
      SELECT id::text, user_id, organization_id, name, mime_type, size_bytes, created_at::text
      FROM bourne_uploads
      WHERE user_id = ${userId} OR user_id IS NULL
      ORDER BY created_at DESC
      LIMIT 200`;
  } finally {
    await sql.end({ timeout: 2 });
  }
}

export async function saveUpload(
  env: Env,
  userId: string,
  file: { name: string; type: string; size: number; bytes: Uint8Array },
): Promise<StoredUpload> {
  await ensureDirs(env);
  const id = crypto.randomUUID();
  const path = join(dataDir(env), 'uploads', id);
  await writeFile(path, file.bytes);
  const sql = db(env);
  try {
    const rows = await sql<StoredUpload[]>`
      INSERT INTO bourne_uploads (id, user_id, organization_id, name, mime_type, size_bytes)
      VALUES (${id}::uuid, ${userId}, NULL, ${file.name}, ${file.type || 'application/octet-stream'}, ${file.size})
      RETURNING id::text, user_id, organization_id, name, mime_type, size_bytes, created_at::text`;
    return rows[0]!;
  } finally {
    await sql.end({ timeout: 2 });
  }
}

export async function readUploadBytes(env: Env, id: string, userId: string): Promise<{ bytes: Uint8Array; name: string; mime: string } | null> {
  const sql = db(env);
  try {
    const rows = await sql<{ name: string; mime_type: string; user_id: string | null }[]>`
      SELECT name, mime_type, user_id FROM bourne_uploads WHERE id = ${id}::uuid`;
    const row = rows[0];
    if (!row || (row.user_id && row.user_id !== userId)) return null;
    const bytes = await readFile(join(dataDir(env), 'uploads', id));
    return { bytes, name: row.name, mime: row.mime_type };
  } catch {
    return null;
  } finally {
    await sql.end({ timeout: 2 });
  }
}

export async function deleteUploadRow(env: Env, id: string, userId: string): Promise<boolean> {
  const sql = db(env);
  try {
    const rows = await sql`DELETE FROM bourne_uploads WHERE id = ${id}::uuid AND user_id = ${userId} RETURNING id`;
    if (!rows.length) return false;
    await unlink(join(dataDir(env), 'uploads', id)).catch(() => undefined);
    return true;
  } finally {
    await sql.end({ timeout: 2 });
  }
}

export type StoredArtifact = {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  type: 'document' | 'file';
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export async function saveDocumentArtifact(
  env: Env,
  userId: string,
  opts: { title: string; description?: string; content: string; runId?: string },
): Promise<{ artifact: StoredArtifact; revisionId: string }> {
  await ensureDirs(env);
  const artifactId = crypto.randomUUID();
  const revisionId = crypto.randomUUID();
  const runId = opts.runId || crypto.randomUUID();
  const sql = db(env);
  try {
    const arts = await sql<StoredArtifact[]>`
      INSERT INTO bourne_artifacts (id, user_id, organization_id, type, title, description)
      VALUES (${artifactId}::uuid, ${userId}, NULL, 'document', ${opts.title}, ${opts.description || ''})
      RETURNING id::text, user_id, organization_id, type, title, description, created_at::text, updated_at::text`;
    await sql`
      INSERT INTO bourne_artifact_revisions (id, artifact_id, run_id, function_name, content, name, mime_type, size_bytes)
      VALUES (
        ${revisionId}::uuid,
        ${artifactId}::uuid,
        ${runId},
        'local_assistant',
        ${opts.content},
        ${opts.title + '.md'},
        'text/markdown',
        ${opts.content.length}
      )`;
    return { artifact: arts[0]!, revisionId };
  } finally {
    await sql.end({ timeout: 2 });
  }
}

/** Store a binary file as a bourne artifact (bytes on disk; metadata in DB). */
export async function saveFileArtifact(
  env: Env,
  userId: string,
  file: { name: string; type: string; size: number; bytes: Uint8Array; title?: string; description?: string },
): Promise<{ artifact: StoredArtifact; revisionId: string }> {
  await ensureDirs(env);
  const artifactId = crypto.randomUUID();
  const revisionId = crypto.randomUUID();
  const runId = crypto.randomUUID();
  const diskPath = join(dataDir(env), 'artifacts', revisionId);
  await writeFile(diskPath, file.bytes);
  const sql = db(env);
  try {
    const arts = await sql<StoredArtifact[]>`
      INSERT INTO bourne_artifacts (id, user_id, organization_id, type, title, description)
      VALUES (
        ${artifactId}::uuid,
        ${userId},
        NULL,
        'file',
        ${file.title || file.name},
        ${file.description || ''}
      )
      RETURNING id::text, user_id, organization_id, type, title, description, created_at::text, updated_at::text`;
    await sql`
      INSERT INTO bourne_artifact_revisions (id, artifact_id, run_id, function_name, content, name, mime_type, size_bytes)
      VALUES (
        ${revisionId}::uuid,
        ${artifactId}::uuid,
        ${runId},
        'local_upload',
        NULL,
        ${file.name},
        ${file.type || 'application/octet-stream'},
        ${file.size}
      )`;
    return { artifact: arts[0]!, revisionId };
  } finally {
    await sql.end({ timeout: 2 });
  }
}

export async function readFileArtifactBytes(
  env: Env,
  artifactId: string,
  userId: string,
  revisionId?: string,
): Promise<{ bytes: Uint8Array; name: string; mime: string } | null> {
  const sql = db(env);
  try {
    const arts = await sql<{ user_id: string | null }[]>`
      SELECT user_id FROM bourne_artifacts WHERE id = ${artifactId}::uuid`;
    const art = arts[0];
    if (!art || (art.user_id && art.user_id !== userId)) return null;
    const revs = revisionId
      ? await sql<{ id: string; name: string; mime_type: string }[]>`
          SELECT id::text, name, mime_type FROM bourne_artifact_revisions
          WHERE id = ${revisionId}::uuid AND artifact_id = ${artifactId}::uuid`
      : await sql<{ id: string; name: string; mime_type: string }[]>`
          SELECT id::text, name, mime_type FROM bourne_artifact_revisions
          WHERE artifact_id = ${artifactId}::uuid
          ORDER BY created_at DESC LIMIT 1`;
    const rev = revs[0];
    if (!rev) return null;
    const bytes = await readFile(join(dataDir(env), 'artifacts', rev.id));
    return { bytes, name: rev.name, mime: rev.mime_type };
  } catch {
    return null;
  } finally {
    await sql.end({ timeout: 2 });
  }
}
