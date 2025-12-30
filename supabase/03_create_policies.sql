-- RLS Policies for File Management

-- Files: Users can read/write their own files
CREATE POLICY "Users can view their own files"
  ON "File" FOR SELECT
  USING (auth.uid()::text = "ownerId");

CREATE POLICY "Users can create their own files"
  ON "File" FOR INSERT
  WITH CHECK (auth.uid()::text = "ownerId");

CREATE POLICY "Users can update their own files"
  ON "File" FOR UPDATE
  USING (auth.uid()::text = "ownerId");

CREATE POLICY "Users can delete their own files"
  ON "File" FOR DELETE
  USING (auth.uid()::text = "ownerId");

-- Files: Allow reading shared/public files
CREATE POLICY "Users can view shared files"
  ON "File" FOR SELECT
  USING ("visibility" = 'SHARED' OR "visibility" = 'PUBLIC');

-- ProcessingJobs: Users can only access their own jobs
CREATE POLICY "Users can view their own jobs"
  ON "ProcessingJob" FOR SELECT
  USING (auth.uid()::text = "ownerId");

CREATE POLICY "Users can create their own jobs"
  ON "ProcessingJob" FOR INSERT
  WITH CHECK (auth.uid()::text = "ownerId");

CREATE POLICY "Users can update their own jobs"
  ON "ProcessingJob" FOR UPDATE
  USING (auth.uid()::text = "ownerId");

-- JobOutputs: Users can only view outputs of their own jobs
CREATE POLICY "Users can view outputs of their own jobs"
  ON "JobOutput" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ProcessingJob"
      WHERE "ProcessingJob".id = "JobOutput"."jobId"
      AND "ProcessingJob"."ownerId" = auth.uid()::text
    )
  );

-- UserActivity: Users can only access their own activity
CREATE POLICY "Users can view their own activity"
  ON "UserActivity" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create their own activity"
  ON "UserActivity" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- StudentRecords: Users can only access their own records
CREATE POLICY "Users can view their own student records"
  ON "StudentRecord" FOR SELECT
  USING (auth.uid()::text = "ownerId");

CREATE POLICY "Users can create their own student records"
  ON "StudentRecord" FOR INSERT
  WITH CHECK (auth.uid()::text = "ownerId");

CREATE POLICY "Users can update their own student records"
  ON "StudentRecord" FOR UPDATE
  USING (auth.uid()::text = "ownerId");

CREATE POLICY "Users can delete their own student records"
  ON "StudentRecord" FOR DELETE
  USING (auth.uid()::text = "ownerId");

-- Problems: Public read, owner write
CREATE POLICY "Anyone can view problems"
  ON "Problem" FOR SELECT
  USING (true);

CREATE POLICY "Users can create problems"
  ON "Problem" FOR INSERT
  WITH CHECK (auth.uid()::text = "submittedById");

CREATE POLICY "Users can update their own problems"
  ON "Problem" FOR UPDATE
  USING (auth.uid()::text = "submittedById");

-- Comments: Public read, authenticated write
CREATE POLICY "Anyone can view comments"
  ON "Comment" FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON "Comment" FOR INSERT
  WITH CHECK (auth.uid()::text = "authorId");

CREATE POLICY "Users can update their own comments"
  ON "Comment" FOR UPDATE
  USING (auth.uid()::text = "authorId");

CREATE POLICY "Users can delete their own comments"
  ON "Comment" FOR DELETE
  USING (auth.uid()::text = "authorId");

-- Note: These policies assume Supabase Auth is being used
-- For JWT-based auth, you'll need to adjust policies to use custom claims
-- or use service role key for backend operations

