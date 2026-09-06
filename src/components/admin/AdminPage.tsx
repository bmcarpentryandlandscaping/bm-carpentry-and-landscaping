import Link from "next/link";

type Props = {
  title: string;
  /** One plain sentence saying what this screen changes. */
  lede?: string;
  /** Where this screen's changes show up, for a "see it live" link. */
  viewHref?: string;
  viewLabel?: string;
  children: React.ReactNode;
};

/**
 * Every admin screen's header, in one place.
 *
 * The four screens each hand-rolled the same flex row, and they had drifted —
 * two had a lede, two didn't, and the heading size differed between them. The
 * arrow on the view link is kept: it means "opens in a new tab", which is
 * information the client acts on, not decoration.
 */
export function AdminPage({ title, lede, viewHref, viewLabel, children }: Props) {
  return (
    <div>
      <header className="mb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h1 className="admin-title">{title}</h1>
          {viewHref && (
            <Link
              href={viewHref}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {viewLabel ?? "See it on the site"} ↗
            </Link>
          )}
        </div>
        {lede && <p className="admin-lede mt-3">{lede}</p>}
        <div className="admin-rule mt-6" />
      </header>
      {children}
    </div>
  );
}
