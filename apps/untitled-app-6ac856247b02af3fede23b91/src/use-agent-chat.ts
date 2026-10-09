import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AGENT_NAMES,
  cancelAgentTurn,
  followAgentTurn,
  getAgentHistory,
  openAgentSession,
  respondToAgent,
  sendAgentMessage,
} from './agent';
import type {
  AgentAttachment,
  AgentInputRequest,
  AgentInputResponse,
  AgentMessage,
  AgentName,
  AgentToolEvent,
  AgentTurn,
  AgentTurnResult,
} from './agent';

/** One bubble of the conversation. Ids are stable for the life of the chat, so use them as keys. */
export type ChatMessage = {
  id: string;
  turnId: string;
  role: 'user' | 'assistant';
  content: string;
  /** The app files a user message attached; named and sized once history is reloaded. */
  attachments?: AgentAttachment[];
  /** 'streaming' while the assistant is still writing this message. */
  status: 'streaming' | 'complete';
};

export type AgentChatStatus = 'idle' | 'loading' | 'running' | 'waiting-for-input' | 'error';

export type AgentToolCallStatus = 'running' | 'done' | 'failed';

/** One tool call the agent made: running until it ends, then done or failed. */
export type AgentToolCall = {
  toolCallId: string;
  toolName: string;
  /** What the agent called the tool with, as it arrived on tool_start. */
  args: unknown;
  status: AgentToolCallStatus;
  /** What to show for the call in its status: the agent's own words for it when it wrote them on the call, else the tool's name. */
  label: string;
};

export type UseAgentChatOptions = {
  agentName?: AgentName;
  /** A saved chat to reopen, e.g. from the URL or localStorage. */
  initialSessionId?: string | null;
  /** Called when the chat starts, is reopened or is reset, so the page can remember it. */
  onSessionIdChange?: (sessionId: string | null) => void;
};

export type AgentChat = {
  sessionId: string | null;
  messages: ChatMessage[];
  /** Every tool call the agent made, oldest first, one row per call that stays in place as it runs and ends. */
  toolCalls: AgentToolCall[];
  /** What the agent is waiting on the user for; answer with respond(). Empty otherwise. */
  inputRequests: AgentInputRequest[];
  status: AgentChatStatus;
  error: string | null;
  /**
   * Sends a message, with any app files it attaches (an upload's id from uploadFile, or an
   * artifact's); opens the session on the first one. Ignored while a turn is running.
   */
  send: (message: string, attachments?: AgentAttachment[]) => Promise<void>;
  /** Answers the pending input requests and resumes the turn. */
  respond: (responses: AgentInputResponse[]) => Promise<void>;
  /** Stops the running turn on the server. */
  cancel: () => Promise<void>;
  /** Forgets the current chat; the next send opens a new session. */
  newChat: () => void;
  /** Reopens a saved chat and picks up its running turn, if any. */
  loadSession: (sessionId: string) => Promise<void>;
};

/** A tool call as the state keeps it; its label is worded from these when read. */
type ToolCall = Omit<AgentToolCall, 'label'>;

type ChatState = {
  messages: ChatMessage[];
  /** By toolCallId, in the order the calls started. */
  toolCalls: Record<string, ToolCall>;
  inputRequests: AgentInputRequest[];
  /** The turn history says is still running, so it can be followed again. */
  openTurnId: string | null;
};

const EMPTY_STATE: ChatState = { messages: [], toolCalls: {}, inputRequests: [], openTurnId: null };

const assistantMessageId = (turnId: string, index: number) => `assistant:${turnId}:${index}`;

const stringOf = (value: unknown) => (typeof value === 'string' ? value : '');

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/**
 * The words for a call in its status. The agent writes them on the call as
 * `__bourne_label: { active, done }`; a call it did not label reads as its tool's name.
 */
const toolLabel = ({ toolName, args, status }: ToolCall): string => {
  const label = isRecord(args) && isRecord(args.__bourne_label) ? args.__bourne_label : {};
  const active = typeof label.active === 'string' ? label.active.trim() : '';
  const done = typeof label.done === 'string' ? label.done.trim() : '';
  if (!active || !done) return status === 'failed' ? `${toolName} failed` : toolName;
  if (status === 'running') return active;
  if (status === 'done') return done;
  return `Failed while ${active.charAt(0).toLowerCase()}${active.slice(1)}`;
};

/** The call as one tool event leaves it: started and running (a start replayed for a known call changes nothing), or ended as it was. */
const toolCallOf = (toolCalls: Record<string, ToolCall>, event: AgentToolEvent): ToolCall => {
  const { toolCallId, toolName } = event;
  if (event.type === 'tool_start') return toolCalls[toolCallId] ?? { toolCallId, toolName, args: event.args, status: 'running' };
  return { ...(toolCalls[toolCallId] ?? { toolCallId, toolName, args: undefined }), status: event.isError ? 'failed' : 'done' };
};

