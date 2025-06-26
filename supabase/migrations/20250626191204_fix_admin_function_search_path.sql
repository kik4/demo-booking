-- Fix is_admin_user function to have immutable search_path for security
-- This prevents schema poisoning attacks by ensuring the function always
-- uses the correct schema references

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
    AND deleted_at IS NULL
  );
$$;