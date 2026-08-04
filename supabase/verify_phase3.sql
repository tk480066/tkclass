-- Verify TK Mooc Phase 3
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'assignments','assignment_targets','assignment_attachments',
    'submissions','submission_members','submission_files'
  )
order by table_name;

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'assignments','assignment_targets','assignment_attachments',
    'submissions','submission_members','submission_files'
  )
order by tablename;

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname in ('public','storage')
  and tablename in (
    'assignments','assignment_targets','assignment_attachments',
    'submissions','submission_members','submission_files','objects'
  )
order by schemaname, tablename, policyname;

select id, name, public, file_size_limit
from storage.buckets
where id in ('assignment-files','submission-files')
order by id;
