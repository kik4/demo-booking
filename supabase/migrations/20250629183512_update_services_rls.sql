drop policy "services_admin_delete_policy" on "public"."services";

drop policy "services_select_policy" on "public"."services";

create policy "services_select_policy"
on "public"."services"
as permissive
for select
to public
using (((deleted_at IS NULL) OR is_admin_user()));



