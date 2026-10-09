import { createPrivateKey, sign } from "node:crypto";

/**
 * The Bourne calls this agent makes on its own behalf: for the tools of one
 * turn and for reporting the turn's events, the deployment signs a token of
 * its own — Bourne minted no grant for the turn, because the turn is the
 * agent's own to run. The private key lives only on this deployment's
 * environment; Bourne keeps the public half and accepts its tokens only for
 * this project, this build, and until the expiry the deployment signs.
 */

/** This agent's own directory name, so its calls reach its own agent endpoints. */
export const AGENT_NAME = "assistant";

/** How long a token this deployment signs lives: long enough to outlive any sandbox command. */
export const TOKEN_TTL_SECONDS = 60 * 60;

type Attributes = Readonly<Record<string, string | readonly string[]>>;

type Principal = { readonly attributes: Attributes } | null | undefined;

/**
 * What a turn needs to call Bourne as itself: the app context the route
 * token's claims carry, and the mirror session and turn the call belongs to.
 * Web-chat turns carry all of it as route-token claims; a turn the agent
 * opened itself, from a channel or a schedule, knows the session and turn
 * only from Eve's side and names them from the ids it ran.
 */
export interface BourneTurn {
  readonly projectId: string;
  readonly buildId: string;
  readonly projectUserId: string;
  readonly projectOrganizationId?: string;
  readonly sessionId: string;
  readonly turnId?: string;
  readonly eveSessionId: string;
}

const setting = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set on this deployment`);
  return value;
};

function text(attributes: Attributes, key: string): string | undefined {
  const value = attributes[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * The Bourne coordinates of the turn the principal is running: app context
 * from its route-token claims, with the deployment's own project and build ids
 * as the fallback when an agent-opened turn carries none — the deployment
 * answers for exactly one of each. `projectUserId` has no fallback: a turn with
 * no user behind it cannot call Bourne. `turnId`, when the claims carry
 * one, is the mirror turn Bourne opened for the turn the user started; the
 * transcript hook fills in Eve's own turn id when they carry none.
 */
export function readBourneTurn(
  principal: Principal,
  ctxSessionId: string,
): BourneTurn {
  if (!principal) {
    throw new Error("Bourne calls require an authenticated caller");
  }
  const { attributes } = principal;
  const projectUserId = text(attributes, "projectUserId");
  if (!projectUserId) {
    throw new Error("Bourne turns require a project user");
  }
  const projectOrganizationId = text(attributes, "projectOrganizationId");
  return {
    projectId: text(attributes, "projectId") ?? setting("BOURNE_PROJECT_ID"),
    buildId: text(attributes, "buildId") ?? setting("BOURNE_BUILD_ID"),
    projectUserId,
    ...(projectOrganizationId ? { projectOrganizationId } : {}),
    sessionId: text(attributes, "sessionId") ?? ctxSessionId,
    turnId: text(attributes, "turnId"),
    eveSessionId: ctxSessionId,
  };
}

const base64url = (input: Buffer | string): string => Buffer.from(input).toString("base64url");

/**
 * An ES256 JWT for one Bourne call of this turn, signed with this
 * deployment's key. It names the user the turn serves (`sub`), the mirror
 * session it belongs to (`sid`), the turn (`tid`) when the call belongs to
 * one, and the Eve session it runs (`esid`), so Bourne can write the call
 * into the same transcript the app reads. A token lives one hour; the
 * agent signs a fresh one per call.
 */
export async function signAgentToken(turn: BourneTurn): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "ES256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      aud: `bourne-project-runtime:${turn.projectId}`,
      sub: turn.projectUserId,
      ...(turn.projectOrganizationId ? { o: { id: turn.projectOrganizationId } } : {}),
      sid: turn.sessionId,
      ...(turn.turnId ? { tid: turn.turnId } : {}),
      esid: turn.eveSessionId,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    }),
  );
  const signature = sign("sha256", Buffer.from(`${header}.${payload}`), {
    key: createPrivateKey(setting("BOURNE_AGENT_SIGNING_KEY")),
    dsaEncoding: "ieee-p1363",
  });
  return `${header}.${payload}.${base64url(signature)}`;
}

/**
 * Where this agent calls Bourne: the build's project-runtime URL, under its own
 * agent name, so the route knows whose deployment is calling.
 */
export function bourneAgentUrl(path: string): string {
  return `${setting("BOURNE_RUNTIME_URL")}/agents/${AGENT_NAME}/${path}`;
}
