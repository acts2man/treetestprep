import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { ArmatureChrome, ArmatureSlot } from "@/lib/armature-kit";

// The Inspiration page is fully builder-native: its hero and the Ken Menzer story
// (two-column image + prose, with a mobile-only inline image) live as builder
// elements in content/layouts/inspiration.json.

export default function Inspiration() {
  return (
    <main>
      <ArmatureChrome part="header" fallback={<SiteHeader activePath="/about-us/" />} />
      <ArmatureSlot slug="inspiration" defaults={[]} />
      <ArmatureChrome part="footer" fallback={<SiteFooter />} />
    </main>
  );
}
