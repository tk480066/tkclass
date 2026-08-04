-- TK Mooc Phase 7: Data Migration and Production Launch
-- Run AFTER migrations 0001-0006.
-- Safe to rerun.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'migration_run_status') then
    create type public.migration_run_status as enum ('pending', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'deployment_check_status') then
    create type public.deployment_check_status as enum ('pending', 'passed', 'warning', 'failed', 'skipped');
  end if;
end $$;

create table if not exists public.system_settings (
  setting_key text primary key,
  setting_value jsonb not null default 'null'::jsonb,
  description text,
  is_public boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_settings_key_check check (setting_key ~ '^[a-z0-9_]+$')
);

create table if not exists public.migration_runs (
  id uuid primary key default gen_random_uuid(),
  source_system text not null default 'csv',
  source_label text,
  status public.migration_run_status not null default 'pending',
  dry_run boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  total_rows integer not null default 0,
  processed_rows integer not null default 0,
  inserted_rows integer not null default 0,
  updated_rows integer not null default 0,
  skipped_rows integer not null default 0,
  error_rows integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  initiated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint migration_runs_counts_check check (
    total_rows >= 0 and processed_rows >= 0 and inserted_rows >= 0 and
    updated_rows >= 0 and skipped_rows >= 0 and error_rows >= 0
  )
);

create table if not exists public.migration_row_errors (
  id bigint generated always as identity primary key,
  migration_run_id uuid not null references public.migration_runs(id) on delete cascade,
  entity_type text not null,
  source_file text,
  row_number integer,
  external_key text,
  error_code text,
  error_message text not null,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint migration_row_errors_row_check check (row_number is null or row_number > 0)
);

-- Maps a Google Sheets/CSV external key to a generated UUID in Supabase.
-- This makes imports repeatable and prevents duplicate rows.
create table if not exists public.migration_key_map (
  id bigint generated always as identity primary key,
  source_system text not null default 'csv',
  entity_type text not null,
  external_key text not null,
  target_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_system, entity_type, external_key)
);

