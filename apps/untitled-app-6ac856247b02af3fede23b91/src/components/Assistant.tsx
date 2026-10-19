import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, Plus, Send, Square, X } from 'lucide-react';
import { useLocalChat } from '../use-local-chat';
import { getActiveProject } from '../lib/router';
import type { ProductTrack } from '../lib/track';
import { Button, Textarea } from './ui';

const CONTEXT_RE = /^\[App context:[^\]]*\]\s*/;

const PROMPTS_SBIR = [
  'What is the single most important next SBIR process step, and why?',
  'Summarize the technology in plain English.',
  'What should I verify before pursuing an SBIR topic?',
  'List the biggest risks and missing information.',
];

const PROMPTS_PATENTS = [
  'How should I refine my patent search query?',
  'What should I check on a patent record before shortlisting?',
  'How do I tell if a patent looks unused or not commercialized?',
  'What notes are worth saving on a patent lead?',
];

export function AssistantDrawer({ open, onClose, userId, track = 'sbir' }: { open: boolean; onClose: () => void; userId: string; track?: ProductTrack }) {
  const KEY = `ltm:${userId}:local-assistant`;
  const chat = useLocalChat(KEY);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const busy = chat.status === 'running' || chat.status === 'loading';
  const seedRef = useRef<string | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [chat.messages, open]);

  useEffect(() => {
    const onSeed = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string }>).detail;
      if (detail?.prompt) seedRef.current = detail.prompt;
    };
    window.addEventListener('ltm-workflow-chat', onSeed);
    return () => window.removeEventListener('ltm-workflow-chat', onSeed);
  }, []);

  useEffect(() => {
    if (open && seedRef.current && !busy) {
      const prompt = seedRef.current;
      seedRef.current = null;
      void send(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const prompts = track === 'patents' ? PROMPTS_PATENTS : PROMPTS_SBIR;

  const send = async (msg: string) => {
    if (!msg.trim() || busy) return;
    const ctx = `[App context: track=${track}; page=${window.location.hash || '#/'}; active_project_id=${getActiveProject() ?? 'none'}]`;
    setText('');
    await chat.send(`${ctx}\n${msg.trim()}`);
  };

  if (!open) return null;
  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl" aria-label="Research assistant">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Your guide</div>
          <div className="text-xs text-slate-500">
            {chat.assistant?.configured
              ? `Live model · ${chat.assistant.provider}${chat.assistant.model ? ` · ${chat.assistant.model}` : ''}`
              : 'Offline guide · works without an API key'}
          </div>
        </div>
        <div className="flex gap-1">
          <button type="button" aria-label="New chat" title="New chat" onClick={() => chat.newChat()} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><Plus className="size-4" /></button>
          <button type="button" aria-label="Close assistant" onClick={onClose} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><X className="size-4" /></button>
        </div>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {!chat.messages.length && (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              {track === 'patents'
                ? 'Ask about patent search, reading a record, or shortlisting. This track does not coach SBIR commercialization.'
                : 'Ask about government R&D, SBIR process steps, licensing follow-ups, or your next move.'}
              {' '}Answers should label facts as <b>verified</b>, <b>sourced</b>, <b>estimate</b>, or <b>hypothesis</b>.
            </p>
            {!chat.assistant?.configured && (
              <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700" role="status">
                Offline mode: structured checklists for your <b>{track === 'patents' ? 'patents' : 'SBIR'}</b> track.
                Add <code>OPENAI_API_KEY</code> or <code>ANTHROPIC_API_KEY</code> later for a live model.
              </p>
            )}
            {prompts.map(p => (
              <button key={p} type="button" onClick={() => void send(p)} className="block w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50">{p}</button>
            ))}
          </div>
        )}
        {chat.messages.map(m => (
          <div key={m.id} className={m.role === 'user' ? 'ml-8 rounded-lg bg-blue-50 px-3 py-2 text-sm' : 'text-sm'}>
            {m.role === 'user' ? (
              <p className="whitespace-pre-wrap">{m.content.replace(CONTEXT_RE, '')}</p>
            ) : (
              <div className="prose-sm max-w-none space-y-2 [&_a]:text-blue-700 [&_a]:underline [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc">
                <Markdown remarkPlugins={[remarkGfm]} components={{ a: props => <a {...props} target="_blank" rel="noreferrer" /> }}>{m.content || (m.status === 'streaming' ? '…' : '')}</Markdown>
              </div>
            )}
          </div>
        ))}
        {busy && <div className="flex items-center gap-1.5 text-xs text-slate-500"><Loader2 className="size-3 animate-spin" />Thinking…</div>}
        {chat.error && <p role="alert" className="rounded bg-red-50 p-2 text-xs text-red-700">{chat.error}</p>}
        <div ref={endRef} />
      </div>
      <form className="border-t border-slate-200 p-3" onSubmit={e => { e.preventDefault(); void send(text); }}>
        <Textarea aria-label="Message the assistant" rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="Ask about your project…" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(text); } }} />
        <div className="mt-2 flex justify-end gap-2">
          {busy && <Button size="sm" onClick={() => void chat.cancel()}><Square className="size-3" />Stop</Button>}
          <Button size="sm" type="submit" variant="primary" disabled={busy || !text.trim()}><Send className="size-3.5" />Send</Button>
        </div>
      </form>
    </aside>
  );
}
