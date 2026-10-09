import { defineHook, type HookEvent } from "eve/hooks";
import { bourneAgentUrl, readBourneTurn, signAgentToken, type BourneTurn } from "../lib/bourne";

type InputRequest = HookEvent<"input.requested">["data"]["requests"][number];

/**
 * A turn's events in Bourne's own terms: each completed message, each tool
 * call's start and end, each question put to the user, and how the
 * turn ended. Text deltas are not among them; the transcript keeps messages,
 * not keystrokes. This is Bourne's contract, not eve's: what eve calls an
 * event is translated here, on eve's side of the line, so Bourne reads the
 * same events whatever runtime reports them.
 */
type TranscriptEvent =
  | { type: "message_received"; text: string }
  | { type: "message_complete"; text: string }
  | { type: "tool_start"; toolCallId: string; toolName: string; args: unknown }
  | {
      type: "tool_complete";
      toolCallId: string;
      toolName: string;
      isError: boolean;
      errorMessage?: string;
      result: unknown;
    }
  | { type: "input_requested"; requests: BourneInputRequest[] }
  | { type: "structured_result"; data: unknown }
  | { type: "turn_complete" }
  | { type: "turn_cancelled" }
  | { type: "turn_failed"; code: string };

interface BourneInputRequest {
  requestId: string;
  kind: InputRequest["kind"];
  prompt: string;
  toolCallId: string;
  toolName: string;
  args: unknown;
  options?: InputRequest["options"];
  allowFreeform?: boolean;
}

/** One transcript event as reported: stable id, when eve recorded it, and the event. */
type ReportedEvent = TranscriptEvent & { id: string; emittedAt: string };

const bourneInputRequest = (request: InputRequest): BourneInputRequest => ({
  requestId: request.requestId,
  kind: request.kind,
  prompt: request.prompt,
  toolCallId: request.action.callId,
  toolName: request.action.toolName,
  args: request.action.input,
  ...(request.options ? { options: request.options } : {}),
  ...(typeof request.allowFreeform === "boolean" ? { allowFreeform: request.allowFreeform } : {}),
});

/**
 * What one eve event says to the transcript: nothing, one event, or one per
 * tool call when eve requests several at once. A tool event is keyed
 * on the event and the call, so each of several calls is its own report.
 */
function translate(event: HookEvent<"*">): ReportedEvent[] {
  const stamp = (id: string, transcriptEvent: TranscriptEvent): ReportedEvent => ({
    id,
    emittedAt: event.meta.at,
    ...transcriptEvent,
  });
  switch (event.type) {
    case "message.received":
      return event.data.message
        ? [stamp(event.meta.id, { type: "message_received", text: event.data.message })]
        : [];
    case "message.completed":
      return event.data.message
        ? [stamp(event.meta.id, { type: "message_complete", text: event.data.message })]
        : [];
    case "actions.requested":
      return event.data.actions.flatMap(action => {
        if (action.kind !== "tool-call") return [];
        return [
          stamp(`${event.meta.id}:${action.callId}`, {
            type: "tool_start",
            toolCallId: action.callId,
            toolName: action.toolName,
            args: action.input,
          }),
        ];
      });
    case "action.result": {
      const { result, status, error } = event.data;
      if (result.kind !== "tool-result") return [];
      const isError = status !== "completed";
      return [
        stamp(`${event.meta.id}:${result.callId}`, {
          type: "tool_complete",
          toolCallId: result.callId,
          toolName: result.toolName,
          isError,
          ...(isError && error ? { errorMessage: error.message } : {}),
          result: result.output,
        }),
      ];
    }
    case "input.requested":
      return [
        stamp(event.meta.id, {
          type: "input_requested",
          requests: event.data.requests.map(bourneInputRequest),
        }),
      ];
    case "result.completed":
      return [stamp(event.meta.id, { type: "structured_result", data: event.data.result })];
    case "turn.completed":
      return [stamp(event.meta.id, { type: "turn_complete" })];
    case "turn.cancelled":
      return [stamp(event.meta.id, { type: "turn_cancelled" })];
    case "turn.failed":
      return [stamp(event.meta.id, { type: "turn_failed", code: event.data.code })];
    default:
      return [];
  }
}

const TERMINAL_EVENTS = new Set(["turn.completed", "turn.failed", "turn.cancelled"]);

