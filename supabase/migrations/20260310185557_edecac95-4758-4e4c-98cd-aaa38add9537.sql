
-- Create storage bucket for episode files (audio, video, documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'episode-files',
  'episode-files',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/webm', 'audio/flac',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'text/plain', 'text/srt', 'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
);

-- RLS: Users can upload their own files
CREATE POLICY "Users can upload episode files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'episode-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can read their own files
CREATE POLICY "Users can read own episode files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'episode-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can delete their own files
CREATE POLICY "Users can delete own episode files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'episode-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Service role can read all files (for edge functions)
CREATE POLICY "Service role can read all episode files"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'episode-files');

-- Add file_path column to episodes if not exists (already exists per schema)
-- Add file_size column for tracking
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS file_size bigint;
