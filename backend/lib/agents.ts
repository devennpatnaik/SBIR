/** Request options accepted by callAgent. */
export type AgentCallInit = {
  method?: string;
  headers?: HeadersInit;
  body?: string | ArrayBuffer | ReadableStream | null;
};

/** Named entrypoint exposed by the branch's apps-edge service binding. */
type AgentGateway = {
  call(
    agent: string,
    route: string,
    init?: { method?: string; headers?: [string, string][]; body?: string | ArrayBuffer | ReadableStream | null }
  ): Promise<Response>;
};

/**
 * Calls a route of one of this branch's agents through Bourne, e.g. callAgent(env, "assistant", "whatsapp", { method: "POST", body }).
 * @param env - The backend's env; Bourne sets BOURNE_AGENTS on every deployed backend.
 * @param agent - The agent's directory name under agents/.
 * @param route - The eve route after /eve/v1/.
 * @param init - Optional request method, headers, and body.
 * @returns The agent's response.
 */
export const callAgent = (env: object, agent: string, route: string, init: AgentCallInit = {}): Promise<Response> => {
  const { BOURNE_AGENTS } = env as { BOURNE_AGENTS: AgentGateway };

  return BOURNE_AGENTS.call(agent, route, {
    method: init.method,
    headers: [...new Headers(init.headers)],
    body: init.body ?? null,
  });
};

const postToRuntime = async (
  env: object,
  request: Request,
  path: string,
  body: object,
) => {
  const { BOURNE_RUNTIME_URL } = env as { BOURNE_RUNTIME_URL: string };
  const headers = {
    Authorization: request.headers.get('Authorization') ?? '',
    'Content-Type': 'application/json',
  };
  const response = await fetch(`${BOURNE_RUNTIME_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const responseBody = (await response.json().catch(() => null)) as {
    error?: string;
    code?: string;
    session?: { id: string };
    turn?: { turnId: string };
  } | null;

  return { response, body: responseBody };
};

const refusal = (response: Response, body: { error?: string } | null) =>
  new Error(body?.error ?? `Bourne answered ${response.status}`);

/**
 * Opens a session of one of this branch's agents for the signed-in user who sent `request`, so its turns run under that user's row level security.
 */
export const openAgentSession = async (env: object, request: Request, agent: string): Promise<string> => {
  const { response, body } = await postToRuntime(env, request, '/agent-sessions', { agentName: agent });

  if (!response.ok) throw refusal(response, body);

  return (body as { session: { id: string } }).session.id;
};

/**
 * Sends `message` in a session as the user who sent `request` and returns the new turn's id. The turn keeps running after this returns.
 * Returns null when the session already has a running turn, in which case the message was not sent. Throws when Bourne refuses;
 * when Bourne can't be reached the turn may still have started.
 */
export const sendAgentMessage = async (
  env: object,
  request: Request,
  sessionId: string,
  message: string,
): Promise<string | null> => {
  const { response, body } = await postToRuntime(
    env,
    request,
    `/agent-sessions/${encodeURIComponent(sessionId)}/submit`,
    { message },
  );

  if (response.status === 409 && body?.code === 'PROJECT_AGENT_TURN_RUNNING') return null;

  if (!response.ok) throw refusal(response, body);

  return (body as { turn: { turnId: string } }).turn.turnId;
};
