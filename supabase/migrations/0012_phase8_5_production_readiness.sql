-- TK Mooc Phase 8.5: Responsive, RLS and Production Readiness
-- Run AFTER 0011_phase8_4_preview_schedule_history.sql
begin;

insert into public.system_settings (setting_key, setting_value, description, is_public)
values ('schema_version', '"8.5.0"'::jsonb, 'เวอร์ชันฐานข้อมูลปัจจุบัน', true)
on conflict (setting_key) do update
set setting_value = excluded.setting_value,
    description = excluded.description,
    updated_at = now();

insert into public.deployment_checks (environment, check_key, check_label, status)
values
  ('production', 'responsive_mobile', 'ตรวจ Responsive ที่ 360px, 768px และ Desktop', 'pending'),
  ('production', 'cms_rls_complete', 'ตรวจ RLS และ Policies ของตาราง CMS Phase 8', 'pending'),
  ('production', 'cms_public_visibility', 'ตรวจ Draft/Scheduled/Published บนหน้าสาธารณะ', 'pending'),
  ('production', 'production_headers', 'ตรวจ HTTPS, Security headers และ Cache policy', 'pending'),
  ('production', 'production_health', 'ตรวจ /api/health และเส้นทางสำคัญบน Production', 'pending')
on conflict (environment, check_key) do update
set check_label = excluded.check_label,
    updated_at = now();

create or replace function public.phase85_readiness_report()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  required_tables text[] := array[
    'profiles','teacher_profiles','student_profiles','classes','enrollments',
    'units','lessons','assignments','submissions','quizzes','quiz_attempts',
    'attendance_sessions','attendance_records','grade_items','grade_entries',
    'announcements','conversations','messages','system_settings','deployment_checks',
    'site_homepage_settings','site_navigation_items','site_homepage_sections',
    'site_news_items','site_events','site_stat_items','site_related_links',
    'site_content_revisions','site_preview_sessions'
  ];
  cms_tables text[] := array[
    'site_homepage_settings','site_navigation_items','site_homepage_sections',
    'site_news_items','site_events','site_stat_items','site_related_links',
    'site_content_revisions','site_preview_sessions'
  ];
  required_buckets text[] := array[
    'course-content','assignment-files','submission-files','communication-files','site-assets'
  ];
  missing_tables text[];
  rls_disabled text[];
  tables_without_policies text[];
  missing_buckets text[];
  failed_checks integer;
  pending_checks integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select coalesce(array_agg(t order by t), '{}'::text[])
  into missing_tables
  from unnest(required_tables) t
  where to_regclass('public.' || quote_ident(t)) is null;

  select coalesce(array_agg(c.relname order by c.relname), '{}'::text[])
  into rls_disabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname = any(cms_tables)
    and not c.relrowsecurity;

  select coalesce(array_agg(t order by t), '{}'::text[])
  into tables_without_policies
  from unnest(cms_tables) t
  where to_regclass('public.' || quote_ident(t)) is not null
    and not exists (
      select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = t
    );

  select coalesce(array_agg(b order by b), '{}'::text[])
  into missing_buckets
  from unnest(required_buckets) b
  where not exists (select 1 from storage.buckets sb where sb.id = b);

  select count(*) filter (where status = 'failed'), count(*) filter (where status = 'pending')
  into failed_checks, pending_checks
  from public.deployment_checks
  where environment = 'production';

  return jsonb_build_object(
    'ok', cardinality(missing_tables)=0
      and cardinality(rls_disabled)=0
      and cardinality(tables_without_policies)=0
      and cardinality(missing_buckets)=0
      and failed_checks=0,
    'schema_version', '8.5.0',
    'missing_tables', missing_tables,
    'rls_disabled', rls_disabled,
    'tables_without_policies', tables_without_policies,
    'missing_buckets', missing_buckets,
    'deployment_failed', failed_checks,
    'deployment_pending', pending_checks,
    'checked_at', now()
  );
end;
$$;

grant execute on function public.phase85_readiness_report() to authenticated, service_role;

commit;
