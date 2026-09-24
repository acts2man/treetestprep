import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { ArmatureChrome, ArmatureSlot } from "@/lib/armature-kit";

// The Course Overview page is fully builder-native: the two-column layout (course
// description with per-week details, and the info/pricing card) lives as builder
// elements in content/layouts/course-overview.json.

export default function CourseOverview() {
  return (
    <main>
      <ArmatureChrome part="header" fallback={<SiteHeader activePath="/events/location/" />} />
      <ArmatureSlot slug="course-overview" defaults={[]} />
      <ArmatureChrome part="footer" fallback={<SiteFooter />} />
    </main>
  );
}
