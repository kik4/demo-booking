drop policy "Enable users to view their own data only" on "public"."profiles";

create policy "Enable users to view their own data only"
on "public"."profiles"
as permissive
for select
to authenticated
using (((( SELECT auth.uid() AS uid) = user_id) AND (deleted_at IS NULL)));



