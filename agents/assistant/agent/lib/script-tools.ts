import type {
  DynamicConnectionDefinition,
  DynamicConnectionResult,
  DynamicResolveContext,
  DynamicSentinel,
  McpClientConnectionDefinition,
} from "eve/connections";
import type { SandboxNetworkPolicy } from "eve/sandbox";
import type { VercelSandboxSession } from "eve/sandbox/vercel";
import type { ToolContext } from "eve/tools";

/** What one `agent/connections/<slug>.ts` module exports by default. */
export type ConnectionModule = DynamicConnectionDefinition | DynamicSentinel<DynamicConnectionResult>;

/** The environment variable `eve_tools` reads: a JSON object of connection name to MCP URL. */
export const SCRIPT_TOOLS_ENV = "EVE_TOOLS_SERVERS";

type DomainRules = Exclude<NonNullable<Extract<SandboxNetworkPolicy, object>["allow"]>, string[]>;

/** The events Eve resolves dynamic connections on, in order. */
const CONNECTION_EVENTS = ["session.started", "turn.started"] as const;

const isDynamic = (module: ConnectionModule): module is DynamicSentinel<DynamicConnectionResult> =>
  "kind" in module && module.kind === "eve:dynamic";

const isMcp = (definition: DynamicConnectionDefinition): definition is McpClientConnectionDefinition =>
  "url" in definition && !("spec" in definition);

const isDefinition = (result: NonNullable<DynamicConnectionResult>): result is DynamicConnectionDefinition =>
  "url" in result || "spec" in result;

/**
 * Resolves the agent's connections for this turn as Eve does at its session
 * and turn boundaries: a module either is a connection or resolves to one,
 * none or a set of them. Names are Eve's too (the module's slug, or the set's
 * keys), so a script calls a connection's tool as the model does:
 * `<connection>__<tool>`. Connection resolvers see the session, not messages.
 */
async function resolveConnections(
  modules: Readonly<Record<string, ConnectionModule>>,
  ctx: ToolContext,
): Promise<Record<string, McpClientConnectionDefinition>> {
  const connections: Record<string, McpClientConnectionDefinition> = {};
  const add = (name: string, definition: DynamicConnectionDefinition): void => {
    if (isMcp(definition)) connections[name] = definition;
  };
  const resolveContext: DynamicResolveContext = { session: ctx.session, channel: {}, messages: [], model: null };

  for (const [slug, module] of Object.entries(modules)) {
    if (!isDynamic(module)) {
      add(slug, module);
      continue;
    }
    for (const type of CONNECTION_EVENTS) {
      const result = await module.events[type]?.({ type }, resolveContext);
      if (!result) continue;
      if (isDefinition(result)) {
        add(slug, result);
        continue;
      }
      for (const [key, definition] of Object.entries(result)) add(key, definition);
    }
  }

  return connections;
}

/** The headers Eve sends the connection's server for this turn's caller. */
async function connectionHeaders(
  name: string,
  connection: McpClientConnectionDefinition,
  ctx: ToolContext,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const auth = typeof connection.auth === "function" ? await connection.auth(ctx) : connection.auth;
  if (auth) {
    const { token } = await ctx.getToken(auth, { connection: { url: connection.url }, authKey: name });
    headers.Authorization = `Bearer ${token}`;
  }
  if (typeof connection.headers === "function") {
    Object.assign(headers, await connection.headers(ctx));
  } else if (connection.headers) {
    for (const [key, value] of Object.entries(connection.headers)) {
      headers[key] = typeof value === "function" ? await value(ctx) : await value;
    }
  }
  return headers;
}

/**
 * Lets scripts the sandbox runs call the agent's MCP connections as this
 * turn's user, then returns the environment `eve_tools` needs to find them.
 * The connections' credentials never enter the sandbox: the firewall adds
 * them to every request bound for a connection's own URL, so a script holds
 * the URLs alone. Every other host stays reachable as before.
 */
export async function exposeScriptTools(
  sandbox: VercelSandboxSession,
  ctx: ToolContext,
  modules: Readonly<Record<string, ConnectionModule>>,
): Promise<Record<string, string>> {
  const connections = await resolveConnections(modules, ctx);
  const allow: DomainRules = { "*": [] };

  for (const [name, connection] of Object.entries(connections)) {
    const { hostname, pathname } = new URL(connection.url);
    const headers = await connectionHeaders(name, connection, ctx);

    allow[hostname] = [
      ...(allow[hostname] ?? []),
      { match: { path: { exact: pathname } }, transform: [{ headers }] },
    ];
  }

  await sandbox.setNetworkPolicy({ allow });

  return {
    [SCRIPT_TOOLS_ENV]: JSON.stringify(
      Object.fromEntries(Object.entries(connections).map(([name, { url }]) => [name, url])),
    ),
  };
}
