-- Verify TK Mooc Phase 5 database objects.

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'attendance_sessions',
    'attendance_records',
    'grade_categories',
    'grade_settings',
    'grade_items',
    'grade_entries'
  )
order by table_name;

select typname
from pg_type
where typname in (
  'attendance_session_status',
  'attendance_status',
  'attendance_checkin_method',
  'grade_source_type',
  'grade_item_status',
  'grade_calculation_method'
)
order by typname;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'is_teacher_of_attendance_session',
    'is_teacher_of_grade_item',
    'generate_attendance_code',
    'ensure_attendance_records',
    'student_check_in',
    'ensure_default_gradebook',
    'sync_gradebook_sources'
  )
order by routine_name;

select tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename in (
    'attendance_sessions',
    'attendance_records',
    'grade_categories',
    'grade_settings',
    'grade_items',
    'grade_entries'
  )
order by tablename, policyname;