const REPORT_ATTEMPTS = 3;
const REPORT_RETRY_DELAY_MS = 500;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** Writes a signed agent call before the hook returns; the same call is safe to retry. */
async function reportToBourne(
  path: string,
  turn: BourneTurn,
  event: HookEvent<"*">,
  body?: string,
): Promise<void> {
  let failure: unknown;
  for (let attempt = 0; attempt < REPORT_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(REPORT_RETRY_DELAY_MS * attempt);
    try {
      const response = await fetch(bourneAgentUrl(path), {
        method: "POST",
        headers: {
          authorization: `Bearer ${await signAgentToken(turn)}`,
          ...(body ? { "content-type": "application/json" } : {}),
        },
        ...(body ? { body } : {}),
      });
      if (response.ok) return;
      failure = new Error(`Bourne did not take ${event.type} (${event.meta.id}): HTTP ${response.status}`);
      if (response.status >= 400 && response.status < 500 && response.status !== 429) break;
    } catch (error) {
      failure = error;
    }
  }
  throw failure;
}

/**
 * The Bourne turn each running eve turn belongs to, by eve's session and turn
 * id (turn ids restart per session). A turn's context is read from the caller
 * once, at its first event, because eve's caller snapshot is the last
 * committed turn's while a turn is being cancelled; the cancelled turn's own
 * events must still reach the turn they belong to.
 */
const turnsByEveTurnId = new Map<string, BourneTurn>();

const eveTurnIdOf = (event: HookEvent<"*">): string | undefined => {
  const data = "data" in event ? event.data : undefined;
  return typeof data === "object" && data !== null && "turnId" in data && typeof data.turnId === "string"
    ? data.turnId
    : undefined;
};

const bourneTurnOf = (
  event: HookEvent<"*">,
  eveTurnKey: string | undefined,
  caller: Parameters<typeof readBourneTurn>[0],
  ctxSessionId: string,
  eveTurnId: string | undefined,
): BourneTurn | undefined => {
  const known = eveTurnKey ? turnsByEveTurnId.get(eveTurnKey) : undefined;
  if (TERMINAL_EVENTS.has(event.type) && eveTurnKey) turnsByEveTurnId.delete(eveTurnKey);
  if (known) return known;
  const read = readBourneTurn(caller, ctxSessionId);
  const turnId = read.turnId ?? eveTurnId;
  if (!turnId) return undefined;
  const turn: BourneTurn = { ...read, turnId };
  if (eveTurnKey && !TERMINAL_EVENTS.has(event.type)) turnsByEveTurnId.set(eveTurnKey, turn);
  return turn;
};

/**
 * Reports each transcript event of a turn to Bourne as eve records it, with
 * a token the deployment signs for exactly that report: it lives a minute,
 * so no event waits on a credential Bourne issued in advance. Bourne owns
 * the transcript: it writes the events as its own rows and keeps them
 * whether or not anyone has the app open, and the report is what opens the
 * mirror turn for a turn the agent started itself. eve runs hooks after the
 * event is durable, so a report Bourne would not take, after a few tries,
 * fails the turn rather than leaving a gap in the transcript; the events'
 * stable ids let Bourne take the same report twice without writing it
 * twice. At session.started, the hook first asks Bourne to commit the
 * session row; later events naming no turn are skipped.
 */
export default defineHook({
  events: {
    async "*"(event, ctx) {
      if (event.type === "session.started") {
        const principal = ctx.session.auth.current;
        const projectUserId = principal?.attributes.projectUserId;
        if (typeof projectUserId !== "string" || !projectUserId) return;
        await reportToBourne("session", readBourneTurn(principal, ctx.session.id), event);
        return;
      }

      // input.resolved names the turn that asked, not the answering turn that follows it
      if (event.type === "input.resolved") return;
      const eveTurnId = eveTurnIdOf(event);
      const events = translate(event);
      if (!eveTurnId && events.length === 0) return;
      const turn = bourneTurnOf(
        event,
        eveTurnId && `${ctx.session.id}:${eveTurnId}`,
        ctx.session.auth.current,
        ctx.session.id,
        eveTurnId,
      );
      if (!turn) return;
      if (events.length === 0) return;
      await reportToBourne("transcript", turn, event, JSON.stringify({ events }));
    },
  },
});
