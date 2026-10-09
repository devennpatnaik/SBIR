import { defineAgent } from "eve";

export default defineAgent({
  model: "openai/gpt-5.6-sol",
  defaultTools: false,
  limits: {
    // A chat waits for the user as long as it takes: a question the agent asked
    // may be answered months later, in a new turn Bourne opens for it.
    sessionTimeoutMs: false,
  },
});
