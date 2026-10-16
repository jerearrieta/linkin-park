import Link from "next/link";

type Target = { href: string; label: string } | null | undefined;

/** Previous/next links at the bottom of a page. */
export function Pager({ prev, next }: { prev?: Target; next?: Target }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", marginTop: 28 }}>
      {prev ? (
        <Link className="btn ghost" href={prev.href}>
          ← {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="btn ghost" href={next.href}>
          {next.label} →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
