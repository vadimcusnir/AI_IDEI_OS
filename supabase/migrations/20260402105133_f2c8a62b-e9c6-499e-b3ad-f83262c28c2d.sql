
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);

CREATE POLICY "Public can read blog images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

CREATE POLICY "Service role can manage blog images"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'blog-images')
  WITH CHECK (bucket_id = 'blog-images');
