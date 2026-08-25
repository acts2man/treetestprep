import { CallToAction, InnerHero, SiteFooter, SiteHeader } from "../components/SiteChrome";

export default function Inspiration() {
  return (
    <main>
      <SiteHeader activePath="/about-us/" />
      <InnerHero
        title="The Inspiration"
        subtitle="In honor of Ken Menzer, Tree Test Prep was created to help tree care professionals by providing ISA certification training that will help them reach the upper echelons of arboriculture."
        image="/assets/ken-menzer-hero.webp"
        className="inspiration-hero"
      />
      <section className="wrap story-grid">
        <img src="/assets/ken-menzer-fishing.webp" alt="Ken Menzer fishing on the ocean" />
        <article className="prose-page">
          <h1>Ken Menzer</h1>
          <h2>The Inspiration Behind Our Mission</h2>
          <p>Tree Test Prep was created in honor of Ken Menzer to help aspiring and seasoned tree care professionals become Certified Arborists.</p>
          <p>Ken was a Community Forester for the Sacramento Tree Foundation, where he grew shade trees for the Community Shade program. He also served the City of Folsom for 11 years as their City Arborist. In that role, he assisted residents with tree care, organized numerous volunteer plantings, and hosted the annual Arborists Breakfast, which brought professionals from across the metropolitan area together for a day of continuing education.</p>
          <p>As the City Arborist in Folsom, Ken continually encouraged tree care professionals to expand their skills and pursue certification. He was always willing to share his expertise, meeting with professionals to support their growth. His motto was simple: <strong>Educate and elevate.</strong></p>
          <p>For the last five years of his life, Ken bravely battled non-Hodgkin&apos;s lymphoma.</p>
        </article>
      </section>
      <CallToAction />
      <SiteFooter />
    </main>
  );
}
