-- shared updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- roles
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','instructor','student');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','super_admin')
  )
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid())) WITH CHECK (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Admins delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- classes
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  format text NOT NULL DEFAULT 'in_person',
  start_date date,
  end_date date,
  schedule text,
  location text,
  price_cents integer NOT NULL DEFAULT 39500,
  capacity integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'published',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.classes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views published classes" ON public.classes
  FOR SELECT USING (status = 'published' OR public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'instructor'));
CREATE POLICY "Admins manage classes" ON public.classes
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER classes_updated BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- registrations
CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  amount_cents integer NOT NULL DEFAULT 39500,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'unpaid',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own registrations" ON public.registrations
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'instructor'));
CREATE POLICY "Users create own registrations" ON public.registrations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Admins manage registrations" ON public.registrations
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER registrations_updated BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- instructors
CREATE TABLE public.instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  bio text,
  image_url text,
  email text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.instructors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instructors TO authenticated;
GRANT ALL ON public.instructors TO service_role;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views visible instructors" ON public.instructors
  FOR SELECT USING (is_visible OR public.is_staff(auth.uid()));
CREATE POLICY "Admins manage instructors" ON public.instructors
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER instructors_updated BEFORE UPDATE ON public.instructors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- resources
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text,
  category text NOT NULL DEFAULT 'study_guide',
  visibility text NOT NULL DEFAULT 'students',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public resources are readable" ON public.resources
  FOR SELECT USING (visibility = 'public');
CREATE POLICY "Signed in users read student resources" ON public.resources
  FOR SELECT TO authenticated USING (visibility IN ('public','students') OR public.is_staff(auth.uid()));
CREATE POLICY "Admins manage resources" ON public.resources
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER resources_updated BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- inquiries
CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send an inquiry" ON public.inquiries
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own inquiries" ON public.inquiries
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Admins manage inquiries" ON public.inquiries
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER inquiries_updated BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- website content overrides
CREATE TABLE public.page_content_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL,
  section_key text NOT NULL,
  field_key text NOT NULL,
  value_text text,
  value_json jsonb,
  image_url text,
  video_url text,
  link_url text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_slug, section_key, field_key)
);
GRANT SELECT ON public.page_content_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_content_overrides TO authenticated;
GRANT ALL ON public.page_content_overrides TO service_role;
ALTER TABLE public.page_content_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read page content" ON public.page_content_overrides
  FOR SELECT USING (true);
CREATE POLICY "Admins manage page content" ON public.page_content_overrides
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER page_content_overrides_updated BEFORE UPDATE ON public.page_content_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- seed the live 2026 cohort and the current instructor roster
INSERT INTO public.classes (title, format, start_date, end_date, schedule, location, price_cents, capacity, status, description) VALUES
('ISA Certified Arborist Prep Course — Fall 2026', 'hybrid', '2026-09-15', '2026-11-03', 'Tuesdays, 6:00 – 8:30 PM', 'Sierra 2 Center Curtis Hall 2791 24th St Sacramento, CA 95818', 39500, 30, 'published', '8-week in-person and online course covering the Arborist Certification Study Guide, Fourth Edition.');

INSERT INTO public.instructors (name, role, bio, image_url, sort_order, is_visible) VALUES
('Jodi Carlson', 'Course Organizer', 'ISA Certified Arborist, Municipal Specialist, TRAQ, Prescription Pruning and Tree & Plant Appraisal qualified. Founded Tree Test Prep to honor her mentor Ken Menzer.', '/assets/instructor-jodi.webp', 1, true),
('Walt Warriner', 'Consulting Arborist & Urban Forester', 'Working in the green industry since 1975. Certified Urban & Community Forester, Certified Municipal Arborist, Licensed Pest Control Advisor, Qualified Tree Risk Assessor.', '/assets/instructor-walt.webp', 2, true),
('Erica Allen', 'ISA Certified Arborist', 'City Arborist for a major metropolitan city and ISA TRAQ Certified Arborist with a B.S. in Earth Sciences from UC Santa Cruz.', '/assets/instructor-erica.webp', 3, true),
('Tyler Lehman', 'ISA Certified Arborist', 'City Arborist for a major metropolitan city with a B.S. in Environmental and Ecological Sciences from Elon University.', '/assets/instructor-tyler.webp', 4, true);

INSERT INTO public.resources (title, description, file_url, category, visibility, sort_order) VALUES
('Arborist Certification Study Guide — Reading Plan', 'Week-by-week reading plan for the Fourth Edition study guide.', 'https://www.isa-arbor.com/store', 'study_guide', 'students', 1),
('ISA Exam Eligibility Checklist', 'What you need to document before applying to sit for the exam.', 'https://www.isa-arbor.com/Credentials/Apply-Now/Apply-for-Eligibility', 'exam_prep', 'public', 2);