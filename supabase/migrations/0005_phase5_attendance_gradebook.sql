-- TK Mooc Phase 5: Attendance and Gradebook
-- Run AFTER 0001-0004 migrations.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'attendance_session_status') then
    create type public.attendance_session_status as enum ('draft', 'open', 'closed', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type public.attendance_status as enum ('unmarked', 'present', 'late', 'absent', 'leave', 'sick', 'activity');
  end if;
  if not exists (select 1 from pg_type where typname = 'attendance_checkin_method') then
    create type public.attendance_checkin_method as enum ('manual', 'code', 'qr');
  end if;
  if not exists (select 1 from pg_type where typname = 'grade_source_type') then
    create type public.grade_source_type as enum ('assignment', 'quiz', 'custom');
  end if;
  if not exists (select 1 from pg_type where typname = 'grade_item_status') then
    create type public.grade_item_status as enum ('draft', 'published', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'grade_calculation_method') then
    create type public.grade_calculation_method as enum ('weighted_categories', 'total_points');
  end if;
end $$;

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null default 'เช็กชื่อเข้าเรียน',
  session_date date not null default current_date,
  period_label text,
  opens_at timestamptz,
  closes_at timestamptz,
  late_after_minutes integer not null default 15,
  allow_self_checkin boolean not null default true,
  check_in_code text,
  status public.attendance_session_status not null default 'draft',
  note text,
  created_by uuid not null references public.teacher_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_sessions_late_after_check check (late_after_minutes >= 0 and late_after_minutes <= 240),
  constraint attendance_sessions_time_check check (closes_at is null or opens_at is null or closes_at > opens_at),
  constraint attendance_sessions_code_check check (check_in_code is null or check_in_code ~ '^[0-9]{6}$')
);

create unique index if not exists attendance_sessions_open_code_unique
  on public.attendance_sessions(check_in_code)
  where check_in_code is not null and status = 'open';
create index if not exists idx_attendance_sessions_class_date
  on public.attendance_sessions(class_id, session_date desc);
create index if not exists idx_attendance_sessions_status
  on public.attendance_sessions(status, opens_at, closes_at);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  status public.attendance_status not null default 'unmarked',
  checked_in_at timestamptz,
  check_in_method public.attendance_checkin_method not null default 'manual',
  note text,
  marked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create index if not exists idx_attendance_records_student
  on public.attendance_records(student_id, session_id);
create index if not exists idx_attendance_records_session_status
  on public.attendance_records(session_id, status);

create table if not exists public.grade_categories (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  weight_percent numeric(5,2) not null default 0,
  order_no integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grade_categories_weight_check check (weight_percent >= 0 and weight_percent <= 100),
  unique (class_id, name)
);

create table if not exists public.grade_settings (
  class_id uuid primary key references public.classes(id) on delete cascade,
  calculation_method public.grade_calculation_method not null default 'weighted_categories',
  publish_final_grade boolean not null default false,
  minimum_attendance_percent numeric(5,2) not null default 80,
  grade_scale jsonb not null default '[
    {"grade":"4","min":80},
    {"grade":"3.5","min":75},
    {"grade":"3","min":70},
    {"grade":"2.5","min":65},
    {"grade":"2","min":60},
    {"grade":"1.5","min":55},
    {"grade":"1","min":50},
    {"grade":"0","min":0}
  ]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grade_settings_attendance_check check (minimum_attendance_percent >= 0 and minimum_attendance_percent <= 100),
  constraint grade_settings_scale_check check (jsonb_typeof(grade_scale) = 'array')
);

create table if not exists public.grade_items (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  category_id uuid references public.grade_categories(id) on delete set null,
  source_type public.grade_source_type not null default 'custom',
  source_id uuid,
  title text not null,
  description text,
  max_score numeric(8,2) not null default 10,
  item_weight numeric(8,2) not null default 1,
  status public.grade_item_status not null default 'draft',
  due_at timestamptz,
  order_no integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grade_items_max_score_check check (max_score > 0),
  constraint grade_items_weight_check check (item_weight > 0),
  constraint grade_items_source_check check (
    (source_type = 'custom' and source_id is null)
    or (source_type in ('assignment', 'quiz') and source_id is not null)
  )
);

create unique index if not exists grade_items_source_unique
  on public.grade_items(class_id, source_type, source_id)
  where source_id is not null;
create index if not exists idx_grade_items_class_category
  on public.grade_items(class_id, category_id, order_no);

