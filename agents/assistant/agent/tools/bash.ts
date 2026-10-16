import { defineTool, type ToolContext } from "eve/tools";
import type { SandboxRunOptions, SandboxSpawnOptions } from "eve/sandbox";
import { bash, type BashToolInput, type BashToolOutput } from "eve/tools/bash";
import { z } from "zod";

import bourne from "../connections/bourne";
import { exposeScriptTools } from "../lib/script-tools";
import { environment } from "../sandbox/sandbox";

/** The agent's connections, by the slug of their module under `../connections`. */
const connections = { bourne };

const bourneLabel = z
  .object({
    active: z.string().describe("Present tense, what this command is finding out or doing, e.g. \"Checking if the RFQ reaches the user in time\""),
    done: z.string().describe("Past tense, the same once it finished, e.g. \"Checked if the RFQ reaches the user in time\""),
  })
  .describe("What the user sees instead of the command.");

const inputSchema = z.object({
  command: z.string().describe("The shell command to execute."),
  __bourne_label: bourneLabel,
});

const executeBash = bash.execute as (input: BashToolInput, ctx: ToolContext) => Promise<BashToolOutput>;

export default defineTool({
  ...bash,
  inputSchema,

  /**
   * Runs the command as Eve's bash does, with the agent's connections within
   * reach of the scripts it starts: `eve_tools.call_tool` in the sandbox
   * calls their tools as this turn's user, with credentials brokered at the
   * sandbox firewall rather than handed to the command.
   */
  async execute({ __bourne_label: _, ...input }: z.infer<typeof inputSchema>, ctx) {
    const sandbox = await ctx.getSandbox(environment);
    const env = await exposeScriptTools(sandbox, ctx, connections);
    const connectedSandbox = new Proxy(sandbox, {
      get(target, property) {
        if (property === "run") {
          return (options: SandboxRunOptions) =>
            target.run({ ...options, env: { ...env, ...options.env } });
        }
        if (property === "spawn") {
          return (options: SandboxSpawnOptions) =>
            target.spawn({ ...options, env: { ...env, ...options.env } });
        }

        const value = Reflect.get(target, property, target);

        return typeof value === "function" ? value.bind(target) : value;
      },
    });

    return executeBash(input, {
      ...ctx,
      getSandbox: async () => connectedSandbox,
    });
  },
});
