-- TK Mooc Phase 6: Communication
-- Run AFTER 0001-0005 migrations in Supabase SQL Editor.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'announcement_status') then
    create type public.announcement_status as enum ('draft', 'published', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'communication_priority') then
    create type public.communication_priority as enum ('normal', 'important', 'urgent');
  end if;
  if not exists (select 1 from pg_type where typname = 'conversation_status') then
    create type public.conversation_status as enum ('active', 'closed', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'message_kind') then
    create type public.message_kind as enum ('text', 'system');
  end if;
end $$;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  body text not null,
  priority public.communication_priority not null default 'normal',
  status public.announcement_status not null default 'draft',
  publish_at timestamptz,
  expires_at timestamptz,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_schedule_check check (
    expires_at is null or publish_at is null or expires_at > publish_at
  )
);

create table if not exists public.announcement_attachments (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  storage_path text,
  external_url text,
  file_name text,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  constraint announcement_attachments_size_check check (file_size is null or file_size >= 0),
  constraint announcement_attachments_source_check check (
    nullif(trim(storage_path), '') is not null or nullif(trim(external_url), '') is not null
  )
);

create table if not exists public.announcement_reads (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  status public.conversation_status not null default 'active',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  is_muted boolean not null default false,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  message_kind public.message_kind not null default 'text',
  body text not null,
  reply_to_id uuid references public.messages(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_body_check check (length(trim(body)) > 0)
);

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  constraint message_attachments_size_check check (file_size is null or file_size >= 0)
);

create index if not exists idx_announcements_class_status on public.announcements(class_id, status, publish_at);
create index if not exists idx_announcements_pinned on public.announcements(class_id, is_pinned, updated_at desc);
create index if not exists idx_announcement_reads_user on public.announcement_reads(user_id, read_at desc);
create index if not exists idx_conversations_class_last on public.conversations(class_id, last_message_at desc);
create index if not exists idx_conversation_participants_user on public.conversation_participants(user_id, last_read_at);
create index if not exists idx_messages_conversation_created on public.messages(conversation_id, created_at);
create index if not exists idx_message_attachments_message on public.message_attachments(message_id);

-- Reuse the shared updated_at trigger.
drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at before update on public.announcements
for each row execute function public.set_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at before update on public.conversations
for each row execute function public.set_updated_at();

create or replace function public.is_teacher_of_announcement(target_announcement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.announcements a
    join public.classes c on c.id = a.class_id
    where a.id = target_announcement_id
      and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.can_access_announcement(target_announcement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.announcements a
    where a.id = target_announcement_id
      and (
        public.is_teacher_of_class(a.class_id)
        or public.is_admin()
        or (
          public.is_enrolled_in_class(a.class_id)
          and a.status = 'published'
          and (a.publish_at is null or a.publish_at <= now())
          and (a.expires_at is null or a.expires_at > now())
        )
      )
  );
$$;

create or replace function public.is_conversation_participant(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = target_conversation_id
      and cp.user_id = auth.uid()
  );
$$;

create or replace function public.can_access_message(target_message_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.messages m
    where m.id = target_message_id
      and (public.is_conversation_participant(m.conversation_id) or public.is_admin())
  );
$$;

create or replace function public.can_view_class_contact_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes c
    left join public.enrollments e on e.class_id = c.id and e.status = 'active'
    where (
      c.teacher_id = target_user_id and e.student_id = auth.uid()
    ) or (
      c.teacher_id = auth.uid() and e.student_id = target_user_id
    )
  ) or exists (
    select 1
    from public.conversation_participants mine
    join public.conversation_participants theirs
      on theirs.conversation_id = mine.conversation_id
    where mine.user_id = auth.uid()
      and theirs.user_id = target_user_id
  );
$$;

