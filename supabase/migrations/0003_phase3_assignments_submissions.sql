-- TK Mooc Phase 3: Assignments and Submissions
-- Run AFTER 0001_phase1_foundation.sql and 0002_phase2_classes_lessons.sql.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'assignment_work_type') then
    create type public.assignment_work_type as enum ('individual', 'group');
  end if;
  if not exists (select 1 from pg_type where typname = 'assignment_status') then
    create type public.assignment_status as enum ('draft', 'published', 'closed', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'assignment_target_mode') then
    create type public.assignment_target_mode as enum ('class', 'students', 'group');
  end if;
  if not exists (select 1 from pg_type where typname = 'submission_status') then
    create type public.submission_status as enum ('draft', 'submitted', 'late', 'revision_required', 'graded', 'passed', 'failed', 'withdrawn');
  end if;
  if not exists (select 1 from pg_type where typname = 'submission_member_role') then
    create type public.submission_member_role as enum ('owner', 'member');
  end if;
end $$;

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  instructions text,
  work_type public.assignment_work_type not null default 'individual',
  max_score numeric(8,2) not null default 10 check (max_score > 0),
  passing_score numeric(8,2) check (passing_score is null or passing_score >= 0),
  publish_at timestamptz,
  due_at timestamptz,
  allow_late boolean not null default true,
  allow_resubmit boolean not null default true,
  target_mode public.assignment_target_mode not null default 'class',
  target_group_name text,
  allowed_submission_types text[] not null default array['text','file','link']::text[],
  status public.assignment_status not null default 'draft',
  rubric_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignments_passing_score_check check (passing_score is null or passing_score <= max_score),
  constraint assignments_group_target_check check (target_mode <> 'group' or nullif(trim(target_group_name), '') is not null)
);

create table if not exists public.assignment_targets (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid references public.student_profiles(user_id) on delete cascade,
  group_name text,
  created_at timestamptz not null default now(),
  constraint assignment_targets_exactly_one check (
    (student_id is not null and group_name is null)
    or (student_id is null and nullif(trim(group_name), '') is not null)
  )
);

create unique index if not exists assignment_targets_student_unique
  on public.assignment_targets(assignment_id, student_id)
  where student_id is not null;
create unique index if not exists assignment_targets_group_unique
  on public.assignment_targets(assignment_id, group_name)
  where group_name is not null;

create table if not exists public.assignment_attachments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  storage_path text,
  external_url text,
  file_name text,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  created_at timestamptz not null default now(),
  constraint assignment_attachments_source_check check (
    nullif(trim(storage_path), '') is not null or nullif(trim(external_url), '') is not null
  )
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  submitted_by uuid not null references public.student_profiles(user_id) on delete cascade,
  group_name text,
  answer_text text,
  link_url text,
  status public.submission_status not null default 'draft',
  submitted_at timestamptz,
  withdrawn_at timestamptz,
  revision_count integer not null default 0 check (revision_count >= 0),
  score numeric(8,2) check (score is null or score >= 0),
  teacher_feedback text,
  rubric_scores jsonb not null default '[]'::jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid references public.teacher_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, submitted_by)
);

create table if not exists public.submission_members (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  member_role public.submission_member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (submission_id, student_id)
);

