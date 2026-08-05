-- TK Mooc Phase 8.3: News, Events, Statistics and Related Links
begin;

create table if not exists public.site_news_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  content text not null default '',
  image_path text,
  external_url text,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  is_pinned boolean not null default false,
  is_visible boolean not null default true,
  display_order integer not null default 100,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_news_schedule_check check (expires_at is null or expires_at > published_at)
);

create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  location text not null default '',
  start_at timestamptz not null,
  end_at timestamptz,
  registration_url text,
  accent_color text not null default '#2563eb',
  is_visible boolean not null default true,
  display_order integer not null default 100,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_events_schedule_check check (end_at is null or end_at >= start_at)
);

create table if not exists public.site_stat_items (
  id uuid primary key default gen_random_uuid(),
  stat_key text not null unique,
  label text not null,
  value_mode text not null default 'manual' check (value_mode in ('manual','courses','classes','teachers','students','lessons')),
  manual_value integer not null default 0 check (manual_value >= 0),
  suffix text not null default '',
  icon_name text not null default 'chart',
  is_visible boolean not null default true,
  display_order integer not null default 100,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_related_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  url text not null,
  icon_name text not null default 'link',
  image_path text,
  open_new_tab boolean not null default true,
  is_visible boolean not null default true,
  display_order integer not null default 100,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_site_news_public on public.site_news_items(is_visible, is_pinned desc, display_order, published_at desc);
create index if not exists idx_site_events_public on public.site_events(is_visible, start_at, display_order);
create index if not exists idx_site_stats_public on public.site_stat_items(is_visible, display_order);
create index if not exists idx_site_links_public on public.site_related_links(is_visible, display_order);

drop trigger if exists site_news_set_updated_at on public.site_news_items;
create trigger site_news_set_updated_at before update on public.site_news_items for each row execute function public.set_updated_at();
drop trigger if exists site_events_set_updated_at on public.site_events;
create trigger site_events_set_updated_at before update on public.site_events for each row execute function public.set_updated_at();
drop trigger if exists site_stats_set_updated_at on public.site_stat_items;
create trigger site_stats_set_updated_at before update on public.site_stat_items for each row execute function public.set_updated_at();
drop trigger if exists site_links_set_updated_at on public.site_related_links;
create trigger site_links_set_updated_at before update on public.site_related_links for each row execute function public.set_updated_at();

alter table public.site_news_items enable row level security;
alter table public.site_events enable row level security;
alter table public.site_stat_items enable row level security;
alter table public.site_related_links enable row level security;

create policy "public read visible site news" on public.site_news_items for select to anon, authenticated using (is_visible and published_at <= now() and (expires_at is null or expires_at > now()) or public.is_admin());
create policy "admins manage site news" on public.site_news_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read visible site events" on public.site_events for select to anon, authenticated using (is_visible or public.is_admin());
create policy "admins manage site events" on public.site_events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read visible site stats" on public.site_stat_items for select to anon, authenticated using (is_visible or public.is_admin());
create policy "admins manage site stats" on public.site_stat_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read visible related links" on public.site_related_links for select to anon, authenticated using (is_visible or public.is_admin());
create policy "admins manage related links" on public.site_related_links for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.site_news_items(title, summary, is_pinned, display_order)
select 'ยินดีต้อนรับสู่ TK Mooc','ศูนย์รวมการเรียนรู้ ข่าวสาร และกิจกรรมสำหรับครูและนักเรียน',true,10
where not exists (select 1 from public.site_news_items);
insert into public.site_events(title,description,location,start_at,display_order)
select 'อบรมการใช้งานระบบ TK Mooc','แนะนำการใช้งานระบบสำหรับครูและนักเรียน','ห้องปฏิบัติการคอมพิวเตอร์',now()+interval '7 days',10
where not exists (select 1 from public.site_events);
insert into public.site_stat_items(stat_key,label,value_mode,manual_value,suffix,icon_name,display_order) values
('courses','รายวิชา','courses',0,' วิชา','book',10),
('classes','ชั้นเรียน','classes',0,' ห้อง','school',20),
('teachers','ครูผู้สอน','teachers',0,' คน','teacher',30),
('students','นักเรียน','students',0,' คน','student',40)
on conflict (stat_key) do nothing;
insert into public.site_related_links(title,description,url,icon_name,display_order) values
('คู่มือการใช้งาน','รวมคู่มือสำหรับครูและนักเรียน','#home','book',10),
('ติดต่อผู้ดูแลระบบ','แจ้งปัญหาการใช้งานและขอความช่วยเหลือ','mailto:admin@example.com','message',20)
on conflict do nothing;

insert into public.site_homepage_sections(site_key,section_key,section_type,eyebrow,title,description,display_order,is_visible,background_style,is_system)
select 'main','statistics','custom_text','SYSTEM OVERVIEW','สถิติการใช้งาน','ภาพรวมข้อมูลสำคัญของระบบ TK Mooc',35,true,'blue',true
where not exists(select 1 from public.site_homepage_sections where site_key='main' and section_key='statistics');

insert into public.system_settings(setting_key,setting_value,is_public)
values ('schema_version','"8.3.0"'::jsonb,true)
on conflict (setting_key) do update set setting_value=excluded.setting_value, updated_at=now();
commit;
