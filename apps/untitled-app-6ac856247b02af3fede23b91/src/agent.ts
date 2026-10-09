import { authHeaders, readJson, readSseEvents, runtimeUrl, sleep } from './runtime';

/** The agents this app ships, by the name of their directory under agents/. */
export const AGENT_NAMES = ['assistant'] as const;

export type AgentName = (typeof AGENT_NAMES)[number];

/**
 * One row of bourne_agent_sessions: a conversation with an agent. The app lists and deletes its
 * user's sessions with client.from('bourne_agent_sessions') like any other table; Bourne writes them.
 */
export type AgentSession = {
  id: string;
  buildId: string;
  agentName: AgentName;
  userId: string;
  organizationId: string | null;
  status: 'idle' | 'running';
  createdAt: string;
  updatedAt: string;
};

/** How a turn ended: stop when the agent finished or paused to ask the user, aborted when cancelled, error when it failed. */
export type AgentFinishReason = 'stop' | 'aborted' | 'error';

export type AgentTurnTerminal = { finishReason: AgentFinishReason; hasError: boolean; errorCode?: string; turnDurationMs: number };

/** A turn of the conversation: one user message or answer, and everything the agent did until it stopped. */
export type AgentTurn = {
  turnId: string;
  startedAt: string;
  /** How the turn ended, or null while the agent is still working. */
  terminal: AgentTurnTerminal | null;
};

/** One row of bourne_agent_messages, the conversation as Bourne stored it, in order. */
export type AgentMessage = {
  turnId: string;
  messageId: string;
  messageType:
    | 'user_message'
    | 'user_input_response'
    | 'assistant_message'
    | 'tool_execution_start'
    | 'tool_execution_end'
    | 'input_requested'
    | 'structured_result'
    | 'turn_terminal';
  /** The text, for user and assistant messages. */
  message: string;
  /** Structured detail: a user message's attachments, the tool name and call id, the requests, or the terminal status. */
  metadata: Record<string, unknown>;
  timestamp: string;
};

/**
 * An app file attached to a message: one of the user's uploads, or a revision of an artifact,
 * the latest when none is named. Send it with just the id; Bourne fills in the name, type and
 * size from the app's rows, as the user may see them, and the agent reads the file with its own
 * tools, as the user.
 */
export type AgentAttachment = (
  | { uploadId: string }
  | { artifactId: string; revisionId?: string; type?: 'document' | 'file' }
) & { name?: string; mimeType?: string; sizeBytes?: number };

export type AgentInputOption = { id: string; label: string; description?: string; style?: 'primary' | 'danger' | 'default' };

/** What the agent needs from the user before it goes on; the turn ends here and the answers open the next. */
export type AgentInputRequest = {
  requestId: string;
  kind: 'tool-approval' | 'question' | 'session-limit';
  prompt: string;
  toolCallId?: string;
  toolName?: string;
  args?: unknown;
  options?: AgentInputOption[];
  allowFreeform?: boolean;
};

/** An answer to one request: the option picked, or free text when the request allows it. */
export type AgentInputResponse = { requestId: string; optionId?: string } | { requestId: string; text: string };

export type AgentToolEvent = {
  type: 'tool_start' | 'tool_end';
  toolCallId: string;
  toolName: string;
  /** What the agent called the tool with, on tool_start. */
  args?: unknown;
  isError?: boolean;
};

export type AgentTurnResult = {
  turnId: string;
  finishReason: AgentFinishReason;
  /** Why the turn failed, when it did. */
  errorCode?: string;
  /** What the agent asked, when the turn stopped to wait for the user. */
  requests?: AgentInputRequest[];
};

