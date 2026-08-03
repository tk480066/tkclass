-- TK Mooc Phase 2: Classes and Lessons
-- Run AFTER 0001_phase1_foundation.sql in Supabase SQL Editor.

begin;

-- Extend the class table with information required by the LMS interface.
alter table public.classes
  add column if not exists online_meeting_url text,
  add column if not exists cover_path text,
  add column if not exists course_color text default '#0d5ba7',
  add column if not exists syllabus text;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'content_status') then
    create type public.content_status as enum ('draft', 'published', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'lesson_block_type') then
    create type public.lesson_block_type as enum ('text', 'image', 'video', 'file', 'link', 'activity');
  end if;

  if not exists (select 1 from pg_type where typname = 'lesson_progress_status') then
    create type public.lesson_progress_status as enum ('not_started', 'in_progress', 'completed');
  end if;
end $$;

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  description text,
  objectives text,
  order_no integer not null default 1 check (order_no > 0),
  status public.content_status not null default 'draft',
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  title text not null,
  summary text,
  objectives text,
  order_no integer not null default 1 check (order_no > 0),
  estimated_minutes integer not null default 20 check (estimated_minutes > 0 and estimated_minutes <= 600),
  status public.content_status not null default 'draft',
  publish_at timestamptz,
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  block_type public.lesson_block_type not null,
  title text,
  body text,
  external_url text,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  order_no integer not null default 1 check (order_no > 0),
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  status public.lesson_progress_status not null default 'not_started',
  progress_percent numeric(5,2) not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  started_at timestamptz,
  completed_at timestamptz,
  last_viewed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

create table if not exists public.lesson_responses (
  id uuid primary key default gen_random_uuid(),
  lesson_block_id uuid not null references public.lesson_blocks(id) on delete cascade,
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  response_text text,
  response_json jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_block_id, student_id)
);

create index if not exists idx_units_class_order on public.units(class_id, order_no);
create index if not exists idx_lessons_unit_order on public.lessons(unit_id, order_no);
create index if not exists idx_lesson_blocks_lesson_order on public.lesson_blocks(lesson_id, order_no);
create index if not exists idx_lesson_progress_student on public.lesson_progress(student_id, lesson_id);
create index if not exists idx_lesson_responses_student on public.lesson_responses(student_id, lesson_block_id);

-- Reuse the Phase 1 updated_at trigger function.
drop trigger if exists units_set_updated_at on public.units;
create trigger units_set_updated_at before update on public.units
for each row execute function public.set_updated_at();

drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at before update on public.lessons
for each row execute function public.set_updated_at();

drop trigger if exists lesson_blocks_set_updated_at on public.lesson_blocks;
create trigger lesson_blocks_set_updated_at before update on public.lesson_blocks
for each row execute function public.set_updated_at();

drop trigger if exists lesson_progress_set_updated_at on public.lesson_progress;
create trigger lesson_progress_set_updated_at before update on public.lesson_progress
for each row execute function public.set_updated_at();

drop trigger if exists lesson_responses_set_updated_at on public.lesson_responses;
create trigger lesson_responses_set_updated_at before update on public.lesson_responses
for each row execute function public.set_updated_at();

