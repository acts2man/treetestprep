import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { usePageCopy } from "@/hooks/usePageContent";
import { useAuth } from "@/hooks/use-auth";

export type NavItem = { label: string; href: string };

const normalize = (path: string) =>
  path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

const isInternal = (href: string) => href.startsWith("/");

function NavLinks({
  items,
  activePath,
  onSelect,
}: {
  items: NavItem[];
  activePath: string;
  onSelect?: () => void;
}) {
  return (
    <>
      {items.map((item) =>
        isInternal(item.href) ? (
          <Link
            className={normalize(activePath) === normalize(item.href) ? "active" : ""}
            to={item.href}
            key={`${item.label}-${item.href}`}
            onClick={onSelect}
          >
            {item.label}
          </Link>
        ) : (
          <a href={item.href} key={`${item.label}-${item.href}`} onClick={onSelect}>
            {item.label}
          </a>
        ),
      )}
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
  const emailPlain = copy.plain("header", "email");
  const logo = copy.text("header", "logo");
  const logoAlt = copy.plain("header", "logo_alt");
  const navItems = copy.list<NavItem>("header", "nav");
  const mobileCta = copy.link("header", "mobile_cta");
  const isaUrl = copy.text("header", "isa_url");

  return (
    <header>
      <div className="brand-bar">
        <div className="brand-inner">
          <Link className="brand" to="/" aria-label={`${logoAlt} home`}>
            {/* The header and footer logos share one file, so the editor is told which field this is. */}
            <img src={logo} alt={logoAlt} data-armature-field="shared.header.logo" />
          </Link>
          <a className="email" href={`mailto:${emailPlain}`}>
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
            <NavLinks items={navItems} activePath={activePath} />
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
          <img src={logo} alt={logoAlt} data-armature-field="shared.header.logo" />
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
          <NavLinks
            items={navItems}
            activePath={activePath}
            onSelect={() => setMenuOpen(false)}
          />
        </nav>
        <div className="mobile-panel-foot">
          {isInternal(mobileCta.href) ? (
            <Link
              className="button mobile-cta"
              to={mobileCta.href}
              onClick={() => setMenuOpen(false)}
            >
              {mobileCta.label}
            </Link>
          ) : (
            <a
              className="button mobile-cta"
              href={mobileCta.href}
              onClick={() => setMenuOpen(false)}
            >
              {mobileCta.label}
            </a>
          )}
          <div className="mobile-social">
            <a href={`mailto:${emailPlain}`} aria-label={`Email ${emailPlain}`}>
              <span aria-hidden="true">✉</span>
            </a>
            <a
              href={isaUrl}
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
  const privacy = copy.link("footer", "privacy");
  const terms = copy.link("footer", "terms");
  const credit = copy.link("footer", "credit");
  const navItems = copy.list<NavItem>("header", "nav");

  return (
    <footer>
      <div className="footer-main">
        <div className="wrap footer-grid">
          <div className="footer-about">
            <img src={copy.text("footer", "logo")} alt={copy.plain("header", "logo_alt")} />
            <p>{copy.text("footer", "blurb_one")}</p>
            <p>{copy.text("footer", "blurb_two")}</p>
            <a className="button footer-button" href={cta.href}>
              {cta.label}
            </a>
          </div>
          <div className="footer-links">
            <h2>{copy.text("footer", "links_heading")}</h2>
            <nav aria-label="Footer navigation">
              <NavLinks items={navItems} activePath="" />
              <AccountLink />
            </nav>
          </div>
          <img
            className="footer-image"
            src={copy.text("footer", "image")}
            alt={copy.plain("footer", "image_alt")}
          />
        </div>
      </div>
      <div className="footer-bottom">
        <div className="wrap footer-bottom-grid">
          <p>{copy.text("footer", "copyright")}</p>
          <p>
            <a href={privacy.href}>{privacy.label}</a> | <a href={terms.href}>{terms.label}</a>
          </p>
          <p>
            {copy.text("footer", "credit_prefix")}{" "}
            <a href={credit.href}>
              <strong>{credit.label}</strong>
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
  imageField,
  className = "",
}: {
  title: string;
  subtitle?: string;
  image?: string;
  /**
   * Armature field path of `image` (e.g. "contact.hero.image"). The picture is a CSS
   * background, which the editor cannot match by value, so the section is mapped by hand.
   */
  imageField?: string;
  className?: string;
}) {
  const style = image ? { backgroundImage: `url(${image})` } : undefined;
  return (
    <section
      className={`inner-hero ${className}`}
      style={style}
      data-armature-field={image && imageField ? imageField : undefined}
    >
      <div className="inner-hero-shade" />
      <div className="wrap inner-hero-copy">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}
