/** A stamped case label ("CASE #042", "CONTRADICTION FOUND"). See .case-stamp in globals.css. */
export function CaseStamp({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "accent" }) {
  return (
    <span className={`case-stamp ${tone === "accent" ? "accent-text" : "text-[var(--muted)]"}`}>{children}</span>
  );
}
