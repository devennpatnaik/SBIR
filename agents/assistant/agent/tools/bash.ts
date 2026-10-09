import { defineTool } from "eve/tools";
import { BASH_INPUT_SCHEMA, bash } from "eve/tools/bash";
import { z } from "zod";

import bourne from "../connections/bourne";
import { exposeScriptTools } from "../lib/script-tools";

/** The agent's connections, by the slug of their module under `../connections`. */
const connections = { bourne };

const bourneLabel = z
  .object({
    active: z.string().describe("Present tense, what this command is finding out or doing, e.g. \"Checking if the RFQ reaches the user in time\""),
    done: z.string().describe("Past tense, the same once it finished, e.g. \"Checked if the RFQ reaches the user in time\""),
  })
  .describe("What the user sees instead of the command.");

const inputSchema = BASH_INPUT_SCHEMA.extend({
  __bourne_label: bourneLabel,
});

export default defineTool({
  ...bash,
  inputSchema,

  /**
   * Runs the command as Eve's bash does, with the agent's connections within
   * reach of the scripts it starts: `eve_tools.call_tool` in the sandbox
   * calls their tools as this turn's user, with credentials brokered at the
   * sandbox firewall rather than handed to the command.
   */
  execute({ __bourne_label: _, ...input }: z.infer<typeof inputSchema>, ctx) {
    return bash.execute(input, {
      ...ctx,
      getSandbox: async () => {
        const sandbox = await ctx.getSandbox();
        const env = await exposeScriptTools(sandbox, ctx, connections);

        return {
          ...sandbox,
          run: (options) => sandbox.run({ ...options, env: { ...env, ...options.env } }),
        };
      },
    });
  },
});
