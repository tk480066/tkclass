-- Verify TK Mooc Phase 6

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'announcements',
    'announcement_attachments',
    'announcement_reads',
    'conversations',
    'conversation_participants',
    'messages',
    'message_attachments'
  )
order by table_name;

select t.typname as enum_name, e.enumlabel as enum_value
from pg_type t
join pg_enum e on e.enumtypid = t.oid
where t.typname in ('announcement_status', 'communication_priority', 'conversation_status', 'message_kind')
order by t.typname, e.enumsortorder;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'is_teacher_of_announcement',
    'can_access_announcement',
    'is_conversation_participant',
    'can_access_message',
    'can_view_class_contact_profile',
    'create_class_conversation',
    'touch_conversation_after_message'
  )
order by routine_name;

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'announcements', 'announcement_attachments', 'announcement_reads',
    'conversations', 'conversation_participants', 'messages', 'message_attachments'
  )
order by tablename, policyname;

select id, name, public, file_size_limit
from storage.buckets
where id = 'communication-files';
