select table_name from information_schema.tables where table_schema='public' and table_name in ('site_news_items','site_events','site_stat_items','site_related_links') order by table_name;
select c.relname as table_name,c.relrowsecurity as rls_enabled from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('site_news_items','site_events','site_stat_items','site_related_links');
select setting_key,setting_value from public.system_settings where setting_key='schema_version';
select 'news' as item,count(*) from public.site_news_items union all select 'events',count(*) from public.site_events union all select 'statistics',count(*) from public.site_stat_items union all select 'links',count(*) from public.site_related_links;
