-- TK Mooc Phase 8.2: Homepage sections and ordering
-- Run AFTER 0008_phase8_1_homepage_cms.sql
begin;

create table if not exists public.site_homepage_sections (
  id uuid primary key default gen_random_uuid(),
  site_key text not null default 'main' references public.site_homepage_settings(site_key) on delete cascade,
  section_key text not null,
  section_type text not null,
  eyebrow text not null default '',
  title text not null,
  description text not null default '',
  body text not null default '',
  button_label text not null default '',
  button_url text not null default '',
  display_order integer not null default 0,
  is_visible boolean not null default true,
  background_style text not null default 'default',
  is_system boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_homepage_sections_key_unique unique (site_key, section_key),
  constraint site_homepage_sections_key_check check (section_key ~ '^[a-z0-9_-]+$'),
  constraint site_homepage_sections_type_check check (
    section_type in ('hero','roles','news','calendar','links','custom_text','cta')
  ),
  constraint site_homepage_sections_order_check check (display_order between 0 and 9999),
  constraint site_homepage_sections_background_check check (
    background_style in ('default','soft','blue','dark')
  ),
  constraint site_homepage_sections_title_check check (length(trim(title)) between 1 and 180),
  constraint site_homepage_sections_button_url_check check (length(button_url) <= 500)
);

create index if not exists idx_site_homepage_sections_order
  on public.site_homepage_sections(site_key, display_order, created_at);

drop trigger if exists site_homepage_sections_set_updated_at on public.site_homepage_sections;
create trigger site_homepage_sections_set_updated_at before update on public.site_homepage_sections
for each row execute function public.set_updated_at();

insert into public.site_homepage_sections
  (site_key, section_key, section_type, eyebrow, title, description, display_order, is_visible, background_style, is_system)
values
  ('main','hero','hero','ห้องเรียนแห่งอนาคต','เชื่อมต่อการสอนอย่างเป็นระบบ','รวมลิงก์ชั้นเรียน ข่าวประกาศ และกิจกรรมสำคัญไว้ในที่เดียว',10,true,'default',true),
  ('main','roles','roles','CHOOSE YOUR SPACE','เลือกพื้นที่การเรียนรู้ของคุณ','เข้าสู่ระบบตามบทบาท เพื่อจัดการชั้นเรียนหรือเริ่มต้นเรียนรู้ได้ทันที',20,true,'default',true),
  ('main','news','news','LATEST NEWS','ข่าวสารและประกาศ','ติดตามข้อมูลสำคัญ ข่าวประชาสัมพันธ์ และประกาศล่าสุดจาก TK Mooc',30,true,'soft',true),
  ('main','calendar','calendar','ACTIVITY CALENDAR','ปฏิทินและกิจกรรม','ดูวันสำคัญ กำหนดการ และกิจกรรมที่กำลังจะมาถึง',40,true,'default',true),
  ('main','links','links','USEFUL LINKS','ลิงก์และบริการที่เกี่ยวข้อง','เข้าถึงคู่มือ ช่องทางสนับสนุน และเว็บไซต์ที่เกี่ยวข้องได้อย่างรวดเร็ว',50,true,'soft',true)
on conflict (site_key, section_key) do nothing;

alter table public.site_homepage_sections enable row level security;

drop policy if exists "public read visible homepage sections" on public.site_homepage_sections;
create policy "public read visible homepage sections" on public.site_homepage_sections
for select to anon, authenticated using (is_visible or public.is_admin());

drop policy if exists "admins manage homepage sections" on public.site_homepage_sections;
create policy "admins manage homepage sections" on public.site_homepage_sections
for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.system_settings (setting_key, setting_value, description, is_public)
values ('schema_version', '"8.2.0"'::jsonb, 'เวอร์ชันฐานข้อมูลปัจจุบัน', true)
on conflict (setting_key) do update set
  setting_value = excluded.setting_value,
  description = excluded.description,
  is_public = excluded.is_public,
  updated_at = now();

insert into public.deployment_checks (environment, check_key, check_label, status)
values ('production', 'homepage_sections', 'ตรวจ Section หน้าหลัก การซ่อน และการเรียงลำดับ', 'pending')
on conflict (environment, check_key) do nothing;

commit;
