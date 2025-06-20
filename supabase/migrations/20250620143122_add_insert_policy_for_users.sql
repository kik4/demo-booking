-- Add INSERT policy for users table
create policy "Enable users to insert their own data"
on "public"."users"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));

-- Add UPDATE policy for users table
create policy "Enable users to update their own data"
on "public"."users"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));

-- Add DELETE policy for users table
create policy "Enable users to delete their own data"
on "public"."users"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));
