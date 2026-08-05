select table_name
from information_schema.tables
where table_schema='public' and table_name='site_homepage_sections';

select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where oid='public.site_homepage_sections'::regclass;

select section_key, section_type, display_order, is_visible, is_system
from public.site_homepage_sections
where site_key='main'
order by display_order, created_at;

select setting_key, setting_value
from public.system_settings
where setting_key='schema_version';
