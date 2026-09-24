import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { ArmatureChrome, ArmatureSlot } from "@/lib/armature-kit";

// The home page is fully builder-native: the hero (credential, copy, Wistia video and
// register button), the course outline (heading, week list, exam note, button, photo) and
// the FAQ accordion all live as builder elements in content/layouts/home.json.

export default function Home() {
  return (
    <main id="top">
      <ArmatureChrome part="header" fallback={<SiteHeader activePath="/" />} />
      <ArmatureSlot slug="home" defaults={[]} />
      <ArmatureChrome part="footer" fallback={<SiteFooter />} />
    </main>
  );
}
