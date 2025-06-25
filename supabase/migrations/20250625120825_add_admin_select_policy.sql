-- Add admin select policy for profiles table
-- Allows admin users to select all profiles regardless of user_id
-- Using a function to avoid infinite recursion
create or replace function is_admin_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles 
    where user_id = auth.uid() 
    and role = 'admin'
    and deleted_at is null
  );
$$;

create policy "Enable admin users to view all profiles"
on "public"."profiles"
as permissive
for select
to authenticated
using (is_admin_user());