-- Verify TK Mooc Phase 8.1

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('site_homepage_settings', 'site_navigation_items')
order by table_name;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('site_homepage_settings', 'site_navigation_items')
order by c.relname;

select site_key, header_site_name, hero_title_primary, hero_visual_mode, footer_is_visible, updated_at
from public.site_homepage_settings
where site_key = 'main';

select label, url, icon_name, display_order, is_visible, open_new_tab
from public.site_navigation_items
where location = 'header'
order by display_order, created_at;

select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'site-assets';

select schemaname, tablename, policyname, roles, cmd
from pg_policies
where (schemaname = 'public' and tablename in ('site_homepage_settings', 'site_navigation_items'))
   or (schemaname = 'storage' and tablename = 'objects' and policyname like '%site assets%')
order by schemaname, tablename, policyname;

select setting_key, setting_value
from public.system_settings
where setting_key = 'schema_version';

select public.phase7_preflight();