/** Rebuilds the chat state from the saved transcript. */
function stateFromHistory(rows: AgentMessage[]): ChatState {
  const state: ChatState = { messages: [], toolCalls: {}, inputRequests: [], openTurnId: null };
  const assistantCount = new Map<string, number>();
  for (const row of rows) {
    switch (row.messageType) {
      case 'user_message':
        state.messages.push({
          id: `user:${row.turnId}`,
          turnId: row.turnId,
          role: 'user',
          content: row.message,
          ...(Array.isArray(row.metadata.attachments) ? { attachments: row.metadata.attachments as AgentAttachment[] } : {}),
          status: 'complete',
        });
        state.inputRequests = [];
        state.openTurnId = row.turnId;
        break;
      case 'user_input_response':
        state.inputRequests = [];
        state.openTurnId = row.turnId;
        break;
      case 'assistant_message': {
        const index = assistantCount.get(row.turnId) ?? 0;
        assistantCount.set(row.turnId, index + 1);
        state.messages.push({
          id: assistantMessageId(row.turnId, index),
          turnId: row.turnId,
          role: 'assistant',
          content: row.message,
          status: 'complete',
        });
        break;
      }
      case 'tool_execution_start':
      case 'tool_execution_end': {
        const toolCallId = stringOf(row.metadata.toolCallId);
        state.toolCalls[toolCallId] = toolCallOf(state.toolCalls, {
          type: row.messageType === 'tool_execution_start' ? 'tool_start' : 'tool_end',
          toolCallId,
          toolName: stringOf(row.metadata.name),
          args: row.metadata.args,
          isError: Boolean(row.metadata.isError),
        });
        break;
      }
      case 'input_requested':
        state.inputRequests = Array.isArray(row.metadata.requests) ? (row.metadata.requests as AgentInputRequest[]) : [];
        break;
      case 'turn_terminal':
        state.openTurnId = null;
        break;
    }
  }
  return state;
}

const errorMessageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Headless state for one chat with a project agent: session, saved history,
 * streaming text, tool events, approvals, cancellation and errors. Render it
 * however the app needs; this hook owns the behaviour, not the look.
 */
