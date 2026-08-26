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
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
          <nav className={`nav-links ${menuOpen ? "open" : ""}`} aria-label="Main navigation">
            <NavLinks activePath={activePath} onSelect={() => setMenuOpen(false)} />
            <AccountLink onSelect={() => setMenuOpen(false)} />
          </nav>
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
