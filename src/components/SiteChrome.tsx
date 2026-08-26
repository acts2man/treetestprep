import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { usePageCopy } from "@/hooks/usePageContent";
import { useAuth } from "@/hooks/use-auth";

export const navItems = [
  ["Home", "/"],
  ["Course Overview", "/events/location/"],
  ["Exam Information", "/exam-information/"],
  ["The Inspiration", "/about-us/"],
  ["Meet The Instructors", "/meet-your-instructors/"],
  ["Contact Us", "/contact-us/"],
  ["Register", "/class-registration-page/"],
] as const;

const normalize = (path: string) =>
  path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

function NavLinks({ activePath, onSelect }: { activePath: string; onSelect?: () => void }) {
  return (
    <>
      {navItems.map(([label, href]) => (
        <Link
          className={normalize(activePath) === normalize(href) ? "active" : ""}
          to={href}
          key={label}
          onClick={onSelect}
        >
          {label}
        </Link>
      ))}
    </>
  );
}

function AccountLink({ onSelect }: { onSelect?: () => void }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return (
      <Link to="/auth/" onClick={onSelect}>
        Sign In
      </Link>
    );
  }
  return (
    <Link to="/admin/" onClick={onSelect}>
      Admin Dashboard
    </Link>
  );
}

export function SiteHeader({ activePath }: { activePath: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const copy = usePageCopy("shared");
  const email = copy.text("header", "email");

  return (
    <header>
      <div className="brand-bar">
        <div className="brand-inner">
          <Link className="brand" to="/" aria-label="Tree Test Prep home">
            <img src={copy.text("header", "logo")} alt="Tree Test Prep" />
          </Link>
          <a className="email" href={`mailto:${email}`}>
            <span aria-hidden="true">✉</span> {email}
          </a>
        </div>
      </div>

      <div className="navigation">
        <div className="wrap nav-inner">
          <button
            className="menu-button"
            type="button"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
            <span className="sr-only-text">Open menu</span>
          </button>
          <nav className="nav-links" aria-label="Main navigation">
            <NavLinks activePath={activePath} />
          </nav>
        </div>
      </div>

      <div
        className={`mobile-overlay ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`mobile-panel ${menuOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        <div className="mobile-panel-head">
          <img src={copy.text("header", "logo")} alt="Tree Test Prep" />
          <button type="button" className="mobile-close" onClick={() => setMenuOpen(false)}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M18 6 6 18M6 6l12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="sr-only-text">Close menu</span>
          </button>
        </div>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <NavLinks activePath={activePath} onSelect={() => setMenuOpen(false)} />
        </nav>
        <div className="mobile-panel-foot">
          <Link
            className="button mobile-cta"
            to="/class-registration-page/"
            onClick={() => setMenuOpen(false)}
          >
            Register For The Course
          </Link>
          <div className="mobile-social">
            <a href={`mailto:${email}`} aria-label={`Email ${email}`}>
              <span aria-hidden="true">✉</span>
            </a>
            <a
              href="https://www.isa-arbor.com/"
              aria-label="International Society of Arboriculture"
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M12 3c3 2 5 4.6 5 7.5A5 5 0 0 1 12 15.5a5 5 0 0 1-5-5C7 7.6 9 5 12 3ZM12 15.5V21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const copy = usePageCopy("shared");
  const cta = copy.link("footer", "cta");

  return (
    <footer>
      <div className="footer-main">
        <div className="wrap footer-grid">
          <div className="footer-about">
            <img src={copy.text("footer", "logo")} alt="Tree Test Prep" />
            <p>{copy.text("footer", "blurb_one")}</p>
            <p>{copy.text("footer", "blurb_two")}</p>
            <a className="button footer-button" href={cta.href}>
              {cta.label}
            </a>
          </div>
          <div className="footer-links">
            <h2>{copy.text("footer", "links_heading")}</h2>
            <nav aria-label="Footer navigation">
              <NavLinks activePath="" />
              <AccountLink />
            </nav>
          </div>
          <img
            className="footer-image"
            src={copy.text("footer", "image")}
            alt="Flowering tree in bloom beside a marsh with hills behind it"
          />
        </div>
      </div>
      <div className="footer-bottom">
        <div className="wrap footer-bottom-grid">
          <p>{copy.text("footer", "copyright")}</p>
          <p>
            <a href="https://treetestprep.com/privacy-policy">Privacy Policy</a> |{" "}
            <a href="https://treetestprep.com/terms-of-service">Terms of Service</a>
          </p>
          <p>
            Site designed by{" "}
            <a href="https://reputationguardians.net/">
              <strong>Reputation Guardians</strong>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export function InnerHero({
  title,
  subtitle,
  image,
  className = "",
}: {
  title: string;
  subtitle?: string;
  image?: string;
  className?: string;
}) {
  const style = image ? { backgroundImage: `url(${image})` } : undefined;
  return (
    <section className={`inner-hero ${className}`} style={style}>
      <div className="inner-hero-shade" />
      <div className="wrap inner-hero-copy">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}
