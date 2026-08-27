import { useQuery } from "@tanstack/react-query";
import { InnerHero, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { supabase } from "@/integrations/supabase/client";
import { usePageCopy } from "@/hooks/usePageContent";

type InstructorRow = {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  image_url: string | null;
};

export default function Instructors() {
  const copy = usePageCopy("instructors");
  const roleLabel = copy.text("intro", "role_label");

  const { data } = useQuery({
    queryKey: ["public-instructors"],
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, name, role, bio, image_url")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as InstructorRow[];
    },
  });

  const instructors = data ?? [];

  return (
    <main>
      <SiteHeader activePath="/meet-your-instructors/" />
      <InnerHero
        title={copy.text("hero", "title")}
        subtitle={copy.text("hero", "subtitle")}
        image={copy.text("hero", "image")}
        className="instructors-hero"
      />
      <section className="wrap instructors-section">
        <h1>{copy.text("intro", "heading")}</h1>
        <p>{copy.text("intro", "body")}</p>
        <div className="instructor-list">
          {instructors.map((instructor, index) => (
            <article
              className={`instructor-card ${index % 2 ? "reverse" : ""}`}
              key={instructor.id}
            >
              <img src={instructor.image_url ?? ""} alt={instructor.name} />
              <div>
                <h2>{instructor.name}</h2>
                <p className="instructor-role">{roleLabel}</p>
                {instructor.role && instructor.role !== roleLabel && (
                  <h3>{instructor.role}</h3>
                )}
                {(instructor.bio ?? "")
                  .split(/\n{2,}/)
                  .filter(Boolean)
                  .map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
