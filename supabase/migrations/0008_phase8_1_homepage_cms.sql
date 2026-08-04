-- TK Mooc Phase 8.1: Homepage CMS — Header, Hero and Footer
-- Run AFTER 0001-0007 migrations in Supabase SQL Editor.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'site_hero_visual_mode') then
    create type public.site_hero_visual_mode as enum ('phone', 'image', 'none');
  end if;
end $$;

create table if not exists public.site_homepage_settings (
  id uuid primary key default gen_random_uuid(),
  site_key text not null unique default 'main',

  header_site_name text not null default 'TK Mooc',
  header_tagline text not null default 'ศูนย์การเรียนรู้ครูปิง',
  header_logo_path text,
  header_logo_alt text not null default 'โลโก้ TK Mooc',
  header_show_tagline boolean not null default true,
  header_show_theme_toggle boolean not null default true,
  header_login_label text not null default 'เข้าสู่ระบบ',
  header_logged_in_label text not null default 'แดชบอร์ด',

  hero_is_visible boolean not null default true,
  hero_badge text not null default 'ห้องเรียนแห่งอนาคต',
  hero_title_primary text not null default 'เชื่อมต่อการสอน',
  hero_title_accent text not null default 'อย่างเป็นระบบ',
  hero_description text not null default 'รวมลิงก์ชั้นเรียน ข่าวประกาศ และกิจกรรมสำคัญไว้ในที่เดียว พร้อมส่วนจัดการข้อมูลสำหรับผู้ดูแลระบบ',
  hero_primary_label text not null default 'สำหรับครู',
  hero_primary_url text not null default '/login',
  hero_secondary_label text not null default 'ดูกิจกรรม',
  hero_secondary_url text not null default '#calendar',
  hero_visual_mode public.site_hero_visual_mode not null default 'phone',
  hero_image_path text,
  hero_image_alt text not null default 'ภาพประกอบ TK Mooc',

  footer_is_visible boolean not null default true,
  footer_description text not null default 'พื้นที่เรียนรู้ที่เชื่อมโยงทุกคนอย่างเป็นระบบ',
  footer_contact_heading text not null default 'ติดต่อเรา',
  footer_contact_line_1 text not null default 'กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี',
  footer_contact_line_2 text not null default 'admin@example.com',
  footer_social_heading text not null default 'ช่องทางออนไลน์',
  footer_facebook_label text not null default 'Facebook',
  footer_facebook_url text not null default '',
  footer_youtube_label text not null default 'YouTube',
  footer_youtube_url text not null default '',
  footer_line_label text not null default 'LINE',
  footer_line_url text not null default '',
  footer_copyright text not null default '© 2026 TK Mooc. All rights reserved.',
  footer_technology text not null default 'Next.js · Supabase · Vercel',

  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint site_homepage_settings_site_key_check check (site_key ~ '^[a-z0-9_-]+$'),
  constraint site_homepage_settings_text_check check (
    length(trim(header_site_name)) > 0
    and length(trim(hero_title_primary)) > 0
    and length(trim(hero_title_accent)) > 0
  )
);

create table if not exists public.site_navigation_items (
  id uuid primary key default gen_random_uuid(),
  location text not null default 'header',
  label text not null,
  url text not null,
  icon_name text not null default 'link',
  display_order integer not null default 0,
  is_visible boolean not null default true,
  open_new_tab boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint site_navigation_location_check check (location in ('header')),
  constraint site_navigation_label_check check (length(trim(label)) between 1 and 60),
  constraint site_navigation_url_check check (length(trim(url)) between 1 and 500),
  constraint site_navigation_icon_check check (
    icon_name in ('home','teacher','student','about','book','calendar','info','megaphone','link')
  ),
  constraint site_navigation_order_check check (display_order between 0 and 999)
);

create index if not exists idx_site_navigation_location_order
  on public.site_navigation_items(location, display_order, created_at);

-- Reuse shared updated_at trigger from Phase 1.
drop trigger if exists site_homepage_settings_set_updated_at on public.site_homepage_settings;
create trigger site_homepage_settings_set_updated_at before update on public.site_homepage_settings
for each row execute function public.set_updated_at();

drop trigger if exists site_navigation_items_set_updated_at on public.site_navigation_items;
create trigger site_navigation_items_set_updated_at before update on public.site_navigation_items
for each row execute function public.set_updated_at();

insert into public.site_homepage_settings (site_key)
values ('main')
on conflict (site_key) do nothing;

