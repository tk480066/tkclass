-- Verify TK Mooc Phase 2 installation.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('units', 'lessons', 'lesson_blocks', 'lesson_progress', 'lesson_responses')
order by table_name;

select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('units', 'lessons', 'lesson_blocks', 'lesson_progress', 'lesson_responses')
order by relname;

select schemaname, tablename, policyname, cmd
from pg_policies
where (schemaname = 'public' and tablename in ('units', 'lessons', 'lesson_blocks', 'lesson_progress', 'lesson_responses'))
   or (schemaname = 'storage' and tablename = 'objects' and policyname like 'course_content%')
order by schemaname, tablename, policyname;

select id, name, public, file_size_limit
from storage.buckets
where id = 'course-content';
