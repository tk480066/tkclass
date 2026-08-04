-- TK Mooc Phase 4: Quizzes and Online Tests
-- Run AFTER 0001, 0002 and corrected 0003 migrations.
-- Safe to rerun: policies and triggers are dropped before recreation.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'quiz_status') then
    create type public.quiz_status as enum ('draft', 'published', 'closed', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'quiz_question_type') then
    create type public.quiz_question_type as enum ('single_choice', 'multiple_choice', 'true_false', 'short_answer', 'essay');
  end if;
  if not exists (select 1 from pg_type where typname = 'quiz_attempt_status') then
    create type public.quiz_attempt_status as enum ('in_progress', 'submitted', 'graded', 'expired');
  end if;
end $$;

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null,
  instructions text,
  status public.quiz_status not null default 'draft',
  open_at timestamptz,
  close_at timestamptz,
  time_limit_minutes integer,
  max_attempts integer not null default 1,
  passing_percent numeric(5,2) not null default 50,
  shuffle_questions boolean not null default false,
  shuffle_options boolean not null default false,
  show_score_after_submit boolean not null default true,
  show_correct_answers boolean not null default false,
  total_points numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quizzes_time_limit_check check (time_limit_minutes is null or time_limit_minutes between 1 and 600),
  constraint quizzes_max_attempts_check check (max_attempts between 1 and 20),
  constraint quizzes_passing_percent_check check (passing_percent between 0 and 100),
  constraint quizzes_schedule_check check (close_at is null or open_at is null or close_at > open_at),
  constraint quizzes_total_points_check check (total_points >= 0)
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_type public.quiz_question_type not null,
  prompt text not null,
  explanation text,
  points numeric(8,2) not null default 1,
  order_no integer not null default 1,
  is_required boolean not null default true,
  accepted_answers text[] not null default '{}'::text[],
  case_sensitive boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_questions_points_check check (points > 0),
  constraint quiz_questions_order_check check (order_no > 0)
);

create table if not exists public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  order_no integer not null default 1,
  created_at timestamptz not null default now(),
  constraint quiz_options_order_check check (order_no > 0),
  unique (question_id, order_no)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  attempt_no integer not null,
  status public.quiz_attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  submitted_at timestamptz,
  graded_at timestamptz,
  score numeric(10,2),
  max_score numeric(10,2) not null default 0,
  percent numeric(5,2),
  passed boolean,
  question_order uuid[] not null default '{}'::uuid[],
  option_order jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_attempts_attempt_no_check check (attempt_no > 0),
  constraint quiz_attempts_score_check check (score is null or score >= 0),
  constraint quiz_attempts_max_score_check check (max_score >= 0),
  constraint quiz_attempts_percent_check check (percent is null or percent between 0 and 100),
  unique (quiz_id, student_id, attempt_no)
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  answer_text text,
  selected_option_ids uuid[] not null default '{}'::uuid[],
  answer_json jsonb not null default '{}'::jsonb,
  is_correct boolean,
  awarded_score numeric(8,2),
  teacher_feedback text,
  graded_at timestamptz,
  graded_by uuid references public.teacher_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_answers_score_check check (awarded_score is null or awarded_score >= 0),
  unique (attempt_id, question_id)
);

create index if not exists idx_quizzes_class_status on public.quizzes(class_id, status, open_at, close_at);
create index if not exists idx_quiz_questions_quiz_order on public.quiz_questions(quiz_id, order_no);
create index if not exists idx_quiz_options_question_order on public.quiz_options(question_id, order_no);
create index if not exists idx_quiz_attempts_student_quiz on public.quiz_attempts(student_id, quiz_id, attempt_no desc);
create index if not exists idx_quiz_attempts_quiz_status on public.quiz_attempts(quiz_id, status);
create index if not exists idx_quiz_answers_attempt on public.quiz_answers(attempt_id);

-- Shared updated_at trigger.
drop trigger if exists quizzes_set_updated_at on public.quizzes;
create trigger quizzes_set_updated_at before update on public.quizzes
for each row execute function public.set_updated_at();

drop trigger if exists quiz_questions_set_updated_at on public.quiz_questions;
create trigger quiz_questions_set_updated_at before update on public.quiz_questions
for each row execute function public.set_updated_at();

drop trigger if exists quiz_attempts_set_updated_at on public.quiz_attempts;
create trigger quiz_attempts_set_updated_at before update on public.quiz_attempts
for each row execute function public.set_updated_at();

