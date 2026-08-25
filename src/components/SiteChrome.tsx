import { useState } from "react";
import { Link } from "@tanstack/react-router";

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

export function SiteHeader({ activePath }: { activePath: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header>
      <div className="brand-bar">
        <div className="wrap brand-inner">
          <Link className="brand" to="/" aria-label="Tree Test Prep home">
            <img src="/assets/tree-test-prep-logo.webp" alt="Tree Test Prep" />
          </Link>
          <a className="email" href="mailto:Treetestprep@gmail.com">
            <span aria-hidden="true">✉</span> Treetestprep@gmail.com
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
          </nav>
        </div>
      </div>
    </header>
  );
}

export function CallToAction() {
  return (
    <section className="cta">
      <div className="wrap cta-grid">
        <div>
          <h2>Take Your Tree Care Career To The Next Level</h2>
          <p>Build the knowledge and confidence you need to become an ISA Certified Arborist.</p>
        </div>
        <Link className="button cta-button" to="/class-registration-page/">Register For The Course</Link>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="footer-main">
        <div className="wrap footer-grid">
          <div className="footer-about">
            <img src="/assets/tree-test-prep-logo.webp" alt="Tree Test Prep" />
            <p>Take your tree care career to the next level by becoming an ISA Certified Arborist.</p>
            <p>Let your customers know that you possess the high degree of knowledge that it takes to become certified by the International Society of Arboriculture.</p>
            <Link className="button footer-button" to="/class-registration-page/">Register For The Course</Link>
          </div>
          <div className="footer-links">
            <h2>Navigation Links</h2>
            <nav aria-label="Footer navigation"><NavLinks activePath="" /></nav>
          </div>
          <img
            className="footer-image"
            src="/assets/flowering-tree-in-bloom-beside-a-marsh-with-hills-behind-it.webp"
            alt="Flowering tree in bloom beside a marsh with hills behind it"
          />
        </div>
      </div>
      <div className="footer-bottom">
        <div className="wrap footer-bottom-grid">
          <p>© 2026 Tree Test Prep. All Rights Reserved.</p>
          <p>
            <a href="https://treetestprep.com/privacy-policy">Privacy Policy</a> |{" "}
            <a href="https://treetestprep.com/terms-of-service">Terms of Service</a>
          </p>
          <p>Site designed by <a href="https://reputationguardians.net/"><strong>Reputation Guardians</strong></a></p>
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
