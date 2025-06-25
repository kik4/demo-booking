-- Add unique constraint for user_id in profiles table where deleted_at is NULL
-- This ensures that only one active (non-deleted) profile can exist per user

CREATE UNIQUE INDEX profiles_user_id_unique_active 
ON public.profiles (user_id) 
WHERE deleted_at IS NULL;