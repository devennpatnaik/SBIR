import { useCallback, useEffect, useState } from 'react';
import { Download, Trash2, Upload as UploadIcon } from 'lucide-react';
import { deleteUpload, listUploads, uploadFile, uploadUrl, type Upload } from '../uploads';
import { Button, Notice } from './ui';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** List / upload / download binary files stored on the self-host API. */
export function UploadsPanel() {
  const [rows, setRows] = useState<Upload[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRows(await listUploads());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load uploads.');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onPick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const open = async (id: string) => {
    try {
      const url = await uploadUrl(id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open file.');
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await deleteUpload(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        PDFs, images, spreadsheets, and other binaries — up to 25 MB. Stored on this deployment’s disk volume, not Bourne.
      </p>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">
        <UploadIcon className="size-4" />
        {busy ? 'Working…' : 'Choose files'}
        <input
          type="file"
          className="sr-only"
          multiple
          disabled={busy}
          onChange={e => {
            void onPick(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
      {error && <Notice tone="amber">{error}</Notice>}
      {!rows.length ? (
        <p className="text-sm text-slate-500">No uploads yet.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
          {rows.map(u => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-900">{u.name}</div>
                <div className="text-xs text-slate-500">
                  {u.mime_type || 'file'} · {formatBytes(Number(u.size_bytes))}
                </div>
              </div>
              <Button size="sm" onClick={() => void open(u.id)}><Download className="size-3.5" />Open</Button>
              <Button size="sm" onClick={() => void remove(u.id)}><Trash2 className="size-3.5" />Delete</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
