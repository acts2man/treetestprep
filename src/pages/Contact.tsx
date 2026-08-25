import { InnerHero, SiteFooter, SiteHeader } from "../components/SiteChrome";

export default function Contact() {
  return (
    <main>
      <SiteHeader activePath="/contact-us/" />
      <InnerHero
        title="Get in Touch"
        subtitle="Treetestprep@gmail.com"
        image="/assets/contact-tree.webp"
        className="contact-hero"
      />
      <section className="wrap contact-message">
        <h1>Have A Question? We&apos;re Here To Help. Send Us An Email And A Member Of Our Team Will Get Back To You Within One Business Day.</h1>
        <a className="button hero-button" href="mailto:Treetestprep@gmail.com">Email Tree Test Prep</a>
      </section>
      <SiteFooter />
    </main>
  );
}