create table if not exists public.submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  uploaded_by uuid not null references public.student_profiles(user_id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_assignments_class_due on public.assignments(class_id, due_at);
create index if not exists idx_assignments_publish_status on public.assignments(status, publish_at);
create index if not exists idx_assignment_targets_assignment on public.assignment_targets(assignment_id);
create index if not exists idx_assignment_attachments_assignment on public.assignment_attachments(assignment_id);
create unique index if not exists submissions_group_unique
  on public.submissions(assignment_id, group_name)
  where group_name is not null;
create index if not exists idx_submissions_assignment_status on public.submissions(assignment_id, status);
create index if not exists idx_submissions_student on public.submissions(submitted_by, assignment_id);
create index if not exists idx_submission_members_student on public.submission_members(student_id, submission_id);
create index if not exists idx_submission_files_submission on public.submission_files(submission_id);

drop trigger if exists assignments_set_updated_at on public.assignments;
create trigger assignments_set_updated_at before update on public.assignments
for each row execute function public.set_updated_at();

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at before update on public.submissions
for each row execute function public.set_updated_at();

create or replace function public.is_teacher_of_assignment(target_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assignments a
    join public.classes c on c.id = a.class_id
    where a.id = target_assignment_id
      and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_student_targeted_for_assignment(target_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assignments a
    join public.enrollments e
      on e.class_id = a.class_id
     and e.student_id = auth.uid()
     and e.status = 'active'
    where a.id = target_assignment_id
      and a.status in ('published','closed')
      and (a.publish_at is null or a.publish_at <= now())
      and (
        a.target_mode = 'class'
        or (
          a.target_mode = 'students'
          and exists (
            select 1 from public.assignment_targets t
            where t.assignment_id = a.id and t.student_id = auth.uid()
          )
        )
        or (
          a.target_mode = 'group'
          and e.group_name is not null
          and e.group_name = a.target_group_name
        )
      )
  );
$$;

create or replace function public.is_group_peer(target_class_id uuid, target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments me
    join public.enrollments peer
      on peer.class_id = me.class_id
     and peer.group_name = me.group_name
     and peer.status = 'active'
    where me.class_id = target_class_id
      and me.student_id = auth.uid()
      and me.status = 'active'
      and me.group_name is not null
      and peer.student_id = target_student_id
  );
$$;

create or replace function public.can_student_view_group_peer(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments me
    join public.enrollments peer
      on peer.class_id = me.class_id
     and peer.group_name = me.group_name
     and peer.status = 'active'
    where me.student_id = auth.uid()
      and me.status = 'active'
      and me.group_name is not null
      and peer.student_id = target_student_id
  );
$$;

create or replace function public.can_access_submission(target_submission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.submissions s
    where s.id = target_submission_id
      and (
        s.submitted_by = auth.uid()
        or public.is_teacher_of_assignment(s.assignment_id)
        or exists (
          select 1 from public.submission_members sm
          where sm.submission_id = s.id and sm.student_id = auth.uid()
        )
        or public.is_admin()
      )
  );
$$;

revoke all on function public.is_teacher_of_assignment(uuid) from public;
revoke all on function public.is_student_targeted_for_assignment(uuid) from public;
revoke all on function public.is_group_peer(uuid, uuid) from public;
revoke all on function public.can_student_view_group_peer(uuid) from public;
revoke all on function public.can_access_submission(uuid) from public;
grant execute on function public.is_teacher_of_assignment(uuid) to authenticated;
grant execute on function public.is_student_targeted_for_assignment(uuid) to authenticated;
grant execute on function public.is_group_peer(uuid, uuid) to authenticated;
grant execute on function public.can_student_view_group_peer(uuid) to authenticated;
grant execute on function public.can_access_submission(uuid) to authenticated;

alter table public.assignments enable row level security;
alter table public.assignment_targets enable row level security;
alter table public.assignment_attachments enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_members enable row level security;
alter table public.submission_files enable row level security;

-- Group members can see the roster/profile of peers in the same active group.
create policy "students read group peer enrollments" on public.enrollments
for select to authenticated using (public.is_group_peer(class_id, student_id));
create policy "students read group peer profiles" on public.student_profiles
for select to authenticated using (public.can_student_view_group_peer(user_id));

-- Assignments
create policy "teachers read own assignments" on public.assignments
for select to authenticated using (public.is_teacher_of_class(class_id) or public.is_admin());
create policy "students read targeted assignments" on public.assignments
for select to authenticated using (public.is_student_targeted_for_assignment(id));
create policy "teachers insert own assignments" on public.assignments
for insert to authenticated with check (public.is_teacher_of_class(class_id) or public.is_admin());
create policy "teachers update own assignments" on public.assignments
for update to authenticated using (public.is_teacher_of_class(class_id) or public.is_admin())
with check (public.is_teacher_of_class(class_id) or public.is_admin());
create policy "teachers delete own assignments" on public.assignments
for delete to authenticated using (public.is_teacher_of_class(class_id) or public.is_admin());

-- Targets
create policy "teachers read assignment targets" on public.assignment_targets
for select to authenticated using (public.is_teacher_of_assignment(assignment_id) or public.is_admin());
create policy "students read own assignment target" on public.assignment_targets
for select to authenticated using (student_id = auth.uid());
create policy "teachers insert assignment targets" on public.assignment_targets
for insert to authenticated with check (public.is_teacher_of_assignment(assignment_id) or public.is_admin());
create policy "teachers update assignment targets" on public.assignment_targets
for update to authenticated using (public.is_teacher_of_assignment(assignment_id) or public.is_admin())
with check (public.is_teacher_of_assignment(assignment_id) or public.is_admin());
create policy "teachers delete assignment targets" on public.assignment_targets
for delete to authenticated using (public.is_teacher_of_assignment(assignment_id) or public.is_admin());

-- Teacher attachments
create policy "users read accessible assignment attachments" on public.assignment_attachments
for select to authenticated using (
  public.is_teacher_of_assignment(assignment_id)
  or public.is_student_targeted_for_assignment(assignment_id)
  or public.is_admin()
);
create policy "teachers insert assignment attachments" on public.assignment_attachments
for insert to authenticated with check (public.is_teacher_of_assignment(assignment_id) or public.is_admin());
create policy "teachers update assignment attachments" on public.assignment_attachments
for update to authenticated using (public.is_teacher_of_assignment(assignment_id) or public.is_admin())
with check (public.is_teacher_of_assignment(assignment_id) or public.is_admin());
create policy "teachers delete assignment attachments" on public.assignment_attachments
for delete to authenticated using (public.is_teacher_of_assignment(assignment_id) or public.is_admin());

-- Submissions
create policy "submission participants read submissions" on public.submissions
for select to authenticated using (public.can_access_submission(id));
create policy "students create own submissions" on public.submissions
for insert to authenticated with check (
  submitted_by = auth.uid()
  and public.is_student_targeted_for_assignment(assignment_id)
);
create policy "students update own submissions" on public.submissions
for update to authenticated using (submitted_by = auth.uid())
with check (submitted_by = auth.uid() and public.is_student_targeted_for_assignment(assignment_id));
create policy "teachers update class submissions" on public.submissions
for update to authenticated using (public.is_teacher_of_assignment(assignment_id) or public.is_admin())
with check (public.is_teacher_of_assignment(assignment_id) or public.is_admin());
create policy "students delete own draft submissions" on public.submissions
for delete to authenticated using (submitted_by = auth.uid() and status in ('draft','withdrawn'));

-- Submission members
create policy "submission participants read members" on public.submission_members
for select to authenticated using (public.can_access_submission(submission_id));
create policy "submission owner adds members" on public.submission_members
for insert to authenticated with check (
  exists (select 1 from public.submissions s where s.id = submission_id and s.submitted_by = auth.uid())
);
create policy "submission owner updates members" on public.submission_members
for update to authenticated using (
  exists (select 1 from public.submissions s where s.id = submission_id and s.submitted_by = auth.uid())
) with check (
  exists (select 1 from public.submissions s where s.id = submission_id and s.submitted_by = auth.uid())
);
create policy "submission owner deletes members" on public.submission_members
for delete to authenticated using (
  exists (select 1 from public.submissions s where s.id = submission_id and s.submitted_by = auth.uid())
);

-- Submission files
create policy "submission participants read files" on public.submission_files
for select to authenticated using (public.can_access_submission(submission_id));
create policy "students insert own submission files" on public.submission_files
for insert to authenticated with check (
  uploaded_by = auth.uid()
  and exists (select 1 from public.submissions s where s.id = submission_id and s.submitted_by = auth.uid())
);
create policy "students update own submission files" on public.submission_files
for update to authenticated using (uploaded_by = auth.uid()) with check (uploaded_by = auth.uid());
create policy "students delete own submission files" on public.submission_files
for delete to authenticated using (uploaded_by = auth.uid());

-- Storage buckets.
insert into storage.buckets (id, name, public, file_size_limit)
values ('assignment-files', 'assignment-files', false, 31457280)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

insert into storage.buckets (id, name, public, file_size_limit)
values ('submission-files', 'submission-files', false, 104857600)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

-- assignment-files path: teacherId/classId/assignmentId/file
create policy "teachers upload assignment files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'assignment-files'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_teacher_of_assignment(((storage.foldername(name))[3])::uuid)
);
create policy "users read accessible assignment files" on storage.objects
for select to authenticated using (
  bucket_id = 'assignment-files'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_teacher_of_assignment(((storage.foldername(name))[3])::uuid)
    or public.is_student_targeted_for_assignment(((storage.foldername(name))[3])::uuid)
    or public.is_admin()
  )
);
create policy "teachers update assignment files" on storage.objects
for update to authenticated using (
  bucket_id = 'assignment-files' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'assignment-files' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "teachers delete assignment files" on storage.objects
for delete to authenticated using (
  bucket_id = 'assignment-files' and (storage.foldername(name))[1] = auth.uid()::text
);

-- submission-files path: studentId/assignmentId/submissionId/file
create policy "students upload submission files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'submission-files'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_student_targeted_for_assignment(((storage.foldername(name))[2])::uuid)
  and public.can_access_submission(((storage.foldername(name))[3])::uuid)
);
create policy "participants read submission files" on storage.objects
for select to authenticated using (
  bucket_id = 'submission-files'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_teacher_of_assignment(((storage.foldername(name))[2])::uuid)
    or public.can_access_submission(((storage.foldername(name))[3])::uuid)
    or public.is_admin()
  )
);
create policy "students update own submission objects" on storage.objects
for update to authenticated using (
  bucket_id = 'submission-files' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'submission-files' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "students delete own submission objects" on storage.objects
for delete to authenticated using (
  bucket_id = 'submission-files' and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
