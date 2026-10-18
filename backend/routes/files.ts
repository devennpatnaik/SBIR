import { Hono } from 'hono';
import { appUser } from '../lib/auth';
import type { Env } from '../lib/env';
import {
  deleteUploadRow,
  listUploadsForUser,
  readFileArtifactBytes,
  readUploadBytes,
  saveDocumentArtifact,
  saveFileArtifact,
  saveUpload,
} from '../lib/storage';
import { rateLimit } from '../lib/security';

type Vars = { userId: string };
const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.use('*', async (c, next) => {
  const user = await appUser(c.env, c.req.raw);
  if (!user) return c.json({ error: 'Sign in required.' }, 401);
  c.set('userId', user.userId);
  await next();
});

app.use('/uploads', rateLimit(40, 60_000));

app.get('/uploads', async c => {
  try {
    const rows = await listUploadsForUser(c.env, c.get('userId'));
    return c.json({ uploads: rows });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Could not list uploads.' }, 500);
  }
});

app.post('/uploads', async c => {
  const userId = c.get('userId');
  const form = await c.req.parseBody();
  const file = form.file;
  if (!(file instanceof File)) return c.json({ error: 'Attach a file field named “file”.' }, 400);
  if (file.size > 25 * 1024 * 1024) return c.json({ error: 'Files must be 25 MB or smaller.' }, 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const row = await saveUpload(c.env, userId, {
      name: file.name || 'upload',
      type: file.type || 'application/octet-stream',
      size: file.size,
      bytes,
    });
    return c.json(row);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Could not store the file.' }, 500);
  }
});

app.get('/uploads/:id/url', async c => {
  const row = await readUploadBytes(c.env, c.req.param('id'), c.get('userId'));
  if (!row) return c.json({ error: 'Upload not found.' }, 404);
  return c.json({ url: `/files/uploads/${c.req.param('id')}/download`, name: row.name, mime_type: row.mime, size_bytes: row.bytes.byteLength });
});

app.get('/uploads/:id/download', async c => {
  const row = await readUploadBytes(c.env, c.req.param('id'), c.get('userId'));
  if (!row) return c.json({ error: 'Upload not found.' }, 404);
  const disposition = c.req.query('download') === '1' ? 'attachment' : 'inline';
  return new Response(row.bytes, {
    headers: {
      'Content-Type': row.mime,
      'Content-Disposition': `${disposition}; filename="${row.name.replace(/"/g, '')}"`,
      'Cache-Control': 'private, no-store',
    },
  });
});

app.delete('/uploads/:id', async c => {
  const ok = await deleteUploadRow(c.env, c.req.param('id'), c.get('userId'));
  if (!ok) return c.json({ error: 'Upload not found.' }, 404);
  return c.json({ ok: true });
});

app.post('/artifacts/document', async c => {
  const body = await c.req.json().catch(() => null) as {
    title?: string;
    description?: string;
    content?: string;
    runId?: string;
  } | null;
  const title = String(body?.title ?? '').trim();
  const content = String(body?.content ?? '');
  if (!title || !content) return c.json({ error: 'Title and content are required.' }, 400);
  try {
    const saved = await saveDocumentArtifact(c.env, c.get('userId'), {
      title: title.slice(0, 200),
      description: String(body?.description ?? '').slice(0, 500),
      content: content.slice(0, 200_000),
      runId: body?.runId,
    });
    return c.json(saved);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Could not save artifact.' }, 500);
  }
});

app.post('/artifacts/file', async c => {
  const form = await c.req.parseBody();
  const file = form.file;
  if (!(file instanceof File)) return c.json({ error: 'Attach a file field named “file”.' }, 400);
  if (file.size > 25 * 1024 * 1024) return c.json({ error: 'Files must be 25 MB or smaller.' }, 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const saved = await saveFileArtifact(c.env, c.get('userId'), {
      name: file.name || 'file',
      type: file.type || 'application/octet-stream',
      size: file.size,
      bytes,
      title: String(form.title || file.name || 'File'),
      description: String(form.description || ''),
    });
    return c.json(saved);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Could not store the artifact.' }, 500);
  }
});

app.get('/artifacts/:id/download', async c => {
  const row = await readFileArtifactBytes(c.env, c.req.param('id'), c.get('userId'), c.req.query('revision') || undefined);
  if (!row) return c.json({ error: 'Artifact not found.' }, 404);
  return new Response(row.bytes, {
    headers: {
      'Content-Type': row.mime,
      'Content-Disposition': `attachment; filename="${row.name.replace(/"/g, '')}"`,
      'Cache-Control': 'private, no-store',
    },
  });
});

export const fileRoutes = app;
