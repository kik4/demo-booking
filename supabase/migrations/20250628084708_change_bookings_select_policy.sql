drop policy "Enable users to view their own bookings" on "public"."bookings";

create policy "Enable users to view accessible profiles"
on "public"."bookings"
as permissive
for select
to authenticated
using ((((deleted_at IS NULL) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = bookings.profile_id) AND (profiles.user_id = ( SELECT auth.uid() AS uid)) AND (profiles.deleted_at IS NULL))))) OR is_admin_user()));