drop trigger if exists quiz_answers_set_updated_at on public.quiz_answers;
create trigger quiz_answers_set_updated_at before update on public.quiz_answers
for each row execute function public.set_updated_at();

-- Prevent students from forging grading fields while still allowing answer drafts.
create or replace function public.protect_quiz_answer_grading_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select student_id into owner_id
  from public.quiz_attempts where id = new.attempt_id;
  if current_user = 'authenticated' and auth.uid() = owner_id then
    if tg_op = 'INSERT' then
      new.is_correct := null;
      new.awarded_score := null;
      new.teacher_feedback := null;
      new.graded_at := null;
      new.graded_by := null;
    else
      new.is_correct := old.is_correct;
      new.awarded_score := old.awarded_score;
      new.teacher_feedback := old.teacher_feedback;
      new.graded_at := old.graded_at;
      new.graded_by := old.graded_by;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists quiz_answers_protect_grading on public.quiz_answers;
create trigger quiz_answers_protect_grading before insert or update on public.quiz_answers
for each row execute function public.protect_quiz_answer_grading_fields();

create or replace function public.refresh_quiz_total_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_quiz_id uuid;
begin
  if tg_op = 'DELETE' then
    target_quiz_id := old.quiz_id;
  else
    target_quiz_id := new.quiz_id;
  end if;
  update public.quizzes q
  set total_points = coalesce((select sum(points) from public.quiz_questions where quiz_id = target_quiz_id), 0)
  where q.id = target_quiz_id;
  return null;
end;
$$;

drop trigger if exists quiz_questions_refresh_total on public.quiz_questions;
create trigger quiz_questions_refresh_total
after insert or update or delete on public.quiz_questions
for each row execute function public.refresh_quiz_total_points();

create or replace function public.is_teacher_of_quiz(target_quiz_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quizzes q
    join public.classes c on c.id = q.class_id
    where q.id = target_quiz_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.can_student_access_quiz(target_quiz_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quizzes q
    where q.id = target_quiz_id
      and q.status in ('published', 'closed')
      and public.is_enrolled_in_class(q.class_id)
  );
$$;

create or replace function public.can_access_quiz_attempt(target_attempt_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quiz_attempts a
    where a.id = target_attempt_id
      and (
        a.student_id = auth.uid()
        or public.is_teacher_of_quiz(a.quiz_id)
        or public.is_admin()
      )
  );
$$;

create or replace function public.is_own_active_quiz_attempt(target_attempt_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quiz_attempts a
    where a.id = target_attempt_id
      and a.student_id = auth.uid()
      and a.status = 'in_progress'
  );
$$;

-- Returns only the current student's attempts and masks result fields when the teacher hides scores.
create or replace function public.get_my_quiz_attempts(target_quiz_ids uuid[])
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select coalesce(jsonb_agg(
    to_jsonb(a) || jsonb_build_object(
      'score', case when q.show_score_after_submit then a.score else null end,
      'percent', case when q.show_score_after_submit then a.percent else null end,
      'passed', case when q.show_score_after_submit then a.passed else null end
    ) order by a.started_at desc
  ), '[]'::jsonb)
  into payload
  from public.quiz_attempts a
  join public.quizzes q on q.id = a.quiz_id
  where a.student_id = auth.uid()
    and a.quiz_id = any(coalesce(target_quiz_ids, '{}'::uuid[]));
  return payload;
end;
$$;

-- Student-safe result payload. Score and grading fields are masked when score display is disabled.
create or replace function public.get_quiz_attempt_result(target_attempt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_attempt public.quiz_attempts%rowtype;
  target_quiz public.quizzes%rowtype;
  payload jsonb;
begin
  select * into target_attempt from public.quiz_attempts
  where id = target_attempt_id and student_id = auth.uid();
  if not found then raise exception 'Access denied'; end if;
  if target_attempt.status = 'in_progress' then raise exception 'Attempt has not been submitted'; end if;
  select * into target_quiz from public.quizzes where id = target_attempt.quiz_id;

  select jsonb_build_object(
    'attempt', to_jsonb(target_attempt) || jsonb_build_object(
      'score', case when target_quiz.show_score_after_submit then target_attempt.score else null end,
      'percent', case when target_quiz.show_score_after_submit then target_attempt.percent else null end,
      'passed', case when target_quiz.show_score_after_submit then target_attempt.passed else null end
    ),
    'quiz', to_jsonb(target_quiz),
    'answers', coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id,
      'attempt_id', a.attempt_id,
      'question_id', a.question_id,
      'answer_text', a.answer_text,
      'selected_option_ids', a.selected_option_ids,
      'answer_json', a.answer_json,
      'is_correct', case when target_quiz.show_score_after_submit then a.is_correct else null end,
      'awarded_score', case when target_quiz.show_score_after_submit then a.awarded_score else null end,
      'teacher_feedback', case when target_quiz.show_score_after_submit then a.teacher_feedback else null end,
      'graded_at', case when target_quiz.show_score_after_submit then a.graded_at else null end,
      'graded_by', null,
      'created_at', a.created_at,
      'updated_at', a.updated_at
    ) order by a.created_at), '[]'::jsonb),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.id,
        'question_type', q.question_type,
        'prompt', q.prompt,
        'points', q.points,
        'order_no', q.order_no,
        'explanation', case when target_quiz.show_correct_answers then q.explanation else null end,
        'accepted_answers', case when target_quiz.show_correct_answers then q.accepted_answers else '{}'::text[] end,
        'options', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', o.id,
            'option_text', o.option_text,
            'order_no', o.order_no,
            'is_correct', case when target_quiz.show_correct_answers then o.is_correct else null end
          ) order by o.order_no)
          from public.quiz_options o where o.question_id = q.id
        ), '[]'::jsonb)
      ) order by q.order_no)
      from public.quiz_questions q where q.quiz_id = target_attempt.quiz_id
    ), '[]'::jsonb)
  ) into payload
  from public.quiz_answers a
  where a.attempt_id = target_attempt_id;

  return payload;
