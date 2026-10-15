import { defineTool } from "eve/tools";
import { actions } from "@project/ontology";
import { z } from "zod";

import { readBourneTurn, signAgentToken } from "../lib/bourne";

const inputSchema = z.object({
  action: z.string().describe("Name of the action."),
  input: z.record(z.string(), z.unknown()).optional()
    .describe("The action's input, in the shape of its schema in actions.json."),
  inputFile: z.string().optional()
    .describe("Path of a JSON file in the sandbox holding the input, instead of input."),
});

const fixedDescription =
  "Runs one of the app's business actions as the signed-in user. To create or change business data, use the action for it instead of writing SQL with run_app_sql; use run_app_sql for reads and for data no action covers. Read the action's input schema in the ontology skill's actions.json first and pass `input` in that shape. When a script prepares large input, such as rows parsed from a file, it writes the input as JSON to a file in the sandbox and you pass that path as `inputFile` instead. A refused call says why and includes the schema.";

const firstSentence = (description: string) =>
  description.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] ?? description;

const actionDescription = actions.length
  ? `\n\nActions:\n${actions.map(action => `- ${action.name}: ${firstSentence(action.description)}`).join("\n")}`
  : "\n\nThis app has no actions yet.";

export default defineTool({
  description: fixedDescription + actionDescription,
  inputSchema,
  async execute({ action: actionName, input: providedInput, inputFile }, ctx) {
    if (providedInput !== undefined && inputFile !== undefined) {
      throw new Error("Pass input or inputFile, not both.");
    }

    let input = providedInput ?? {};

    if (inputFile !== undefined) {
      const sandbox = await ctx.getSandbox();
      let fileContent: string | null;

      try {
        fileContent = await sandbox.readTextFile({ path: inputFile });
      } catch (error) {
        throw new Error(
          `Could not read input file "${inputFile}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      if (fileContent === null) throw new Error(`Could not read input file "${inputFile}": file not found.`);

      try {
        input = JSON.parse(fileContent);
      } catch (error) {
        throw new Error(
          `Could not parse input file "${inputFile}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const turn = readBourneTurn(ctx.session.auth.current, ctx.session.id);
    const backendUrl = process.env.BOURNE_BACKEND_URL;

    if (!backendUrl) throw new Error("BOURNE_BACKEND_URL is not set on this deployment");

    const response = await fetch(`${backendUrl}/actions/${encodeURIComponent(actionName)}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${await signAgentToken(turn)}`,
      },
      body: JSON.stringify(input),
    });
    let body: { result?: unknown; error?: unknown; input?: unknown; code?: unknown } | null;

    try {
      body = await response.json() as { result?: unknown; error?: unknown; input?: unknown; code?: unknown };
    } catch {
      throw new Error(`Action request failed with HTTP ${response.status}.`);
    }

    if (!response.ok) {
      throw new Error(
        typeof body?.error === "string" && !body.input && !body.code
          ? body.error
          : JSON.stringify(body),
      );
    }

    return { result: body?.result };
  },
});
