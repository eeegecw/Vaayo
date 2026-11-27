import type { ReactNode } from "react";

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
};

export function LegalPageShell({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: LegalPageShellProps) {
  return (
    <div className="legal-shell">
      <header className="legal-topbar">
        <a href="/" className="legal-brand" aria-label="VAYO home">
          <span className="brand-mark">V</span>
          <span>VAYO</span>
        </a>
        <nav aria-label="Legal navigation">
          <a href="/">Home</a>
          <a href="/privacy" aria-current={title === "Privacy policy" ? "page" : undefined}>Privacy</a>
          <a href="/terms" aria-current={title === "Terms of service" ? "page" : undefined}>Terms</a>
        </nav>
      </header>

      <main className="legal-main">
        <div className="legal-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="legal-intro">{intro}</p>
          <p className="legal-updated">Last updated: {updated}</p>
        </div>

        <article className="legal-document">{children}</article>

        <aside className="legal-launch-note">
          <strong>Before public launch</strong>
          <p>
            VAYO still needs to publish its full legal operator name, principal business address,
            and a named grievance and privacy contact with a working email address and phone number.
            These details have not been supplied for the website and are not being guessed here.
          </p>
        </aside>
      </main>

      <footer className="legal-footer">
        <span>© {new Date().getFullYear()} VAYO · Mananthavady, Wayanad</span>
        <div><a href="/">Back to VAYO</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>
      </footer>
    </div>
  );
}
