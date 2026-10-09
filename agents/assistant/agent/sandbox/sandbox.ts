import { defaultBackend, defineSandbox } from "eve/sandbox";

const snapshotId = process.env.BOURNE_SANDBOX_SNAPSHOT_ID;

/**
 * Every session's sandbox starts from the Project's sandbox snapshot, which
 * Bourne builds and passes to each deployment: LibreOffice to convert Office
 * files to PDF, Poppler to read and render PDFs, the Python libraries that
 * write spreadsheets, decks and documents, and the `eve_tools` module a script
 * anywhere in the sandbox imports to call the agent's MCP tools. The empty
 * bootstrap makes eve key its template on the snapshot, so a new snapshot
 * rebuilds the template.
 */
export default defineSandbox({
  backend: defaultBackend({
    vercel: snapshotId ? { source: { type: "snapshot", snapshotId } } : {},
  }),
  revalidationKey: () => snapshotId ?? "",
  async bootstrap() {},
});