insert into public.site_navigation_items (location, label, url, icon_name, display_order, is_visible)
select values_row.location, values_row.label, values_row.url, values_row.icon_name, values_row.display_order, true
from (
  values
    ('header', 'หน้าหลัก', '#home', 'home', 10),
    ('header', 'สำหรับครู', '#roles', 'teacher', 20),
    ('header', 'สำหรับนักเรียน', '#roles', 'student', 30),
    ('header', 'เกี่ยวกับ', '#about', 'about', 40)
) as values_row(location, label, url, icon_name, display_order)
where not exists (
  select 1 from public.site_navigation_items n where n.location = 'header'
);

alter table public.site_homepage_settings enable row level security;
alter table public.site_navigation_items enable row level security;

drop policy if exists "public read homepage settings" on public.site_homepage_settings;
create policy "public read homepage settings" on public.site_homepage_settings
for select to anon, authenticated using (site_key = 'main');

drop policy if exists "admins manage homepage settings" on public.site_homepage_settings;
create policy "admins manage homepage settings" on public.site_homepage_settings
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read visible navigation" on public.site_navigation_items;
create policy "public read visible navigation" on public.site_navigation_items
for select to anon, authenticated using (is_visible or public.is_admin());

drop policy if exists "admins manage navigation" on public.site_navigation_items;
create policy "admins manage navigation" on public.site_navigation_items
for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  4194304,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read site assets" on storage.objects;
create policy "public read site assets" on storage.objects
for select to anon, authenticated using (bucket_id = 'site-assets');

drop policy if exists "admins upload site assets" on storage.objects;
create policy "admins upload site assets" on storage.objects
for insert to authenticated with check (
  bucket_id = 'site-assets' and public.is_admin()
);

drop policy if exists "admins update site assets" on storage.objects;
create policy "admins update site assets" on storage.objects
for update to authenticated using (
  bucket_id = 'site-assets' and public.is_admin()
) with check (
  bucket_id = 'site-assets' and public.is_admin()
);

drop policy if exists "admins delete site assets" on storage.objects;
create policy "admins delete site assets" on storage.objects
for delete to authenticated using (
  bucket_id = 'site-assets' and public.is_admin()
);



insert into public.system_settings (setting_key, setting_value, description, is_public)
values ('schema_version', '"8.1.0"'::jsonb, 'เวอร์ชันฐานข้อมูลปัจจุบัน', true)
on conflict (setting_key) do update set
  setting_value = excluded.setting_value,
  description = excluded.description,
  is_public = excluded.is_public,
  updated_at = now();

insert into public.deployment_checks (environment, check_key, check_label, status)
values ('production', 'homepage_cms', 'ตรวจ Header, Hero, Footer และ Site Assets', 'pending')
on conflict (environment, check_key) do nothing;

create or replace function public.phase7_preflight()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  required_tables text[] := array[
    'profiles','teacher_profiles','student_profiles','classes','enrollments',
    'units','lessons','lesson_blocks','lesson_progress','lesson_responses',
    'assignments','assignment_targets','assignment_attachments','submissions','submission_members','submission_files',
    'quizzes','quiz_questions','quiz_options','quiz_attempts','quiz_answers',
    'attendance_sessions','attendance_records','grade_categories','grade_settings','grade_items','grade_entries',
    'announcements','announcement_attachments','announcement_reads','conversations','conversation_participants','messages','message_attachments',
    'system_settings','migration_runs','migration_row_errors','migration_key_map','deployment_checks','audit_events',
    'site_homepage_settings','site_navigation_items'
  ];
  required_buckets text[] := array['course-content','assignment-files','submission-files','communication-files','site-assets'];
  missing_tables text[];
  rls_disabled text[];
  missing_buckets text[];
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select coalesce(array_agg(name order by name), '{}'::text[])
  into missing_tables
  from unnest(required_tables) as name
  where to_regclass('public.' || quote_ident(name)) is null;

  select coalesce(array_agg(c.relname order by c.relname), '{}'::text[])
  into rls_disabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname = any(required_tables)
    and not c.relrowsecurity;

  select coalesce(array_agg(name order by name), '{}'::text[])
  into missing_buckets
  from unnest(required_buckets) as name
  where not exists (select 1 from storage.buckets b where b.id = name);

  return jsonb_build_object(
    'ok', cardinality(missing_tables) = 0 and cardinality(rls_disabled) = 0 and cardinality(missing_buckets) = 0,
    'missing_tables', to_jsonb(missing_tables),
    'rls_disabled', to_jsonb(rls_disabled),
    'missing_buckets', to_jsonb(missing_buckets),
    'profile_count', (select count(*) from public.profiles),
    'teacher_count', (select count(*) from public.teacher_profiles),
    'student_count', (select count(*) from public.student_profiles),
    'class_count', (select count(*) from public.classes),
    'migration_count', (select count(*) from public.migration_runs),
    'timestamp', now()
  );
end;
$$;

commit;
