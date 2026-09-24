import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { ArmatureChrome, ArmatureSlot } from "@/lib/armature-kit";

// The Contact page is fully builder-native: its hero and email call-to-action live as
// builder elements in content/layouts/contact.json. No hand-coded site sections remain.

export default function Contact() {
  return (
    <main>
      <ArmatureChrome part="header" fallback={<SiteHeader activePath="/contact-us/" />} />
      <ArmatureSlot slug="contact" defaults={[]} />
      <ArmatureChrome part="footer" fallback={<SiteFooter />} />
    </main>
  );
}
