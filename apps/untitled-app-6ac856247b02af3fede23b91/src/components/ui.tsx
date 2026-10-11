import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { reportWriteError } from '../lib/data';
import { cn } from '../lib/utils';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; busy?: boolean };
export function Button({ variant = 'secondary', size = 'md', busy, className, children, disabled, onClick, ...rest }: BtnProps) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm',
        variant === 'primary' && 'bg-blue-700 text-white hover:bg-blue-800',
        variant === 'secondary' && 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100',
        variant === 'danger' && 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
        className,
      )}
      {...rest}
      onClick={event => {
        try {
          const result = onClick?.(event) as unknown;
          if (result && typeof (result as Promise<unknown>).catch === 'function') void (result as Promise<unknown>).catch(reportWriteError);
        } catch (error) { reportWriteError(error); }
      }}
    >
      {busy && <Loader2 className="size-3.5 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children, title, actions }: { className?: string; children: ReactNode; title?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={cn('min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

const badgeTones = {
  slate: 'bg-slate-100 text-slate-700', blue: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200', green: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200', red: 'bg-red-50 text-red-700 ring-1 ring-red-200', purple: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200',
};
export function Badge({ tone = 'slate', children, className, title }: { tone?: keyof typeof badgeTones; children: ReactNode; className?: string; title?: string }) {
  return <span title={title} className={cn('inline-flex items-center gap-1 max-w-full whitespace-normal break-words rounded px-1.5 py-0.5 text-xs font-medium', badgeTones[tone], className)}>{children}</span>;
}
export function SampleBadge() {
  return <Badge tone="purple" title="Demonstration data — not a real record">SAMPLE DATA</Badge>;
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1 text-sm', className)}>
      <span className="font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
const inputCls = 'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600';
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cn(inputCls, 'leading-relaxed', props.className)} />;
}
export function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: Record<string, string> | [string, string][] }) {
  const entries = Array.isArray(options) ? options : Object.entries(options);
  return (
    <select {...props} className={cn(inputCls, 'pr-8', props.className)}>
      {entries.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      if (e.key !== 'Tab') return;
      const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]') ?? []).filter(el => el.getClientRects().length);
      const first = items[0], last = items[items.length - 1];
      if (!first) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', h);
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-12" onMouseDown={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} aria-label={title} className={cn('w-full rounded-lg bg-white shadow-xl', wide ? 'max-w-4xl' : 'max-w-xl')} onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X className="size-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-6 py-10 text-center">
      <p className="font-medium text-slate-800">{title}</p>
      {children && <div className="max-w-lg text-sm text-slate-600">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
      {tabs.map(([k, label]) => (
        <button key={k} type="button" role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={cn('whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium', value === k ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600 hover:text-slate-900')}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function SourceLink({ url, label }: { url: string; label?: string }) {
  if (!url) return <span className="text-xs text-slate-400">no source</span>;
  let host = url;
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { /* keep raw */ }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline">
      {label ?? host}<ExternalLink className="size-3" />
    </a>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorNote({ error }: { error: string | null | undefined }) {
  if (!error) return null;
  return <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
}
export function Notice({ tone = 'amber', children }: { tone?: 'amber' | 'blue' | 'slate'; children: ReactNode }) {
  return (
    <div className={cn('rounded-md border px-3 py-2 text-sm',
      tone === 'amber' && 'border-amber-200 bg-amber-50 text-amber-900', tone === 'blue' && 'border-blue-200 bg-blue-50 text-blue-900', tone === 'slate' && 'border-slate-200 bg-slate-50 text-slate-700')}>
      {children}
    </div>
  );
}

/** Text field that saves on blur. */
export function InlineText({ value, onSave, multiline, placeholder, label, rows }: { value: string; onSave: (v: string) => Promise<void> | void; multiline?: boolean; placeholder?: string; label: string; rows?: number }) {
  const [v, setV] = useState(value);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setV(value), [value]);
  const commit = async () => {
    if (v === value) return;
    setError(null); setSaving(true);
    try { await onSave(v); setSaved(true); setTimeout(() => setSaved(false), 1500); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  };
  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex items-center justify-between"><span className="font-medium text-slate-700">{label}</span>{saving && <span role="status" className="text-xs text-slate-500">Saving…</span>}{saved && <span className="text-xs text-emerald-700">Saved</span>}</div>
      {multiline
        ? <Textarea aria-label={label} rows={rows ?? 3} value={v} placeholder={placeholder} onChange={e => setV(e.target.value)} onBlur={commit} />
        : <Input aria-label={label} value={v} placeholder={placeholder} onChange={e => setV(e.target.value)} onBlur={commit} />}
      {error && <div role="alert" className="text-xs text-red-700">Not saved: {error} <button type="button" className="underline" onClick={commit}>Retry save</button></div>}
    </div>
  );
}

export function useAsync() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true); setError(null);
    try { return await fn(); } catch (e) { reportWriteError(e); setError(e instanceof Error ? e.message : String(e)); return undefined; } finally { setBusy(false); }
  };
  return { busy, error, run, setError };
}
