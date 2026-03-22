
-- Create storage bucket for notebook file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notebook-files',
  'notebook-files',
  false,
  20971520,
  ARRAY['application/pdf', 'text/plain', 'text/markdown', 'text/csv', 'application/json']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload
CREATE POLICY "Users can upload notebook files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notebook-files');

-- RLS: authenticated users can read their own files
CREATE POLICY "Users can read notebook files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'notebook-files');

-- RLS: authenticated users can delete their files
CREATE POLICY "Users can delete notebook files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'notebook-files');