end;
$$;

create or replace function public.get_quiz_question_count(target_quiz_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.can_student_access_quiz(target_quiz_id) or public.is_teacher_of_quiz(target_quiz_id) or public.is_admin()) then
    raise exception 'Access denied';
  end if;
  return (select count(*)::integer from public.quiz_questions where quiz_id = target_quiz_id);
end;
$$;

create or replace function public.start_quiz_attempt(target_quiz_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_quiz public.quizzes%rowtype;
  current_attempt uuid;
  next_attempt_no integer;
  question_ids uuid[];
  qid uuid;
  option_ids uuid[];
  option_map jsonb := '{}'::jsonb;
  created_attempt uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into target_quiz from public.quizzes where id = target_quiz_id;
  if not found or not public.can_student_access_quiz(target_quiz_id) then
    raise exception 'Quiz is not available';
  end if;
  if target_quiz.status <> 'published' then raise exception 'Quiz is closed'; end if;
  if target_quiz.open_at is not null and target_quiz.open_at > now() then raise exception 'Quiz is not open yet'; end if;
  if target_quiz.close_at is not null and target_quiz.close_at <= now() then raise exception 'Quiz is closed'; end if;

  select id into current_attempt
  from public.quiz_attempts
  where quiz_id = target_quiz_id and student_id = auth.uid() and status = 'in_progress'
  order by attempt_no desc limit 1;
  if current_attempt is not null then return current_attempt; end if;

  select coalesce(max(attempt_no), 0) + 1 into next_attempt_no
  from public.quiz_attempts where quiz_id = target_quiz_id and student_id = auth.uid();
  if next_attempt_no > target_quiz.max_attempts then raise exception 'Maximum attempts reached'; end if;

  if target_quiz.shuffle_questions then
    select coalesce(array_agg(id order by random()), '{}'::uuid[]) into question_ids
    from public.quiz_questions where quiz_id = target_quiz_id;
  else
    select coalesce(array_agg(id order by order_no, created_at), '{}'::uuid[]) into question_ids
    from public.quiz_questions where quiz_id = target_quiz_id;
  end if;
  if coalesce(array_length(question_ids, 1), 0) = 0 then raise exception 'Quiz has no questions'; end if;

  foreach qid in array question_ids loop
    if target_quiz.shuffle_options then
      select coalesce(array_agg(id order by random()), '{}'::uuid[]) into option_ids
      from public.quiz_options where quiz_options.question_id = qid;
    else
      select coalesce(array_agg(id order by order_no, created_at), '{}'::uuid[]) into option_ids
      from public.quiz_options where quiz_options.question_id = qid;
    end if;
    option_map := option_map || jsonb_build_object(qid::text, to_jsonb(option_ids));
  end loop;

  insert into public.quiz_attempts (
    quiz_id, student_id, attempt_no, status, expires_at, max_score, question_order, option_order
  ) values (
    target_quiz_id,
    auth.uid(),
    next_attempt_no,
    'in_progress',
    case when target_quiz.time_limit_minutes is null then null else now() + make_interval(mins => target_quiz.time_limit_minutes) end,
    target_quiz.total_points,
    question_ids,
    option_map
  ) returning id into created_attempt;

  return created_attempt;
end;
$$;

-- Safe student payload: no accepted answers, explanations or correct-option flags.
create or replace function public.get_quiz_attempt_payload(target_attempt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_attempt public.quiz_attempts%rowtype;
  target_quiz public.quizzes%rowtype;
  payload jsonb;
begin
  if not public.can_access_quiz_attempt(target_attempt_id) then raise exception 'Access denied'; end if;
  select * into target_attempt from public.quiz_attempts where id = target_attempt_id;
  select * into target_quiz from public.quizzes where id = target_attempt.quiz_id;

  select jsonb_build_object(
    'attempt', to_jsonb(target_attempt),
    'quiz', jsonb_build_object(
      'id', target_quiz.id, 'title', target_quiz.title, 'instructions', target_quiz.instructions,
      'time_limit_minutes', target_quiz.time_limit_minutes, 'total_points', target_quiz.total_points,
      'show_score_after_submit', target_quiz.show_score_after_submit,
      'show_correct_answers', target_quiz.show_correct_answers
    ),
    'questions', coalesce(jsonb_agg(question_payload order by question_position), '[]'::jsonb)
  ) into payload
  from (
    select
      array_position(target_attempt.question_order, q.id) as question_position,
      jsonb_build_object(
        'id', q.id,
        'question_type', q.question_type,
        'prompt', q.prompt,
        'points', q.points,
        'order_no', q.order_no,
        'is_required', q.is_required,
        'options', coalesce((
          select jsonb_agg(jsonb_build_object('id', o.id, 'option_text', o.option_text, 'order_no', o.order_no)
            order by coalesce((
              select ordered.ord
              from jsonb_array_elements_text(coalesce(target_attempt.option_order -> q.id::text, '[]'::jsonb))
                with ordinality as ordered(value, ord)
              where ordered.value::uuid = o.id
            ), o.order_no::bigint))
          from public.quiz_options o where o.question_id = q.id
        ), '[]'::jsonb),
        'answer', coalesce((
          select jsonb_build_object(
            'answer_text', a.answer_text,
            'selected_option_ids', a.selected_option_ids,
            'answer_json', a.answer_json
          ) from public.quiz_answers a
          where a.attempt_id = target_attempt.id and a.question_id = q.id
        ), '{}'::jsonb)
      ) as question_payload
    from public.quiz_questions q
    where q.quiz_id = target_attempt.quiz_id
      and q.id = any(target_attempt.question_order)
  ) rows;
  return payload;
end;
$$;

create or replace function public.submit_quiz_attempt(target_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_attempt public.quiz_attempts%rowtype;
  target_quiz public.quizzes%rowtype;
  question_row public.quiz_questions%rowtype;
  answer_row public.quiz_answers%rowtype;
  correct_ids uuid[];
  normalized_answer text;
  accepted text;
  answer_is_correct boolean;
  auto_score numeric(10,2) := 0;
  has_manual boolean := false;
  final_percent numeric(5,2);
  final_status public.quiz_attempt_status;
begin
  select * into target_attempt from public.quiz_attempts where id = target_attempt_id;
  if not found or target_attempt.student_id <> auth.uid() then raise exception 'Access denied'; end if;
  if target_attempt.status <> 'in_progress' then raise exception 'Attempt has already been submitted'; end if;
  select * into target_quiz from public.quizzes where id = target_attempt.quiz_id;

  if (target_attempt.expires_at is null or target_attempt.expires_at > now()) and exists (
    select 1
    from public.quiz_questions q
    left join public.quiz_answers a
      on a.question_id = q.id and a.attempt_id = target_attempt.id
    where q.id = any(target_attempt.question_order)
      and q.is_required
      and (
        a.id is null
        or (q.question_type in ('single_choice','multiple_choice','true_false') and coalesce(array_length(a.selected_option_ids, 1), 0) = 0)
        or (q.question_type in ('short_answer','essay') and nullif(trim(a.answer_text), '') is null)
      )
  ) then
    raise exception 'Please answer every required question';
  end if;

  for question_row in select * from public.quiz_questions where id = any(target_attempt.question_order) loop
    select * into answer_row from public.quiz_answers
      where attempt_id = target_attempt.id and question_id = question_row.id;

    answer_is_correct := false;
    if question_row.question_type in ('single_choice', 'true_false', 'multiple_choice') then
      select coalesce(array_agg(id order by id), '{}'::uuid[]) into correct_ids
      from public.quiz_options where question_id = question_row.id and is_correct;
      answer_is_correct := coalesce((select array_agg(x order by x) from unnest(coalesce(answer_row.selected_option_ids, '{}'::uuid[])) x), '{}'::uuid[]) = correct_ids;
    elsif question_row.question_type = 'short_answer' then
      normalized_answer := coalesce(trim(answer_row.answer_text), '');
      foreach accepted in array question_row.accepted_answers loop
        if question_row.case_sensitive then
          answer_is_correct := normalized_answer = trim(accepted);
        else
          answer_is_correct := lower(normalized_answer) = lower(trim(accepted));
        end if;
        exit when answer_is_correct;
      end loop;
    elsif question_row.question_type = 'essay' then
      if answer_row.id is not null and nullif(trim(answer_row.answer_text), '') is not null then
        has_manual := true;
        update public.quiz_answers set is_correct = null, awarded_score = null, graded_at = null
        where attempt_id = target_attempt.id and question_id = question_row.id;
      end if;
      continue;
    end if;

    if answer_row.id is not null then
      update public.quiz_answers set
        is_correct = answer_is_correct,
        awarded_score = case when answer_is_correct then question_row.points else 0 end,
        graded_at = now()
      where id = answer_row.id;
    end if;
    if answer_is_correct then auto_score := auto_score + question_row.points; end if;
  end loop;

  final_percent := case when target_attempt.max_score > 0 then round((auto_score / target_attempt.max_score) * 100, 2) else 0 end;
  final_status := case when has_manual then 'submitted'::public.quiz_attempt_status else 'graded'::public.quiz_attempt_status end;

  update public.quiz_attempts set
    status = final_status,
    submitted_at = now(),
    graded_at = case when has_manual then null else now() end,
    score = auto_score,
    percent = final_percent,
    passed = case when has_manual then null else final_percent >= target_quiz.passing_percent end
  where id = target_attempt_id;

  return jsonb_build_object('attempt_id', target_attempt_id, 'status', final_status, 'score', auto_score, 'percent', final_percent);
end;
$$;

create or replace function public.recalculate_quiz_attempt(target_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_attempt public.quiz_attempts%rowtype;
  target_quiz public.quizzes%rowtype;
  final_score numeric(10,2);
  final_percent numeric(5,2);
  pending_manual integer;
begin
  select * into target_attempt from public.quiz_attempts where id = target_attempt_id;
  if not found or not (public.is_teacher_of_quiz(target_attempt.quiz_id) or public.is_admin()) then raise exception 'Access denied'; end if;
  select * into target_quiz from public.quizzes where id = target_attempt.quiz_id;
  select coalesce(sum(coalesce(a.awarded_score, 0)), 0),
         count(*) filter (where q.question_type = 'essay' and a.id is not null and a.awarded_score is null)
    into final_score, pending_manual
  from public.quiz_questions q
  left join public.quiz_answers a on a.question_id = q.id and a.attempt_id = target_attempt_id
  where q.quiz_id = target_attempt.quiz_id;
  final_percent := case when target_attempt.max_score > 0 then round((final_score / target_attempt.max_score) * 100, 2) else 0 end;
  update public.quiz_attempts set
    status = case when pending_manual > 0 then 'submitted'::public.quiz_attempt_status else 'graded'::public.quiz_attempt_status end,
    score = final_score, percent = final_percent,
    passed = case when pending_manual > 0 then null else final_percent >= target_quiz.passing_percent end,
    graded_at = case when pending_manual > 0 then null else now() end
  where id = target_attempt_id;
end;
$$;

revoke all on function public.is_teacher_of_quiz(uuid) from public;
revoke all on function public.can_student_access_quiz(uuid) from public;
revoke all on function public.can_access_quiz_attempt(uuid) from public;
revoke all on function public.is_own_active_quiz_attempt(uuid) from public;
revoke all on function public.get_my_quiz_attempts(uuid[]) from public;
revoke all on function public.get_quiz_attempt_result(uuid) from public;
revoke all on function public.get_quiz_question_count(uuid) from public;
revoke all on function public.start_quiz_attempt(uuid) from public;
revoke all on function public.get_quiz_attempt_payload(uuid) from public;
revoke all on function public.submit_quiz_attempt(uuid) from public;
revoke all on function public.recalculate_quiz_attempt(uuid) from public;
grant execute on function public.is_teacher_of_quiz(uuid) to authenticated;
grant execute on function public.can_student_access_quiz(uuid) to authenticated;
grant execute on function public.can_access_quiz_attempt(uuid) to authenticated;
grant execute on function public.is_own_active_quiz_attempt(uuid) to authenticated;
grant execute on function public.get_my_quiz_attempts(uuid[]) to authenticated;
grant execute on function public.get_quiz_attempt_result(uuid) to authenticated;
grant execute on function public.get_quiz_question_count(uuid) to authenticated;
grant execute on function public.start_quiz_attempt(uuid) to authenticated;
grant execute on function public.get_quiz_attempt_payload(uuid) to authenticated;
grant execute on function public.submit_quiz_attempt(uuid) to authenticated;
grant execute on function public.recalculate_quiz_attempt(uuid) to authenticated;

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;

-- Quizzes
drop policy if exists "teachers manage own quizzes" on public.quizzes;
create policy "teachers manage own quizzes" on public.quizzes for all to authenticated
using (public.is_teacher_of_class(class_id) or public.is_admin())
with check (public.is_teacher_of_class(class_id) or public.is_admin());
drop policy if exists "students read available quizzes" on public.quizzes;
create policy "students read available quizzes" on public.quizzes for select to authenticated
using (public.can_student_access_quiz(id));

-- Correct answers are never selectable directly by students.
drop policy if exists "teachers manage quiz questions" on public.quiz_questions;
create policy "teachers manage quiz questions" on public.quiz_questions for all to authenticated
using (public.is_teacher_of_quiz(quiz_id) or public.is_admin())
with check (public.is_teacher_of_quiz(quiz_id) or public.is_admin());
drop policy if exists "teachers manage quiz options" on public.quiz_options;
create policy "teachers manage quiz options" on public.quiz_options for all to authenticated
using (public.is_teacher_of_quiz((select q.quiz_id from public.quiz_questions q where q.id = question_id)) or public.is_admin())
with check (public.is_teacher_of_quiz((select q.quiz_id from public.quiz_questions q where q.id = question_id)) or public.is_admin());

-- Attempts
drop policy if exists "authorized users read quiz attempts" on public.quiz_attempts;
drop policy if exists "teachers read quiz attempts" on public.quiz_attempts;
create policy "teachers read quiz attempts" on public.quiz_attempts for select to authenticated
using (public.is_teacher_of_quiz(quiz_id) or public.is_admin());
drop policy if exists "students update own active attempts" on public.quiz_attempts;
drop policy if exists "teachers update own quiz attempts" on public.quiz_attempts;
create policy "teachers update own quiz attempts" on public.quiz_attempts for update to authenticated
using (public.is_teacher_of_quiz(quiz_id) or public.is_admin())
with check (public.is_teacher_of_quiz(quiz_id) or public.is_admin());

-- Answers
drop policy if exists "authorized users read quiz answers" on public.quiz_answers;
drop policy if exists "teachers read quiz answers" on public.quiz_answers;
create policy "teachers read quiz answers" on public.quiz_answers for select to authenticated
using (
  exists (select 1 from public.quiz_attempts a where a.id = attempt_id and (public.is_teacher_of_quiz(a.quiz_id) or public.is_admin()))
);
drop policy if exists "students insert own quiz answers" on public.quiz_answers;
create policy "students insert own quiz answers" on public.quiz_answers for insert to authenticated
with check (
  public.is_own_active_quiz_attempt(attempt_id)
  and exists (select 1 from public.quiz_questions q join public.quiz_attempts a on a.quiz_id = q.quiz_id where q.id = question_id and a.id = attempt_id)
);
drop policy if exists "students update own quiz answers" on public.quiz_answers;
create policy "students update own quiz answers" on public.quiz_answers for update to authenticated
using (public.is_own_active_quiz_attempt(attempt_id))
with check (public.is_own_active_quiz_attempt(attempt_id));
drop policy if exists "teachers update quiz answers" on public.quiz_answers;
create policy "teachers update quiz answers" on public.quiz_answers for update to authenticated
using (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and (public.is_teacher_of_quiz(a.quiz_id) or public.is_admin())))
with check (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and (public.is_teacher_of_quiz(a.quiz_id) or public.is_admin())));

commit;
