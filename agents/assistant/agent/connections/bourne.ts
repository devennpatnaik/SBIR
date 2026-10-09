import { defineDynamic, defineMcpClientConnection } from "eve/connections";
import { bourneAgentUrl, readBourneTurn, signAgentToken, TOKEN_TTL_SECONDS } from "../lib/bourne";

/**
 * The Bourne tools of the app this agent belongs to. The connection is
 * resolved at each turn's start from the route token's claims — or, for a
 * turn the agent opened itself, from the ids it runs — and authenticates
 * with a token the deployment signs itself: it names the user and session
 * but no turn, lives one hour, so eve is told it expires at half that —
 * a token pinned for a sandbox command still outlives the sandbox's
 * thirty minutes; a re-resolution for the sandbox needs nothing
 * remembered.
 */
export default defineDynamic({
  events: {
    "turn.started": (_event, ctx) => {
      const turn = readBourneTurn(ctx.session.auth.current, ctx.session.id);
      return defineMcpClientConnection({
        url: bourneAgentUrl("mcp"),
        description:
          "The Bourne app this conversation belongs to: its database, its files, and its artifacts.",
        instanceKey: `${turn.projectId}:${turn.projectUserId}`,
        auth: {
          principalType: "user",
          getToken: async () => ({
            token: await signAgentToken(turn),
            expiresAt: Date.now() + (TOKEN_TTL_SECONDS / 2) * 1000,
          }),
        },
      });
    },
  },
});