create table if not exists public.grade_entries (
  id uuid primary key default gen_random_uuid(),
  grade_item_id uuid not null references public.grade_items(id) on delete cascade,
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  score numeric(8,2),
  is_excused boolean not null default false,
  feedback text,
  graded_by uuid references public.teacher_profiles(user_id) on delete set null,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grade_entries_score_check check (score is null or score >= 0),
  unique (grade_item_id, student_id)
);

create index if not exists idx_grade_entries_student
  on public.grade_entries(student_id, grade_item_id);

-- Updated-at triggers.
drop trigger if exists attendance_sessions_set_updated_at on public.attendance_sessions;
create trigger attendance_sessions_set_updated_at before update on public.attendance_sessions
for each row execute function public.set_updated_at();
drop trigger if exists attendance_records_set_updated_at on public.attendance_records;
create trigger attendance_records_set_updated_at before update on public.attendance_records
for each row execute function public.set_updated_at();
drop trigger if exists grade_categories_set_updated_at on public.grade_categories;
create trigger grade_categories_set_updated_at before update on public.grade_categories
for each row execute function public.set_updated_at();
drop trigger if exists grade_settings_set_updated_at on public.grade_settings;
create trigger grade_settings_set_updated_at before update on public.grade_settings
for each row execute function public.set_updated_at();
drop trigger if exists grade_items_set_updated_at on public.grade_items;
create trigger grade_items_set_updated_at before update on public.grade_items
for each row execute function public.set_updated_at();
drop trigger if exists grade_entries_set_updated_at on public.grade_entries;
create trigger grade_entries_set_updated_at before update on public.grade_entries
for each row execute function public.set_updated_at();