export function useAgentChat(options: UseAgentChatOptions = {}): AgentChat {
  const { agentName = AGENT_NAMES[0], initialSessionId = null, onSessionIdChange } = options;
  const [sessionId, setSessionIdState] = useState<string | null>(initialSessionId);
  const [state, setState] = useState<ChatState>(EMPTY_STATE);
  const [status, setStatus] = useState<AgentChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const cancellingRef = useRef(false);
  const followRef = useRef<AbortController | null>(null);
  const onSessionIdChangeRef = useRef(onSessionIdChange);
  onSessionIdChangeRef.current = onSessionIdChange;

  const setSessionId = useCallback((id: string | null) => {
    setSessionIdState(id);
    onSessionIdChangeRef.current?.(id);
  }, []);

  const upsertMessage = useCallback((message: ChatMessage) => {
    setState(prev => {
      const index = prev.messages.findIndex(candidate => candidate.id === message.id);
      const messages =
        index === -1 ? [...prev.messages, message] : prev.messages.map((candidate, i) => (i === index ? message : candidate));
      return { ...prev, messages };
    });
  }, []);

  const fail = useCallback((cause: unknown) => {
    setError(errorMessageOf(cause));
    setStatus('error');
  }, []);

  /** Makes the saved transcript the state, and the session's status the status. */
  const reconcile = useCallback(async (id: string) => {
    const history = await getAgentHistory(id);
    const next = stateFromHistory(history.messages);
    setState(next);
    if (history.session.status === 'running') setStatus('running');
    else setStatus(next.inputRequests.length > 0 ? 'waiting-for-input' : 'idle');
    return next;
  }, []);

  /** A request that starts a turn can fail after the server started it: follow the turn history shows open, else rethrow. */
  const openTurnAfter = useCallback(
    async (id: string, cause: unknown) => {
      const next = await reconcile(id).catch(() => null);
      if (next?.openTurnId) return { sessionId: id, turnId: next.openTurnId };
      throw cause;
    },
    [reconcile],
  );

  const finish = useCallback(
    (result: AgentTurnResult) => {
      cancellingRef.current = false;
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(message => (message.status === 'streaming' ? { ...message, status: 'complete' } : message)),
        openTurnId: null,
      }));
      if (result.finishReason === 'error') fail(result.errorCode ?? 'The agent failed');
      else setStatus(result.requests && result.requests.length > 0 ? 'waiting-for-input' : 'idle');
    },
    [fail],
  );

  /** Streams one turn into the state, then settles the status from its outcome. */
  const follow = useCallback(
    async (id: string, turnId: string) => {
      followRef.current?.abort();
      let retries = 0;
      setStatus('running');
      setState(prev => ({ ...prev, inputRequests: [], openTurnId: turnId }));
      while (true) {
        const controller = new AbortController();
        followRef.current = controller;
        let messageIndex = 0;
        try {
          const result = await followAgentTurn(id, turnId, {
            signal: controller.signal,
            onDelta: text =>
              upsertMessage({ id: assistantMessageId(turnId, messageIndex), turnId, role: 'assistant', content: text, status: 'streaming' }),
            onMessage: text => {
              upsertMessage({ id: assistantMessageId(turnId, messageIndex), turnId, role: 'assistant', content: text, status: 'complete' });
              messageIndex += 1;
            },
            onToolEvent: event =>
              setState(prev => ({ ...prev, toolCalls: { ...prev.toolCalls, [event.toolCallId]: toolCallOf(prev.toolCalls, event) } })),
            onInputRequested: requests => setState(prev => ({ ...prev, inputRequests: requests })),
          });
          finish(result);
          return;
        } catch (cause) {
          if (controller.signal.aborted) return;
          cancellingRef.current = false;
          let next: ChatState;
          try {
            next = await reconcile(id);
          } catch (reconcileCause) {
            fail(reconcileCause);
            return;
          }
          if (controller.signal.aborted || !next.openTurnId) return;
          if (retries > 0) {
            fail(cause);
            return;
          }
          retries += 1;
          turnId = next.openTurnId;
        } finally {
          if (followRef.current === controller) followRef.current = null;
        }
      }
    },
    [fail, finish, reconcile, upsertMessage],
  );

  /** Runs one request that starts a turn, guarding against a second one at the same time. */
  const runTurn = useCallback(
    async (start: () => Promise<{ sessionId: string; turnId: string }>) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setError(null);
      try {
        const turn = await start();
        await follow(turn.sessionId, turn.turnId);
      } catch (cause) {
        fail(cause);
      } finally {
        busyRef.current = false;
      }
    },
    [fail, follow],
  );

  const send = useCallback(
    (message: string, attachments: AgentAttachment[] = []) =>
      runTurn(async () => {
        let id = sessionId;
        if (!id) {
          setStatus('loading');
          id = (await openAgentSession(agentName)).id;
          setSessionId(id);
        }
        const localId = `user:${crypto.randomUUID()}`;
        upsertMessage({
          id: localId,
          turnId: '',
          role: 'user',
          content: message,
          ...(attachments.length > 0 ? { attachments } : {}),
          status: 'complete',
        });
        let turn: AgentTurn;
        try {
          turn = await sendAgentMessage(id, message, attachments);
        } catch (cause) {
          setState(prev => ({ ...prev, messages: prev.messages.filter(candidate => candidate.id !== localId) }));
          return openTurnAfter(id, cause);
        }
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(candidate => (candidate.id === localId ? { ...candidate, turnId: turn.turnId } : candidate)),
        }));
        return { sessionId: id, turnId: turn.turnId };
      }),
    [agentName, openTurnAfter, runTurn, sessionId, setSessionId, upsertMessage],
  );

  const respond = useCallback(
    (responses: AgentInputResponse[]) =>
      runTurn(async () => {
        if (!sessionId) throw new Error('No chat to answer in');
        try {
          const turn = await respondToAgent(sessionId, responses);
          return { sessionId, turnId: turn.turnId };
        } catch (cause) {
          return openTurnAfter(sessionId, cause);
        }
      }),
    [openTurnAfter, runTurn, sessionId],
  );

  /**
   * Asks the server to stop the running turn. Cancelling is asynchronous: the
   * turn ends when eve reports it, which arrives on the stream being followed
   * and settles the state through finish, so the stream stays open.
   */
  const cancel = useCallback(async () => {
    if (!sessionId || cancellingRef.current) return;
    cancellingRef.current = true;
    setError(null);
    try {
      await cancelAgentTurn(sessionId);
    } catch (cause) {
      cancellingRef.current = false;
      fail(cause);
    }
  }, [fail, sessionId]);

  const newChat = useCallback(() => {
    followRef.current?.abort();
    followRef.current = null;
    busyRef.current = false;
    cancellingRef.current = false;
    setState(EMPTY_STATE);
    setError(null);
    setStatus('idle');
    setSessionId(null);
  }, [setSessionId]);

  const loadSession = useCallback(
    async (id: string) => {
      followRef.current?.abort();
      followRef.current = null;
      busyRef.current = false;
      cancellingRef.current = false;
      setError(null);
      setStatus('loading');
      setSessionId(id);
      try {
        const next = await reconcile(id);
        if (next.openTurnId) {
          busyRef.current = true;
          try {
            await follow(id, next.openTurnId);
          } finally {
            busyRef.current = false;
          }
        }
      } catch (cause) {
        fail(cause);
      }
    },
    [fail, follow, reconcile, setSessionId],
  );

  /** Reopens the first render's session only; later changes go through loadSession. */
  const loadSessionRef = useRef(loadSession);
  loadSessionRef.current = loadSession;
  useEffect(() => {
    if (initialSessionId) loadSessionRef.current(initialSessionId);
    return () => followRef.current?.abort();
  }, []);

  const toolCalls = useMemo(() => Object.values(state.toolCalls).map(call => ({ ...call, label: toolLabel(call) })), [state.toolCalls]);

  return {
    sessionId,
    messages: state.messages,
    toolCalls,
    inputRequests: state.inputRequests,
    status,
    error,
    send,
    respond,
    cancel,
    newChat,
    loadSession,
  };
}