create table if not exists public.deployment_checks (
  id uuid primary key default gen_random_uuid(),
  environment text not null default 'production',
  check_key text not null,
  check_label text not null,
  status public.deployment_check_status not null default 'pending',
  details jsonb not null default '{}'::jsonb,
  checked_at timestamptz,
  checked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (environment, check_key),
  constraint deployment_checks_environment_check check (environment in ('local', 'preview', 'staging', 'production'))
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  class_id uuid references public.classes(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_migration_runs_created on public.migration_runs(created_at desc);
create index if not exists idx_migration_errors_run on public.migration_row_errors(migration_run_id, entity_type);
create index if not exists idx_migration_key_map_lookup on public.migration_key_map(entity_type, external_key);
create index if not exists idx_deployment_checks_environment on public.deployment_checks(environment, status);
create index if not exists idx_audit_events_actor_created on public.audit_events(actor_id, created_at desc);
create index if not exists idx_audit_events_class_created on public.audit_events(class_id, created_at desc);

-- Shared updated_at trigger from Phase 1.
drop trigger if exists system_settings_set_updated_at on public.system_settings;
create trigger system_settings_set_updated_at before update on public.system_settings
for each row execute function public.set_updated_at();

drop trigger if exists migration_runs_set_updated_at on public.migration_runs;
create trigger migration_runs_set_updated_at before update on public.migration_runs
for each row execute function public.set_updated_at();

drop trigger if exists migration_key_map_set_updated_at on public.migration_key_map;
create trigger migration_key_map_set_updated_at before update on public.migration_key_map
for each row execute function public.set_updated_at();

drop trigger if exists deployment_checks_set_updated_at on public.deployment_checks;
create trigger deployment_checks_set_updated_at before update on public.deployment_checks
for each row execute function public.set_updated_at();

insert into public.system_settings (setting_key, setting_value, description, is_public)
values
  ('system_name', '"TK Mooc"'::jsonb, 'ชื่อระบบที่แสดงต่อผู้ใช้งาน', true),
  ('schema_version', '"7.0.0"'::jsonb, 'เวอร์ชันฐานข้อมูลปัจจุบัน', true),
  ('maintenance_mode', 'false'::jsonb, 'เปิดหน้าบำรุงรักษาชั่วคราว', true),
  ('registration_enabled', 'false'::jsonb, 'อนุญาตการสมัครบัญชีสาธารณะ', true),
  ('production_ready', 'false'::jsonb, 'ผ่านการตรวจสอบก่อนเปิดระบบ', false),
  ('data_migration_completed', 'false'::jsonb, 'ย้ายข้อมูลจริงเสร็จสมบูรณ์', false),
  ('launch_at', 'null'::jsonb, 'เวลาเปิดใช้งานจริง', true),
  ('academic_year', '2569'::jsonb, 'ปีการศึกษาปัจจุบัน', true),
  ('semester', '1'::jsonb, 'ภาคเรียนปัจจุบัน', true),
  ('support_email', '""'::jsonb, 'อีเมลติดต่อผู้ดูแลระบบ', true),
  ('announcement_banner', '""'::jsonb, 'ข้อความแจ้งเตือนส่วนกลาง', true)
on conflict (setting_key) do nothing;

insert into public.deployment_checks (environment, check_key, check_label, status)
values
  ('production', 'database_migrations', 'รัน Migration 0001-0007 ครบ', 'pending'),
  ('production', 'rls_security', 'ตรวจ RLS และ Security Advisor', 'pending'),
  ('production', 'storage_buckets', 'ตรวจ Storage Buckets และ Policies', 'pending'),
  ('production', 'auth_accounts', 'ตรวจบัญชี Admin ครู และนักเรียน', 'pending'),
  ('production', 'data_migration', 'ย้ายและตรวจสอบข้อมูลจริง', 'pending'),
  ('production', 'production_build', 'npm run typecheck และ npm run build ผ่าน', 'pending'),
  ('production', 'vercel_environment', 'ตั้งค่า Environment Variables บน Vercel', 'pending'),
  ('production', 'custom_domain', 'ตั้งค่าโดเมนและ HTTPS', 'pending'),
  ('production', 'smoke_test', 'ทดสอบเส้นทางหลักทุกบทบาท', 'pending'),
  ('production', 'backup_and_rollback', 'สร้าง Backup และเตรียม Rollback', 'pending')
on conflict (environment, check_key) do nothing;

create or replace function public.is_maintenance_mode()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((setting_value #>> '{}')::boolean, false)
  from public.system_settings
  where setting_key = 'maintenance_mode';
$$;

create or replace function public.app_health()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'ok', true,
    'service', coalesce((select setting_value #>> '{}' from public.system_settings where setting_key = 'system_name'), 'TK Mooc'),
    'schema_version', coalesce((select setting_value #>> '{}' from public.system_settings where setting_key = 'schema_version'), 'unknown'),
    'maintenance_mode', coalesce((select (setting_value #>> '{}')::boolean from public.system_settings where setting_key = 'maintenance_mode'), false),
    'timestamp', now()
  );
$$;

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
    'system_settings','migration_runs','migration_row_errors','migration_key_map','deployment_checks','audit_events'
  ];
  required_buckets text[] := array['course-content','assignment-files','submission-files','communication-files'];
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

create or replace function public.record_audit_event(
  target_event_type text,
  target_entity_type text default null,
  target_entity_id uuid default null,
  target_class_id uuid default null,
  target_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  insert into public.audit_events(actor_id, event_type, entity_type, entity_id, class_id, metadata)
  values (auth.uid(), target_event_type, target_entity_type, target_entity_id, target_class_id, coalesce(target_metadata, '{}'::jsonb))
  returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.is_maintenance_mode() from public;
revoke all on function public.app_health() from public;
revoke all on function public.phase7_preflight() from public;
revoke all on function public.record_audit_event(text, text, uuid, uuid, jsonb) from public;
grant execute on function public.is_maintenance_mode() to anon, authenticated;
grant execute on function public.app_health() to anon, authenticated;
grant execute on function public.phase7_preflight() to authenticated;
grant execute on function public.record_audit_event(text, text, uuid, uuid, jsonb) to authenticated;

alter table public.system_settings enable row level security;
alter table public.migration_runs enable row level security;
alter table public.migration_row_errors enable row level security;
alter table public.migration_key_map enable row level security;
alter table public.deployment_checks enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "public read public settings" on public.system_settings;
create policy "public read public settings" on public.system_settings
for select to anon, authenticated using (is_public or public.is_admin());

drop policy if exists "admins manage system settings" on public.system_settings;
create policy "admins manage system settings" on public.system_settings
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage migration runs" on public.migration_runs;
create policy "admins manage migration runs" on public.migration_runs
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage migration errors" on public.migration_row_errors;
create policy "admins manage migration errors" on public.migration_row_errors
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage migration maps" on public.migration_key_map;
create policy "admins manage migration maps" on public.migration_key_map
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage deployment checks" on public.deployment_checks;
create policy "admins manage deployment checks" on public.deployment_checks
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins read audit events" on public.audit_events;
create policy "admins read audit events" on public.audit_events
for select to authenticated using (public.is_admin());

drop policy if exists "users insert own audit events" on public.audit_events;
create policy "users insert own audit events" on public.audit_events
for insert to authenticated with check (actor_id = auth.uid());

commit;