create or replace function public.create_class_conversation(
  target_class_id uuid,
  target_student_id uuid,
  conversation_subject text,
  initial_body text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.app_role;
  class_teacher_id uuid;
  conversation_id uuid;
begin
  if actor_id is null then
    raise exception 'กรุณาเข้าสู่ระบบ';
  end if;

  actor_role := public.current_user_role();
  select teacher_id into class_teacher_id
  from public.classes
  where id = target_class_id and status = 'active';

  if class_teacher_id is null then
    raise exception 'ไม่พบชั้นเรียนที่ใช้งานได้';
  end if;

  if not exists (
    select 1 from public.enrollments
    where class_id = target_class_id
      and student_id = target_student_id
      and status = 'active'
  ) then
    raise exception 'นักเรียนไม่ได้อยู่ในชั้นเรียนนี้';
  end if;

  if actor_role = 'teacher' then
    if class_teacher_id <> actor_id then
      raise exception 'ไม่มีสิทธิ์สร้างการสนทนาในชั้นเรียนนี้';
    end if;
  elsif actor_role = 'student' then
    if target_student_id <> actor_id then
      raise exception 'นักเรียนสร้างการสนทนาได้เฉพาะบัญชีของตนเอง';
    end if;
  elsif actor_role = 'admin' then
    null;
  else
    raise exception 'บทบาทผู้ใช้ไม่รองรับการสนทนา';
  end if;

  select c.id into conversation_id
  from public.conversations c
  where c.class_id = target_class_id
    and c.status = 'active'
    and exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = c.id and p.user_id = class_teacher_id
    )
    and exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = c.id and p.user_id = target_student_id
    )
    and (select count(*) from public.conversation_participants p where p.conversation_id = c.id) = 2
  order by c.last_message_at desc
  limit 1;

  if conversation_id is null then
    insert into public.conversations (class_id, subject, created_by)
    values (target_class_id, coalesce(nullif(trim(conversation_subject), ''), 'การสนทนาในชั้นเรียน'), actor_id)
    returning id into conversation_id;

    insert into public.conversation_participants (conversation_id, user_id, last_read_at)
    values
      (conversation_id, class_teacher_id, case when class_teacher_id = actor_id then now() else null end),
      (conversation_id, target_student_id, case when target_student_id = actor_id then now() else null end)
    on conflict do nothing;
  end if;

  if nullif(trim(initial_body), '') is not null then
    insert into public.messages (conversation_id, sender_id, body)
    values (conversation_id, actor_id, trim(initial_body));
  end if;

  return conversation_id;
end;
$$;

create or replace function public.touch_conversation_after_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      updated_at = now()
  where id = new.conversation_id;

  update public.conversation_participants
  set last_read_at = new.created_at
  where conversation_id = new.conversation_id
    and user_id = new.sender_id;

  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation_after_message();

revoke all on function public.is_teacher_of_announcement(uuid) from public;
revoke all on function public.can_access_announcement(uuid) from public;
revoke all on function public.is_conversation_participant(uuid) from public;
revoke all on function public.can_access_message(uuid) from public;
revoke all on function public.can_view_class_contact_profile(uuid) from public;
revoke all on function public.create_class_conversation(uuid, uuid, text, text) from public;
grant execute on function public.is_teacher_of_announcement(uuid) to authenticated;
grant execute on function public.can_access_announcement(uuid) to authenticated;
grant execute on function public.is_conversation_participant(uuid) to authenticated;
grant execute on function public.can_access_message(uuid) to authenticated;
grant execute on function public.can_view_class_contact_profile(uuid) to authenticated;
grant execute on function public.create_class_conversation(uuid, uuid, text, text) to authenticated;

alter table public.announcements enable row level security;
alter table public.announcement_attachments enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;

-- Allow teachers and students to see the profile name of class contacts and conversation participants.
drop policy if exists "profiles communication contacts" on public.profiles;
create policy "profiles communication contacts" on public.profiles
for select to authenticated using (public.can_view_class_contact_profile(id));

-- Announcements
drop policy if exists "communication read announcements" on public.announcements;
create policy "communication read announcements" on public.announcements
for select to authenticated using (public.can_access_announcement(id));

drop policy if exists "teachers create announcements" on public.announcements;
create policy "teachers create announcements" on public.announcements
for insert to authenticated with check (
  author_id = auth.uid() and (public.is_teacher_of_class(class_id) or public.is_admin())
);

drop policy if exists "teachers update announcements" on public.announcements;
create policy "teachers update announcements" on public.announcements
for update to authenticated using (public.is_teacher_of_announcement(id) or public.is_admin())
with check (public.is_teacher_of_announcement(id) or public.is_admin());

drop policy if exists "teachers delete announcements" on public.announcements;
create policy "teachers delete announcements" on public.announcements
for delete to authenticated using (public.is_teacher_of_announcement(id) or public.is_admin());

