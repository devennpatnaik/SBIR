import Link from "next/link";

export function Shell({
  children,
  viewerName,
}: {
  children: React.ReactNode;
  viewerName?: string;
}) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Wound Match home">
          <span className="brand-mark" aria-hidden="true">↗</span>
          <span className="brand-name">wound match.</span>
        </Link>
        {viewerName ? (
          <span className="viewer-chip">{viewerName}</span>
        ) : (
          <span className="viewer-chip">Private / team sign-in via Cursor</span>
        )}
      </header>
      {children}
    </div>
  );
}

export function LoopBanner({ active }: { active: "discover" | "rank" | "path" | "act" | "outcome" }) {
  const steps: Array<{ key: typeof active; label: string }> = [
    { key: "discover", label: "discover" },
    { key: "rank", label: "rank" },
    { key: "path", label: "path cards" },
    { key: "act", label: "act" },
    { key: "outcome", label: "log outcome" },
  ];
  return (
    <div className="loop-banner" role="status">
      <strong>DFU / chronic wounds</strong>
      <span aria-hidden="true">—</span>
      {steps.map((s, i) => (
        <span key={s.key}>
          {i > 0 ? <span aria-hidden="true"> → </span> : null}
          <span className={s.key === active ? "step-on" : undefined}>{s.label}</span>
        </span>
      ))}
    </div>
  );
}
