-- Verify TK Mooc Phase 4
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('quizzes','quiz_questions','quiz_options','quiz_attempts','quiz_answers')
order by table_name;

select typname
from pg_type
where typname in ('quiz_status','quiz_question_type','quiz_attempt_status')
order by typname;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('get_quiz_question_count','get_my_quiz_attempts','get_quiz_attempt_payload','get_quiz_attempt_result','start_quiz_attempt','submit_quiz_attempt','recalculate_quiz_attempt')
order by routine_name;

select tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename in ('quizzes','quiz_questions','quiz_options','quiz_attempts','quiz_answers')
order by tablename, policyname;
