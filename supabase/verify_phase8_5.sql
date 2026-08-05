-- TK Mooc Phase 8.5 verification
select setting_key, setting_value
from public.system_settings
where setting_key = 'schema_version';

select tablename, rowsecurity
from pg_tables
where schemaname='public'
  and tablename in (
    'site_homepage_settings','site_navigation_items','site_homepage_sections',
    'site_news_items','site_events','site_stat_items','site_related_links',
    'site_content_revisions','site_preview_sessions'
  )
order by tablename;

select tablename, count(*) as policy_count
from pg_policies
where schemaname='public'
  and tablename like 'site_%'
group by tablename
order by tablename;

select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id='site-assets';

select environment, check_key, check_label, status
from public.deployment_checks
where environment='production'
order by check_key;

select public.phase85_readiness_report();
