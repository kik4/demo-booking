-- ポリシーで参照があるカラムは変更できないので再作成する
drop policy "Enable users to view their own data only" on "public"."profiles";


alter table "public"."profiles" alter column "created_at" set data type timestamp without time zone using "created_at"::timestamp without time zone;

alter table "public"."profiles" alter column "deleted_at" set data type timestamp without time zone using "deleted_at"::timestamp without time zone;

alter table "public"."profiles" alter column "updated_at" set data type timestamp without time zone using "updated_at"::timestamp without time zone;


-- 再作成
create policy "Enable users to view their own data only"
on "public"."profiles"
as permissive
for select
to authenticated
using (((( SELECT auth.uid() AS uid) = user_id) AND (deleted_at IS NULL)));

