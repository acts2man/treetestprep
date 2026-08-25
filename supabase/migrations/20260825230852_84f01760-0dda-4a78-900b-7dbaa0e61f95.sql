CREATE POLICY "Public can view site media" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-media');
CREATE POLICY "Admins upload site media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-media' AND public.is_staff(auth.uid()));
CREATE POLICY "Admins update site media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'site-media' AND public.is_staff(auth.uid())) WITH CHECK (bucket_id = 'site-media' AND public.is_staff(auth.uid()));
CREATE POLICY "Admins delete site media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'site-media' AND public.is_staff(auth.uid()));