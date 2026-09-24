import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { ArmatureChrome, ArmatureSlot } from "@/lib/armature-kit";

// The Registration page is fully builder-native: the title bar, the in-person/online
// options grid and the course-book note live as builder elements in
// content/layouts/registration.json.

export default function Registration() {
  return (
    <main>
      <ArmatureChrome part="header" fallback={<SiteHeader activePath="/class-registration-page/" />} />
      <ArmatureSlot slug="registration" defaults={[]} />
      <ArmatureChrome part="footer" fallback={<SiteFooter />} />
    </main>
  );
}
