import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, Loader2, Plus, Send, Square, X, XCircle } from 'lucide-react';
import { useAgentChat } from '../use-agent-chat';
import { getActiveProject } from '../lib/router';
import { invalidate } from '../lib/data';
import { Button, Textarea } from './ui';


const CONTEXT_RE = /^\[App context:[^\]]*\]\s*/;

const PROMPTS = [
  'What is the single most important next action on my project, and why?',
  'Summarize the technology in plain English and explain any technical terms.',
  'Identify potential customer segments and competing products, with sources.',
  'Compare the licensing, collaboration, customer-discovery, funding and revenue pathways that could fit my project.',
  'List the biggest risks and the missing information I should collect.',
  'Improve my licensing outreach email draft.',
];

export function AssistantDrawer({ open, onClose, userId }: { open: boolean; onClose: () => void; userId: string }) {
  const KEY = `ltm:${userId}:assistant-session`;
  const chat = useAgentChat({ agentName: 'assistant', initialSessionId: localStorage.getItem(KEY), onSessionIdChange: id => (id ? localStorage.setItem(KEY, id) : localStorage.removeItem(KEY)) });
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const busy = chat.status === 'running' || chat.status === 'loading';

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [chat.messages, chat.toolCalls.length, open]);
  // When a turn finishes the assistant may have written records the user approved; refresh the screens.
  useEffect(() => { if (chat.status === 'idle') invalidate(); }, [chat.status]);

  const send = async (msg: string) => {
    if (!msg.trim() || busy || chat.status === 'waiting-for-input') return;
    const ctx = `[App context: page=${window.location.hash || '#/dashboard'}; active_project_id=${getActiveProject() ?? 'none'}]`;
    setText('');
    await chat.send(`${ctx}\n${msg.trim()}`);
  };

  useEffect(()=>{const load=(event:Event)=>{const id=(event as CustomEvent<{sessionId:string}>).detail?.sessionId;if(id)void chat.loadSession(id);};window.addEventListener('ltm-workflow-chat',load);return()=>window.removeEventListener('ltm-workflow-chat',load);},[chat.loadSession]);
  if (!open) return null;
  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl" aria-label="Research assistant">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Your guide</div>
          <div className="text-xs text-slate-500">Talk it through. Nothing is sent or signed for you.</div>
        </div>
        <div className="flex gap-1">
          <button type="button" aria-label="New chat" title="New chat" onClick={() => chat.newChat()} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><Plus className="size-4" /></button>
          <button type="button" aria-label="Close assistant" onClick={onClose} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><X className="size-4" /></button>
        </div>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {!chat.messages.length && (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Ask about the technology, licensing, funding or your next step. Answers label facts as <b>verified</b>, <b>sourced</b>, <b>estimate</b> or <b>hypothesis</b>, with links.</p>
            {PROMPTS.map(p => <button key={p} type="button" onClick={() => void send(p)} className="block w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50">{p}</button>)}
          </div>
        )}
        {chat.messages.map(m => (
          <div key={m.id} className={m.role === 'user' ? 'ml-8 rounded-lg bg-blue-50 px-3 py-2 text-sm' : 'text-sm'}>
            {m.role === 'user' ? <p className="whitespace-pre-wrap">{m.content.replace(CONTEXT_RE, '').replace(/^\[Authorized pathway action\][\s\S]*$/, 'Please prepare the requested plan using my saved starting point.')}</p> : (
              <div className="prose-sm max-w-none space-y-2 [&_a]:text-blue-700 [&_a]:underline [&_li]:ml-4 [&_ol]:list-decimal [&_table]:text-xs [&_td]:border [&_td]:px-1 [&_th]:border [&_th]:px-1 [&_ul]:list-disc">
                <Markdown remarkPlugins={[remarkGfm]} components={{ a: props => <a {...props} target="_blank" rel="noreferrer" /> }}>{m.content}</Markdown>
              </div>
            )}
          </div>
        ))}
        {chat.toolCalls.length > 0 && busy && (
          <ul className="space-y-1">{chat.toolCalls.slice(-4).map(t => (
            <li key={t.toolCallId} className="flex items-center gap-1.5 text-xs text-slate-500">
              {t.status === 'running' ? <Loader2 className="size-3 animate-spin" /> : t.status === 'done' ? <CheckCircle2 className="size-3 text-emerald-600" /> : <XCircle className="size-3 text-red-600" />}{t.label}
            </li>
          ))}</ul>
        )}
        {busy && !chat.toolCalls.some(t => t.status === 'running') && <div className="flex items-center gap-1.5 text-xs text-slate-500"><Loader2 className="size-3 animate-spin" />Thinking…</div>}
        {chat.status === 'waiting-for-input' && chat.inputRequests.map(r => <InputRequest key={r.requestId} r={r} onRespond={chat.respond} />)}
        {chat.error && <p role="alert" className="rounded bg-red-50 p-2 text-xs text-red-700">{chat.error}</p>}
        <div ref={endRef} />
      </div>
      <form className="border-t border-slate-200 p-3" onSubmit={e => { e.preventDefault(); void send(text); }}>
        <Textarea aria-label="Message the assistant" rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="Ask about your project…" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(text); } }} />
        <div className="mt-2 flex justify-end gap-2">
          {busy && <Button size="sm" onClick={() => chat.cancel()}><Square className="size-3" />Stop</Button>}
          <Button size="sm" type="submit" variant="primary" disabled={busy || !text.trim() || chat.status === 'waiting-for-input'}><Send className="size-3.5" />Send</Button>
        </div>
      </form>
    </aside>
  );
}

type Req = ReturnType<typeof useAgentChat>['inputRequests'][number];
function InputRequest({ r, onRespond }: { r: Req; onRespond: ReturnType<typeof useAgentChat>['respond'] }) {
  const [text, setText] = useState('');
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
      <div className="mb-1 text-xs font-semibold uppercase text-amber-800">{r.kind === 'tool-approval' ? 'Approval needed' : 'Question'}</div>
      <div className="whitespace-pre-wrap [&_li]:ml-4 [&_ul]:list-disc"><Markdown remarkPlugins={[remarkGfm]}>{r.prompt}</Markdown></div>
      <div className="mt-2 flex flex-wrap gap-2">
        {r.options?.map(o => <Button key={o.id} size="sm" variant={/approve|yes|go ahead|confirm/i.test(o.label) ? 'primary' : 'secondary'} onClick={() => void onRespond([{ requestId: r.requestId, optionId: o.id }])}>{o.label}</Button>)}
      </div>
      {r.allowFreeform && (
        <form className="mt-2 flex gap-2" onSubmit={e => { e.preventDefault(); if (text.trim()) void onRespond([{ requestId: r.requestId, text }]); }}>
          <input aria-label="Answer" className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm" value={text} onChange={e => setText(e.target.value)} placeholder="Or type an answer…" />
          <Button size="sm" type="submit">Reply</Button>
        </form>
      )}
    </div>
  );
}
