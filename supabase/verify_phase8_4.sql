select table_name from information_schema.tables where table_schema='public' and table_name in ('site_content_revisions','site_preview_sessions');
select table_name,column_name from information_schema.columns where table_schema='public' and column_name in ('publish_status','scheduled_at','published_at','archived_at') order by table_name,column_name;
select setting_key,setting_value from public.system_settings where setting_key='schema_version';
