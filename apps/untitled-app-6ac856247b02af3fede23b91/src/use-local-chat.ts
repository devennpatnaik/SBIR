import { useCallback, useEffect, useRef, useState } from 'react';
import { authHeaders, dataUrl, readSseEvents } from './runtime';

export type LocalChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'streaming' | 'complete';
};

export type LocalChatStatus = 'idle' | 'loading' | 'running' | 'error';

export type AssistantStatus = {
  configured: boolean;
  provider: string | null;
  model: string;
  fallback: boolean;
  message: string;
};

export function useLocalChat(storageKey: string) {
  const [messages, setMessages] = useState<LocalChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as LocalChatMessage[]) : [];
    } catch {
      return [];
    }
  });
  const [status, setStatus] = useState<LocalChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [assistant, setAssistant] = useState<AssistantStatus | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
  }, [messages, storageKey]);

  useEffect(() => {
    let alive = true;
    void fetch(dataUrl('/assistant/status'))
      .then(r => r.json())
      .then((s: AssistantStatus) => {
        if (alive) setAssistant(s);
      })
      .catch(() => {
        if (alive) {
          setAssistant({
            configured: false,
            provider: null,
            model: '',
            fallback: false,
            message: 'Could not reach the assistant status endpoint.',
          });
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || status === 'running' || status === 'loading') return;
    setError(null);
    setStatus('running');
    const userMsg: LocalChatMessage = {
      id: `user:${crypto.randomUUID()}`,
      role: 'user',
      content: trimmed,
      status: 'complete',
    };
    const assistantId = `assistant:${crypto.randomUUID()}`;
    setMessages(prev => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '', status: 'streaming' },
    ]);

    const history = [...messages, userMsg]
      .filter(m => m.content)
      .map(m => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const headers = await authHeaders();
      const response = await fetch(dataUrl('/assistant/chat'), {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `Assistant failed (${response.status})`);
      }
      let full = '';
      for await (const event of readSseEvents(response.body)) {
        if (event.event === 'delta') {
          const data = JSON.parse(event.data) as { text?: string };
          full += data.text || '';
          setMessages(prev =>
            prev.map(m => (m.id === assistantId ? { ...m, content: full, status: 'streaming' } : m)),
          );
        } else if (event.event === 'done') {
          const data = JSON.parse(event.data) as { content?: string };
          full = data.content || full;
          setMessages(prev =>
            prev.map(m => (m.id === assistantId ? { ...m, content: full, status: 'complete' } : m)),
          );
        } else if (event.event === 'error') {
          const data = JSON.parse(event.data) as { error?: string };
          throw new Error(data.error || 'Assistant failed.');
        }
      }
      setStatus('idle');
    } catch (e) {
      if (controller.signal.aborted) {
        setStatus('idle');
        return;
      }
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus('error');
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: m.content || `Could not answer: ${msg}`, status: 'complete' }
            : m,
        ),
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [messages, status]);

  const cancel = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('idle');
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStatus('idle');
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { messages, status, error, assistant, send, cancel, newChat };
}
