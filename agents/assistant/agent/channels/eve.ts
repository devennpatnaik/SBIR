import { eveChannel } from "eve/channels/eve";
import {
  type AuthFn,
  extractBearerToken,
  verifyJwtEcdsa,
  withAuthChallenges,
} from "eve/channels/auth";

/**
 * Accepts the bearer Bourne signs for one project user. Bourne signs with a
 * private key it alone holds and addresses each token to one project; this
 * deployment verifies with the public key and accepts only tokens addressed
 * to its own project. Bourne already authenticated that user, so the caller
 * is a user principal: connection credentials are scoped to it and never
 * shared across sessions.
 */
function bourneProjectUser(): AuthFn<Request> {
  return withAuthChallenges(
    async (request) => {
      const publicKey = process.env.EVE_AGENT_AUTH_PUBLIC_KEY;
      const projectId = process.env.BOURNE_PROJECT_ID;
      if (!publicKey || !projectId) return null;
      const result = await verifyJwtEcdsa(extractBearerToken(request.headers.get("authorization")), {
        algorithm: "ES256",
        audiences: [`bourne-project-agent:${projectId}`],
        issuer: "bourne",
        publicKey,
      });
      return result.ok ? { ...result.sessionAuth, principalType: "user" } : null;
    },
    [{ scheme: "Bearer" }],
  );
}

export default eveChannel({ auth: bourneProjectUser() });