export type FollowTurnOptions = {
  /** Receives the assistant's text as it streams in; the text is the whole message so far. */
  onDelta?: (text: string) => void;
  /** Receives each finished assistant message. */
  onMessage?: (text: string) => void;
  /** Receives each tool call as the agent starts and finishes it. */
  onToolEvent?: (event: AgentToolEvent) => void;
  /** Receives what the agent asks the user; answer with respondToAgent. */
  onInputRequested?: (requests: AgentInputRequest[]) => void;
  /** Stops following the turn in the browser. The turn itself keeps going on the server. */
  signal?: AbortSignal;
};

const STREAM_RETRY_DELAY_MS = 1000;
const STREAM_RETRY_MAX_DELAY_MS = 10000;

type AgentPaths = { session: string; stream: (turnId: string) => string };

const paths = (sessionId: string): AgentPaths => ({
  session: `/agent-sessions/${sessionId}`,
  stream: turnId => `/agent-sessions/${sessionId}/stream/${turnId}`,
});

/** Opens a conversation with one of the app's agents for the signed-in user. Keep the id to continue it later. */
export async function openAgentSession(agentName: AgentName = AGENT_NAMES[0], signal?: AbortSignal): Promise<AgentSession> {
  const response = await fetch(runtimeUrl('/agent-sessions'), {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentName }),
    signal,
  });
  const { session } = await readJson<{ session: AgentSession }>(response);
  return session;
}

/** Reads a conversation as Bourne stored it: the session and every message in order. */
export async function getAgentHistory(
  sessionId: string,
  signal?: AbortSignal,
): Promise<{ session: AgentSession; messages: AgentMessage[] }> {
  const response = await fetch(runtimeUrl(paths(sessionId).session), { headers: await authHeaders(), signal });
  return readJson<{ session: AgentSession; messages: AgentMessage[] }>(response);
}

/**
 * Sends the user's message, with the app files it attaches, and returns the turn it started.
 * Follow it with followAgentTurn. The message may be empty when it attaches something.
 */
export async function sendAgentMessage(
  sessionId: string,
  message: string,
  attachments: AgentAttachment[] = [],
  signal?: AbortSignal,
): Promise<AgentTurn> {
  const response = await fetch(runtimeUrl(`${paths(sessionId).session}/submit`), {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, attachments }),
    signal,
  });
  const { turn } = await readJson<{ turn: AgentTurn }>(response);
  return turn;
}

/** Answers what the agent asked and returns the turn the answers resumed. Follow it with followAgentTurn. */
export async function respondToAgent(
  sessionId: string,
  responses: AgentInputResponse[],
  signal?: AbortSignal,
): Promise<AgentTurn> {
  const response = await fetch(runtimeUrl(`${paths(sessionId).session}/input-responses`), {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ responses }),
    signal,
  });
  const { turn } = await readJson<{ turn: AgentTurn }>(response);
  return turn;
}

/** Stops the turn that is running on the server. An AbortSignal only stops following it. */
export async function cancelAgentTurn(sessionId: string, signal?: AbortSignal): Promise<AgentTurn> {
  const response = await fetch(runtimeUrl(`${paths(sessionId).session}/cancel`), {
    method: 'POST',
    headers: await authHeaders(),
    signal,
  });
  const { turn } = await readJson<{ turn: AgentTurn }>(response);
  return turn;
}

/**
 * What following a turn has seen so far, kept across the streams it takes to follow it: the text
 * of the message under way, which finished messages and requests arrived, and where in the turn
 * the last stream got to. A new stream picks up from lastEventId and adds to the text rather than
 * starting it over, so a reconnect mid-message shows the whole message, not its tail.
 */
type TurnFollowState = {
  lastEventId?: string;
  text: string;
  seenMessageIds: Set<string>;
  requests?: AgentInputRequest[];
  reconnected: boolean;
};

class AgentStreamRejected extends Error {
  constructor(readonly status: number) {
    super(`The agent stream answered HTTP ${status}`);
  }
}

/**
 * Reads one stream of the turn into the state. Resolves with the result it carried, or null when
 * the stream ended without one and another should be opened. Throws only for a caller's abort or
 * an answer that no retry would change.
 */
