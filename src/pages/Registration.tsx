import { CallToAction, SiteFooter, SiteHeader } from "../components/SiteChrome";

export default function Registration() {
  return (
    <main>
      <SiteHeader activePath="/class-registration-page/" />
      <h1 className="registration-title">Registration For In Person &amp; Online Classes</h1>
      <section className="wrap registration-grid">
        <article className="registration-option">
          <h2>In Person Registration</h2>
          <img src="/assets/registration-in-person.webp" alt="Students attending an in-person arborist course" />
          <a className="registration-link" href="https://buy.stripe.com/8wM8wMbsjfuL5YkfYY">In-Person Registration Link <span>➜</span></a>
          <p><strong>Class size is limited to 30 participants.</strong></p>
          <p>Once the 30 in-person spots are filled, registration for the in-person option will close. You will still be able to register for the online option.</p>
        </article>
        <article className="registration-option">
          <h2>Online Class Registration</h2>
          <img src="/assets/registration-online.webp" alt="Students participating in an online class" />
          <a className="registration-link" href="https://buy.stripe.com/cN2aEU53V6Yf2M85kl">Online Class Registration Link <span>➜</span></a>
          <p className="centered">Limited to 100 students</p>
        </article>
      </section>
      <section className="wrap book-note">
        <h2>This course uses the Arborist Certification Study Guide, Fourth Edition By Sharon J. Lilly, Corinne G. Bassett, James Komen, and Lindsey Purcell.</h2>
        <a className="button outline-button" href="https://wwv.isa-arbor.com/store/product/7/">Purchase Book Here</a>
      </section>
      <CallToAction />
      <SiteFooter />
    </main>
  );
}
