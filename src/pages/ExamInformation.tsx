import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { ArmatureChrome, ArmatureSlot } from "@/lib/armature-kit";

// The Exam Information page is fully builder-native: its hero and the exam-process
// prose (headings, paragraphs, lists and the register button) live as builder
// elements in content/layouts/exam-information.json.

export default function ExamInformation() {
  return (
    <main>
      <ArmatureChrome part="header" fallback={<SiteHeader activePath="/exam-information/" />} />
      <ArmatureSlot slug="exam-information" defaults={[]} />
      <ArmatureChrome part="footer" fallback={<SiteFooter />} />
    </main>
  );
}
