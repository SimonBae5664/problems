-- Alternative RLS Policies for JWT-based Authentication
-- Use these if you're using JWT tokens instead of Supabase Auth

-- Note: These policies use a custom function to extract user ID from JWT
-- You'll need to create a function that extracts the user ID from the JWT token

-- Example function to extract user ID from JWT (if stored in custom claims)
CREATE OR REPLACE FUNCTION get_user_id_from_jwt()
RETURNS TEXT AS $$
BEGIN
  -- Extract user ID from JWT custom claims
  -- Adjust based on your JWT structure
  RETURN current_setting('request.jwt.claims', true)::json->>'userId';
END;
$$ LANGUAGE plpgsql STABLE;

-- Alternative: Use a custom header or session variable
-- Set in your backend: SET LOCAL app.user_id = 'user-id';

-- Files: Using custom function
CREATE POLICY "Users can view their own files (JWT)"
  ON "File" FOR SELECT
  USING (get_user_id_from_jwt() = "ownerId");

-- Note: For JWT-based auth, you may want to:
-- 1. Use service role key for all backend operations (bypasses RLS)
-- 2. Implement custom RLS functions that read from JWT claims
-- 3. Or disable RLS and handle authorization in application code

-- Recommended approach for JWT:
-- - Use service role key for backend API
-- - Handle authorization in application code (middleware)
-- - Keep RLS enabled but with permissive policies for service role
-- - Or disable RLS and rely on application-level authorization