async function readTurnStream(
  sessionId: string,
  turnId: string,
  state: TurnFollowState,
  options: FollowTurnOptions,
): Promise<AgentTurnResult | null> {
  try {
    const response = await fetch(runtimeUrl(paths(sessionId).stream(turnId)), {
      headers: { ...(await authHeaders()), ...(state.lastEventId ? { 'Last-Event-ID': state.lastEventId } : {}) },
      signal: options.signal,
    });
    if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
      throw new AgentStreamRejected(response.status);
    }
    if (!response.ok || !response.body) return null;
    for await (const { event, data, id } of readSseEvents(response.body)) {
      if (id) state.lastEventId = id;
      if (event === 'delta') {
        state.text += (JSON.parse(data) as { text: string }).text;
        options.onDelta?.(state.text);
      } else if (event === 'message') {
        const { text, sourceId } = JSON.parse(data) as { text: string; sourceId: string };
        state.text = '';
        state.seenMessageIds.add(sourceId);
        options.onMessage?.(text);
      } else if (event === 'tool_start' || event === 'tool_end') {
        options.onToolEvent?.({ type: event, ...(JSON.parse(data) as Omit<AgentToolEvent, 'type'>) });
      } else if (event === 'input_requested') {
        state.requests = (JSON.parse(data) as { requests: AgentInputRequest[] }).requests;
        options.onInputRequested?.(state.requests);
      } else if (event === 'result') {
        const result = JSON.parse(data) as AgentTurnResult;
        return state.requests ? { ...result, requests: state.requests } : result;
      } else if (event === 'error') {
        return null;
      }
    }
    return null;
  } catch (error) {
    if (options.signal?.aborted || error instanceof AgentStreamRejected) throw error;
    return null;
  }
}

/**
 * Brings what the stream did not carry from the stored conversation: a turn that ended between
 * two streams is answered with its result alone, so any message or request it finished in
 * between is only in the history. Messages already seen are not repeated.
 */
async function reconcileTurn(
  sessionId: string,
  turnId: string,
  state: TurnFollowState,
  result: AgentTurnResult,
  options: FollowTurnOptions,
): Promise<AgentTurnResult> {
  const { messages } = await getAgentHistory(sessionId, options.signal);
  let requests = result.requests;
  for (const row of messages) {
    if (row.turnId !== turnId) continue;
    if (row.messageType === 'assistant_message' && !state.seenMessageIds.has(row.messageId)) {
      state.seenMessageIds.add(row.messageId);
      options.onMessage?.(row.message);
    } else if (row.messageType === 'input_requested' && !requests) {
      requests = (row.metadata as { requests: AgentInputRequest[] }).requests;
      options.onInputRequested?.(requests);
    }
  }
  return requests ? { ...result, requests } : result;
}

/**
 * Follows a turn until the agent stops: streams text, tool calls and requests to the callbacks
 * and resolves with how the turn ended. A dropped stream is reopened from its last event, with
 * growing pauses, for as long as the turn runs or until the signal aborts; the text keeps
 * building across streams. After a reconnect, whatever the streams missed is taken from the
 * stored conversation before the result is returned. A result with requests means the agent
 * stopped to ask something; answer with respondToAgent and follow the turn it returns.
 */
export async function followAgentTurn(
  sessionId: string,
  turnId: string,
  options: FollowTurnOptions = {},
): Promise<AgentTurnResult> {
  const state: TurnFollowState = { text: '', seenMessageIds: new Set(), reconnected: false };
  let delay = STREAM_RETRY_DELAY_MS;
  for (;;) {
    const result = await readTurnStream(sessionId, turnId, state, options);
    if (result) return state.reconnected ? reconcileTurn(sessionId, turnId, state, result, options) : result;
    state.reconnected = true;
    await sleep(delay, options.signal);
    delay = Math.min(delay * 2, STREAM_RETRY_MAX_DELAY_MS);
  }
}