-- Authorization helper functions.
create or replace function public.is_teacher_of_unit(target_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.units u
    join public.classes c on c.id = u.class_id
    where u.id = target_unit_id
      and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_teacher_of_lesson(target_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lessons l
    join public.units u on u.id = l.unit_id
    join public.classes c on c.id = u.class_id
    where l.id = target_lesson_id
      and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_teacher_of_block(target_block_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lesson_blocks b
    join public.lessons l on l.id = b.lesson_id
    join public.units u on u.id = l.unit_id
    join public.classes c on c.id = u.class_id
    where b.id = target_block_id
      and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.can_access_unit(target_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.units u
    join public.classes c on c.id = u.class_id
    where u.id = target_unit_id
      and (
        c.teacher_id = auth.uid()
        or public.is_admin()
        or (
          public.is_enrolled_in_class(u.class_id)
          and u.status = 'published'
          and (u.publish_at is null or u.publish_at <= now())
        )
      )
  );
$$;

create or replace function public.can_access_lesson(target_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lessons l
    join public.units u on u.id = l.unit_id
    join public.classes c on c.id = u.class_id
    where l.id = target_lesson_id
      and (
        c.teacher_id = auth.uid()
        or public.is_admin()
        or (
          public.is_enrolled_in_class(u.class_id)
          and u.status = 'published'
          and l.status = 'published'
          and (u.publish_at is null or u.publish_at <= now())
          and (l.publish_at is null or l.publish_at <= now())
        )
      )
  );
$$;

create or replace function public.can_student_view_teacher(target_teacher_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes c
    join public.enrollments e on e.class_id = c.id
    where c.teacher_id = target_teacher_id
      and e.student_id = auth.uid()
      and e.status = 'active'
  );
$$;

revoke all on function public.is_teacher_of_unit(uuid) from public;
revoke all on function public.is_teacher_of_lesson(uuid) from public;
revoke all on function public.is_teacher_of_block(uuid) from public;
revoke all on function public.can_access_unit(uuid) from public;
revoke all on function public.can_access_lesson(uuid) from public;
revoke all on function public.can_student_view_teacher(uuid) from public;

grant execute on function public.is_teacher_of_unit(uuid) to authenticated;
grant execute on function public.is_teacher_of_lesson(uuid) to authenticated;
grant execute on function public.is_teacher_of_block(uuid) to authenticated;
grant execute on function public.can_access_unit(uuid) to authenticated;
grant execute on function public.can_access_lesson(uuid) to authenticated;
grant execute on function public.can_student_view_teacher(uuid) to authenticated;

alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_blocks enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.lesson_responses enable row level security;

-- Students can see the teacher profile of courses in which they are enrolled.
drop policy if exists "profiles_select_enrolled_teacher" on public.profiles;
create policy "profiles_select_enrolled_teacher"
on public.profiles for select to authenticated
using (role = 'teacher' and public.can_student_view_teacher(id));

drop policy if exists "teacher_profiles_select_enrolled_teacher" on public.teacher_profiles;
create policy "teacher_profiles_select_enrolled_teacher"
on public.teacher_profiles for select to authenticated
using (public.can_student_view_teacher(user_id));

-- Units
drop policy if exists "units_select_accessible" on public.units;
create policy "units_select_accessible"
on public.units for select to authenticated
using (public.can_access_unit(id));

drop policy if exists "units_teacher_insert" on public.units;
create policy "units_teacher_insert"
on public.units for insert to authenticated
with check (public.is_teacher_of_class(class_id) or public.is_admin());

drop policy if exists "units_teacher_update" on public.units;
create policy "units_teacher_update"
on public.units for update to authenticated
using (public.is_teacher_of_class(class_id) or public.is_admin())
with check (public.is_teacher_of_class(class_id) or public.is_admin());

drop policy if exists "units_teacher_delete" on public.units;
create policy "units_teacher_delete"
on public.units for delete to authenticated
using (public.is_teacher_of_class(class_id) or public.is_admin());

-- Lessons
drop policy if exists "lessons_select_accessible" on public.lessons;
create policy "lessons_select_accessible"
on public.lessons for select to authenticated
using (public.can_access_lesson(id));

drop policy if exists "lessons_teacher_insert" on public.lessons;
create policy "lessons_teacher_insert"
on public.lessons for insert to authenticated
with check (public.is_teacher_of_unit(unit_id) or public.is_admin());

drop policy if exists "lessons_teacher_update" on public.lessons;
create policy "lessons_teacher_update"
on public.lessons for update to authenticated
using (public.is_teacher_of_unit(unit_id) or public.is_admin())
with check (public.is_teacher_of_unit(unit_id) or public.is_admin());

drop policy if exists "lessons_teacher_delete" on public.lessons;
create policy "lessons_teacher_delete"
on public.lessons for delete to authenticated
using (public.is_teacher_of_unit(unit_id) or public.is_admin());

-- Lesson blocks
drop policy if exists "lesson_blocks_select_accessible" on public.lesson_blocks;
create policy "lesson_blocks_select_accessible"
on public.lesson_blocks for select to authenticated
using (public.can_access_lesson(lesson_id));

drop policy if exists "lesson_blocks_teacher_insert" on public.lesson_blocks;
create policy "lesson_blocks_teacher_insert"
on public.lesson_blocks for insert to authenticated
with check (public.is_teacher_of_lesson(lesson_id) or public.is_admin());

drop policy if exists "lesson_blocks_teacher_update" on public.lesson_blocks;
create policy "lesson_blocks_teacher_update"
on public.lesson_blocks for update to authenticated
using (public.is_teacher_of_lesson(lesson_id) or public.is_admin())
with check (public.is_teacher_of_lesson(lesson_id) or public.is_admin());

drop policy if exists "lesson_blocks_teacher_delete" on public.lesson_blocks;
create policy "lesson_blocks_teacher_delete"
on public.lesson_blocks for delete to authenticated
using (public.is_teacher_of_lesson(lesson_id) or public.is_admin());

-- Lesson progress
drop policy if exists "lesson_progress_select_accessible" on public.lesson_progress;
create policy "lesson_progress_select_accessible"
on public.lesson_progress for select to authenticated
using (
  student_id = auth.uid()
  or public.is_teacher_of_lesson(lesson_id)
  or public.is_admin()
);

drop policy if exists "lesson_progress_student_insert" on public.lesson_progress;
create policy "lesson_progress_student_insert"
on public.lesson_progress for insert to authenticated
with check (student_id = auth.uid() and public.can_access_lesson(lesson_id));

drop policy if exists "lesson_progress_student_update" on public.lesson_progress;
create policy "lesson_progress_student_update"
on public.lesson_progress for update to authenticated
using (student_id = auth.uid() or public.is_admin())
with check (student_id = auth.uid() or public.is_admin());

-- Lesson responses
drop policy if exists "lesson_responses_select_accessible" on public.lesson_responses;
create policy "lesson_responses_select_accessible"
on public.lesson_responses for select to authenticated
using (
  student_id = auth.uid()
  or public.is_teacher_of_block(lesson_block_id)
  or public.is_admin()
);

drop policy if exists "lesson_responses_student_insert" on public.lesson_responses;
create policy "lesson_responses_student_insert"
on public.lesson_responses for insert to authenticated
with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.lesson_blocks b
    where b.id = lesson_block_id
      and b.block_type = 'activity'
      and public.can_access_lesson(b.lesson_id)
  )
);

drop policy if exists "lesson_responses_student_update" on public.lesson_responses;
create policy "lesson_responses_student_update"
on public.lesson_responses for update to authenticated
using (student_id = auth.uid() or public.is_admin())
with check (student_id = auth.uid() or public.is_admin());

revoke all on public.units from anon, authenticated;
revoke all on public.lessons from anon, authenticated;
revoke all on public.lesson_blocks from anon, authenticated;
revoke all on public.lesson_progress from anon, authenticated;
revoke all on public.lesson_responses from anon, authenticated;

grant select, insert, update, delete on public.units to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.lesson_blocks to authenticated;
grant select, insert, update on public.lesson_progress to authenticated;
grant select, insert, update on public.lesson_responses to authenticated;

-- Private course content bucket. Path format: teacher-id/class-id/filename.
insert into storage.buckets (id, name, public, file_size_limit)
values ('course-content', 'course-content', false, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "course_content_select_authorized" on storage.objects;
create policy "course_content_select_authorized"
on storage.objects for select to authenticated
using (
  bucket_id = 'course-content'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_admin()
    or (
      cardinality(storage.foldername(name)) >= 2
      and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and public.is_enrolled_in_class(((storage.foldername(name))[2])::uuid)
    )
  )
);

drop policy if exists "course_content_teacher_insert" on storage.objects;
create policy "course_content_teacher_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'course-content'
  and cardinality(storage.foldername(name)) >= 2
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.is_teacher_of_class(((storage.foldername(name))[2])::uuid)
);

drop policy if exists "course_content_teacher_update" on storage.objects;
create policy "course_content_teacher_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'course-content'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
)
with check (
  bucket_id = 'course-content'
  and (
    public.is_admin()
    or (
      cardinality(storage.foldername(name)) >= 2
      and (storage.foldername(name))[1] = (select auth.uid())::text
      and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and public.is_teacher_of_class(((storage.foldername(name))[2])::uuid)
    )
  )
);

drop policy if exists "course_content_teacher_delete" on storage.objects;
create policy "course_content_teacher_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'course-content'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
);

commit;
