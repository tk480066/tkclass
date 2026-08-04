-- TK Mooc Phase 7 verification

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'system_settings','migration_runs','migration_row_errors',
    'migration_key_map','deployment_checks','audit_events'
  )
order by table_name;

select setting_key, setting_value, is_public
from public.system_settings
order by setting_key;

select environment, check_key, check_label, status
from public.deployment_checks
order by environment, check_key;

select proname
from pg_proc
join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
where pg_namespace.nspname = 'public'
  and proname in ('app_health','phase7_preflight','is_maintenance_mode','record_audit_event')
order by proname;

select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'system_settings','migration_runs','migration_row_errors',
    'migration_key_map','deployment_checks','audit_events'
  )
order by c.relname;

select public.app_health();