-- Announcement attachments
drop policy if exists "communication read announcement attachments" on public.announcement_attachments;
create policy "communication read announcement attachments" on public.announcement_attachments
for select to authenticated using (public.can_access_announcement(announcement_id));

drop policy if exists "teachers manage announcement attachments" on public.announcement_attachments;
create policy "teachers manage announcement attachments" on public.announcement_attachments
for all to authenticated using (public.is_teacher_of_announcement(announcement_id) or public.is_admin())
with check (public.is_teacher_of_announcement(announcement_id) or public.is_admin());

-- Announcement reads
drop policy if exists "users read own announcement receipts" on public.announcement_reads;
create policy "users read own announcement receipts" on public.announcement_reads
for select to authenticated using (
  user_id = auth.uid() or public.is_teacher_of_announcement(announcement_id) or public.is_admin()
);

drop policy if exists "users mark announcements read" on public.announcement_reads;
create policy "users mark announcements read" on public.announcement_reads
for insert to authenticated with check (
  user_id = auth.uid() and public.can_access_announcement(announcement_id)
);

drop policy if exists "users update own announcement receipts" on public.announcement_reads;
create policy "users update own announcement receipts" on public.announcement_reads
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Conversations and participants
drop policy if exists "participants read conversations" on public.conversations;
create policy "participants read conversations" on public.conversations
for select to authenticated using (public.is_conversation_participant(id) or public.is_admin());

drop policy if exists "teachers update conversations" on public.conversations;
create policy "teachers update conversations" on public.conversations
for update to authenticated using (public.is_teacher_of_class(class_id) or public.is_admin())
with check (public.is_teacher_of_class(class_id) or public.is_admin());

drop policy if exists "participants read conversation participants" on public.conversation_participants;
create policy "participants read conversation participants" on public.conversation_participants
for select to authenticated using (public.is_conversation_participant(conversation_id) or public.is_admin());

drop policy if exists "participants update own read state" on public.conversation_participants;
create policy "participants update own read state" on public.conversation_participants
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Messages
drop policy if exists "participants read messages" on public.messages;
create policy "participants read messages" on public.messages
for select to authenticated using (public.is_conversation_participant(conversation_id) or public.is_admin());

drop policy if exists "participants send messages" on public.messages;
create policy "participants send messages" on public.messages
for insert to authenticated with check (
  sender_id = auth.uid()
  and public.is_conversation_participant(conversation_id)
  and exists (select 1 from public.conversations c where c.id = conversation_id and c.status = 'active')
);

drop policy if exists "senders edit messages" on public.messages;
create policy "senders edit messages" on public.messages
for update to authenticated using (sender_id = auth.uid() and deleted_at is null)
with check (sender_id = auth.uid());

-- Message attachments
drop policy if exists "participants read message attachments" on public.message_attachments;
create policy "participants read message attachments" on public.message_attachments
for select to authenticated using (public.can_access_message(message_id));

drop policy if exists "senders manage message attachments" on public.message_attachments;
create policy "senders manage message attachments" on public.message_attachments
for all to authenticated using (
  exists (select 1 from public.messages m where m.id = message_id and m.sender_id = auth.uid())
  or public.is_admin()
) with check (
  exists (select 1 from public.messages m where m.id = message_id and m.sender_id = auth.uid())
  or public.is_admin()
);

insert into storage.buckets (id, name, public, file_size_limit)
values ('communication-files', 'communication-files', false, 52428800)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists "communication users upload own files" on storage.objects;
create policy "communication users upload own files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'communication-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "communication users read authorized files" on storage.objects;
create policy "communication users read authorized files" on storage.objects
for select to authenticated using (
  bucket_id = 'communication-files'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.announcement_attachments aa
      where aa.storage_path = name and public.can_access_announcement(aa.announcement_id)
    )
    or exists (
      select 1 from public.message_attachments ma
      where ma.storage_path = name and public.can_access_message(ma.message_id)
    )
    or public.is_admin()
  )
);

drop policy if exists "communication users update own files" on storage.objects;
create policy "communication users update own files" on storage.objects
for update to authenticated using (
  bucket_id = 'communication-files' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'communication-files' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "communication users delete own files" on storage.objects;
create policy "communication users delete own files" on storage.objects
for delete to authenticated using (
  bucket_id = 'communication-files' and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