create or replace function public.is_teacher_of_attendance_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.attendance_sessions s
    join public.classes c on c.id = s.class_id
    where s.id = target_session_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_teacher_of_grade_item(target_grade_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.grade_items gi
    join public.classes c on c.id = gi.class_id
    where gi.id = target_grade_item_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.generate_attendance_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := lpad((floor(random() * 1000000))::integer::text, 6, '0');
    exit when not exists (
      select 1 from public.attendance_sessions
      where check_in_code = candidate and status = 'open'
    );
  end loop;
  return candidate;
end;
$$;

create or replace function public.ensure_attendance_records(target_session_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  target_class_id uuid;
  inserted_count integer;
begin
  select class_id into target_class_id
  from public.attendance_sessions
  where id = target_session_id;

  if target_class_id is null then
    raise exception 'ไม่พบคาบเช็กชื่อ';
  end if;
  if not (public.is_teacher_of_class(target_class_id) or public.is_admin()) then
    raise exception 'ไม่มีสิทธิ์จัดการคาบเช็กชื่อ';
  end if;

  insert into public.attendance_records (session_id, student_id, status, check_in_method, marked_by)
  select target_session_id, e.student_id, 'unmarked', 'manual', auth.uid()
  from public.enrollments e
  where e.class_id = target_class_id and e.status = 'active'
  on conflict (session_id, student_id) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.student_check_in(attendance_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session public.attendance_sessions%rowtype;
  next_status public.attendance_status;
  result_record public.attendance_records%rowtype;
begin
  if auth.uid() is null then
    raise exception 'กรุณาเข้าสู่ระบบ';
  end if;

  select * into target_session
  from public.attendance_sessions
  where check_in_code = trim(attendance_code)
    and status = 'open'
  limit 1;

  if target_session.id is null then
    raise exception 'รหัสเช็กชื่อไม่ถูกต้องหรือคาบถูกปิดแล้ว';
  end if;
  if not target_session.allow_self_checkin then
    raise exception 'คาบนี้ไม่เปิดให้นักเรียนเช็กชื่อด้วยตนเอง';
  end if;
  if target_session.opens_at is not null and now() < target_session.opens_at then
    raise exception 'ยังไม่ถึงเวลาเช็กชื่อ';
  end if;
  if target_session.closes_at is not null and now() > target_session.closes_at then
    raise exception 'หมดเวลาเช็กชื่อแล้ว';
  end if;
  if not public.is_enrolled_in_class(target_session.class_id) then
    raise exception 'คุณไม่ได้ลงทะเบียนในชั้นเรียนนี้';
  end if;

  next_status := case
    when target_session.opens_at is not null
      and now() > target_session.opens_at + make_interval(mins => target_session.late_after_minutes)
      then 'late'::public.attendance_status
    else 'present'::public.attendance_status
  end;

  insert into public.attendance_records (
    session_id, student_id, status, checked_in_at, check_in_method, marked_by
  ) values (
    target_session.id, auth.uid(), next_status, now(), 'code', auth.uid()
  )
  on conflict (session_id, student_id) do update set
    status = excluded.status,
    checked_in_at = excluded.checked_in_at,
    check_in_method = excluded.check_in_method,
    marked_by = excluded.marked_by,
    updated_at = now()
  returning * into result_record;

  return jsonb_build_object(
    'session_id', target_session.id,
    'class_id', target_session.class_id,
    'title', target_session.title,
    'status', result_record.status,
    'checked_in_at', result_record.checked_in_at
  );
end;
$$;

create or replace function public.ensure_default_gradebook(target_class_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_teacher_of_class(target_class_id) or public.is_admin()) then
    raise exception 'ไม่มีสิทธิ์จัดการสมุดคะแนน';
  end if;

  insert into public.grade_settings (class_id)
  values (target_class_id)
  on conflict (class_id) do nothing;

  insert into public.grade_categories (class_id, name, weight_percent, order_no)
  values
    (target_class_id, 'งานและการส่งงาน', 40, 1),
    (target_class_id, 'แบบทดสอบ', 40, 2),
    (target_class_id, 'คะแนนอื่น ๆ', 20, 3)
  on conflict (class_id, name) do nothing;
end;
$$;

create or replace function public.sync_gradebook_sources(target_class_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  assignment_category_id uuid;
  quiz_category_id uuid;
  assignment_count integer := 0;
  quiz_count integer := 0;
begin
  perform public.ensure_default_gradebook(target_class_id);

  select id into assignment_category_id
  from public.grade_categories
  where class_id = target_class_id and name = 'งานและการส่งงาน';

  select id into quiz_category_id
  from public.grade_categories
  where class_id = target_class_id and name = 'แบบทดสอบ';

  insert into public.grade_items (
    class_id, category_id, source_type, source_id, title, max_score, item_weight, status, due_at, order_no
  )
  select
    a.class_id,
    assignment_category_id,
    'assignment',
    a.id,
    a.title,
    a.max_score,
    1,
    case when a.status in ('published', 'closed') then 'published'::public.grade_item_status else 'draft'::public.grade_item_status end,
    a.due_at,
    row_number() over (order by a.created_at, a.id)::integer
  from public.assignments a
  where a.class_id = target_class_id and a.status <> 'archived'
  on conflict (class_id, source_type, source_id) where source_id is not null
  do update set
    category_id = excluded.category_id,
    title = excluded.title,
    max_score = excluded.max_score,
    status = excluded.status,
    due_at = excluded.due_at,
    updated_at = now();
  get diagnostics assignment_count = row_count;

  insert into public.grade_items (
    class_id, category_id, source_type, source_id, title, max_score, item_weight, status, due_at, order_no
  )
  select
    q.class_id,
    quiz_category_id,
    'quiz',
    q.id,
    q.title,
    greatest(q.total_points, 1),
    1,
    case when q.status in ('published', 'closed') then 'published'::public.grade_item_status else 'draft'::public.grade_item_status end,
    q.close_at,
    row_number() over (order by q.created_at, q.id)::integer
  from public.quizzes q
  where q.class_id = target_class_id and q.status <> 'archived'
  on conflict (class_id, source_type, source_id) where source_id is not null
  do update set
    category_id = excluded.category_id,
    title = excluded.title,
    max_score = excluded.max_score,
    status = excluded.status,
    due_at = excluded.due_at,
    updated_at = now();
  get diagnostics quiz_count = row_count;

  return jsonb_build_object('assignments', assignment_count, 'quizzes', quiz_count);
end;
$$;

revoke all on function public.is_teacher_of_attendance_session(uuid) from public;
revoke all on function public.is_teacher_of_grade_item(uuid) from public;
revoke all on function public.generate_attendance_code() from public;
revoke all on function public.ensure_attendance_records(uuid) from public;
revoke all on function public.student_check_in(text) from public;
revoke all on function public.ensure_default_gradebook(uuid) from public;
revoke all on function public.sync_gradebook_sources(uuid) from public;

grant execute on function public.is_teacher_of_attendance_session(uuid) to authenticated;
grant execute on function public.is_teacher_of_grade_item(uuid) to authenticated;
grant execute on function public.generate_attendance_code() to authenticated;
grant execute on function public.ensure_attendance_records(uuid) to authenticated;
grant execute on function public.student_check_in(text) to authenticated;
grant execute on function public.ensure_default_gradebook(uuid) to authenticated;
grant execute on function public.sync_gradebook_sources(uuid) to authenticated;

alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grade_categories enable row level security;
alter table public.grade_settings enable row level security;
alter table public.grade_items enable row level security;
alter table public.grade_entries enable row level security;

-- Attendance session policies.
drop policy if exists "teachers read attendance sessions" on public.attendance_sessions;
create policy "teachers read attendance sessions" on public.attendance_sessions
for select to authenticated using (public.is_teacher_of_class(class_id) or public.is_admin());
drop policy if exists "students read attendance sessions" on public.attendance_sessions;
create policy "students read attendance sessions" on public.attendance_sessions
for select to authenticated using (public.is_enrolled_in_class(class_id) and status in ('open', 'closed', 'cancelled'));
drop policy if exists "teachers insert attendance sessions" on public.attendance_sessions;
create policy "teachers insert attendance sessions" on public.attendance_sessions
for insert to authenticated with check ((created_by = auth.uid() and public.is_teacher_of_class(class_id)) or public.is_admin());
drop policy if exists "teachers update attendance sessions" on public.attendance_sessions;
create policy "teachers update attendance sessions" on public.attendance_sessions
for update to authenticated using (public.is_teacher_of_class(class_id) or public.is_admin())
with check (public.is_teacher_of_class(class_id) or public.is_admin());
drop policy if exists "teachers delete attendance sessions" on public.attendance_sessions;
create policy "teachers delete attendance sessions" on public.attendance_sessions
for delete to authenticated using (public.is_teacher_of_class(class_id) or public.is_admin());

-- Attendance record policies.
drop policy if exists "teachers read attendance records" on public.attendance_records;
create policy "teachers read attendance records" on public.attendance_records
for select to authenticated using (public.is_teacher_of_attendance_session(session_id) or public.is_admin());
drop policy if exists "students read own attendance records" on public.attendance_records;
create policy "students read own attendance records" on public.attendance_records
for select to authenticated using (student_id = auth.uid());
drop policy if exists "teachers insert attendance records" on public.attendance_records;
create policy "teachers insert attendance records" on public.attendance_records
for insert to authenticated with check (public.is_teacher_of_attendance_session(session_id) or public.is_admin());
drop policy if exists "teachers update attendance records" on public.attendance_records;
create policy "teachers update attendance records" on public.attendance_records
for update to authenticated using (public.is_teacher_of_attendance_session(session_id) or public.is_admin())
with check (public.is_teacher_of_attendance_session(session_id) or public.is_admin());
drop policy if exists "teachers delete attendance records" on public.attendance_records;
create policy "teachers delete attendance records" on public.attendance_records
for delete to authenticated using (public.is_teacher_of_attendance_session(session_id) or public.is_admin());

-- Grade category/settings policies.
drop policy if exists "teachers manage grade categories" on public.grade_categories;
create policy "teachers manage grade categories" on public.grade_categories
for all to authenticated using (public.is_teacher_of_class(class_id) or public.is_admin())
with check (public.is_teacher_of_class(class_id) or public.is_admin());
drop policy if exists "students read grade categories" on public.grade_categories;
create policy "students read grade categories" on public.grade_categories
for select to authenticated using (public.is_enrolled_in_class(class_id) and is_active);

drop policy if exists "teachers manage grade settings" on public.grade_settings;
create policy "teachers manage grade settings" on public.grade_settings
for all to authenticated using (public.is_teacher_of_class(class_id) or public.is_admin())
with check (public.is_teacher_of_class(class_id) or public.is_admin());
drop policy if exists "students read published grade settings" on public.grade_settings;
create policy "students read published grade settings" on public.grade_settings
for select to authenticated using (public.is_enrolled_in_class(class_id));

-- Grade item/entry policies.
drop policy if exists "teachers manage grade items" on public.grade_items;
create policy "teachers manage grade items" on public.grade_items
for all to authenticated using (public.is_teacher_of_class(class_id) or public.is_admin())
with check (public.is_teacher_of_class(class_id) or public.is_admin());
drop policy if exists "students read published grade items" on public.grade_items;
create policy "students read published grade items" on public.grade_items
for select to authenticated using (public.is_enrolled_in_class(class_id) and status = 'published');

drop policy if exists "teachers manage grade entries" on public.grade_entries;
create policy "teachers manage grade entries" on public.grade_entries
for all to authenticated using (public.is_teacher_of_grade_item(grade_item_id) or public.is_admin())
with check (public.is_teacher_of_grade_item(grade_item_id) or public.is_admin());
drop policy if exists "students read own grade entries" on public.grade_entries;
create policy "students read own grade entries" on public.grade_entries
for select to authenticated using (
  student_id = auth.uid()
  and exists (
    select 1 from public.grade_items gi
    where gi.id = grade_item_id and gi.status = 'published'
  )
);

commit;
