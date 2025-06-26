-- Consolidate multiple permissive SELECT policies on profiles table
-- This improves performance by reducing policy evaluation overhead

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.profiles;
DROP POLICY IF EXISTS "Enable admin users to view all profiles" ON public.profiles;

-- Create single consolidated SELECT policy
CREATE POLICY "Enable users to view accessible profiles"
ON public.profiles
AS permissive
FOR SELECT
TO authenticated
USING (
  -- Users can view their own non-deleted profile
  ((user_id = (SELECT auth.uid())) AND (deleted_at IS NULL))
  OR 
  -- Admin users can view all profiles (including deleted ones)
  is_admin_user()
);