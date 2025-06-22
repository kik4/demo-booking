drop policy "Enable users to update their own data only" on "public"."profiles";

create policy "Enable users to update their own data only"
on "public"."profiles"
as permissive
for update
to public
using (((( SELECT auth.uid() AS uid) = user_id) AND (deleted_at IS NULL)))
with check ((( SELECT auth.uid() AS uid) = user_id));



