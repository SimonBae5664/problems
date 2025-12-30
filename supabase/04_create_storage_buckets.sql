-- Create Storage Buckets
-- Note: This needs to be run in Supabase Dashboard > Storage
-- Or use Supabase CLI/Migration

-- Bucket: uploads (private)
-- Purpose: Store original uploaded files (PDF, DOCX, HWP, etc.)
-- Settings:
--   - Public: false (private)
--   - File size limit: 50MB (adjust as needed)
--   - Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, etc.

-- Bucket: derivatives (private)
-- Purpose: Store processed outputs (extracted text, OCR results, thumbnails, classification JSON)
-- Settings:
--   - Public: false (private)
--   - File size limit: 10MB (adjust as needed)
--   - Allowed MIME types: text/plain, application/json, image/png, image/jpeg

-- Storage Policies (RLS for Storage)

-- uploads bucket: Users can upload/read their own files
-- Note: These policies are set in Supabase Dashboard > Storage > Policies

-- Policy: Users can upload to their own folder
-- INSERT policy: bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text

-- Policy: Users can read their own files
-- SELECT policy: bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text

-- Policy: Users can delete their own files
-- DELETE policy: bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text

-- derivatives bucket: Users can read outputs of their own jobs
-- SELECT policy: bucket_id = 'derivatives' AND 
--   EXISTS (SELECT 1 FROM "JobOutput" WHERE "JobOutput"."storagePath" = name 
--     AND EXISTS (SELECT 1 FROM "ProcessingJob" WHERE "ProcessingJob".id = "JobOutput"."jobId" 
--       AND "ProcessingJob"."ownerId" = auth.uid()::text))

-- Note: Storage policies are managed in Supabase Dashboard
-- Go to Storage > Policies to create these policies

