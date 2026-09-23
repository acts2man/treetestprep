import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { ArmatureSlot } from "@/lib/armature-kit";

// The Contact page is fully builder-native: its hero and email call-to-action live as
// builder elements in content/layouts/contact.json. No hand-coded site sections remain.

export default function Contact() {
  return (
    <main>
      <SiteHeader activePath="/contact-us/" />
      <ArmatureSlot slug="contact" defaults={[]} />
      <SiteFooter />
    </main>
  );
}
