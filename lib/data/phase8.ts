import { createClient } from "@/lib/supabase/server";

export type SiteHeroVisualMode = "phone" | "image" | "none";
export type SiteNavigationIcon = "home" | "teacher" | "student" | "about" | "book" | "calendar" | "info" | "megaphone" | "link";
export type HomepageSectionType = "hero" | "roles" | "news" | "calendar" | "links" | "custom_text" | "cta";
export type HomepageSectionBackground = "default" | "soft" | "blue" | "dark";

export type SiteHomepageSettingsRow = {
  id: string; site_key: string; header_site_name: string; header_tagline: string;
  header_logo_path: string | null; header_logo_alt: string; header_show_tagline: boolean;
  header_show_theme_toggle: boolean; header_login_label: string; header_logged_in_label: string;
  hero_is_visible: boolean; hero_badge: string; hero_title_primary: string; hero_title_accent: string;
  hero_description: string; hero_primary_label: string; hero_primary_url: string;
  hero_secondary_label: string; hero_secondary_url: string; hero_visual_mode: SiteHeroVisualMode;
  hero_image_path: string | null; hero_image_alt: string; footer_is_visible: boolean;
  footer_description: string; footer_contact_heading: string; footer_contact_line_1: string;
  footer_contact_line_2: string; footer_social_heading: string; footer_facebook_label: string;
  footer_facebook_url: string; footer_youtube_label: string; footer_youtube_url: string;
  footer_line_label: string; footer_line_url: string; footer_copyright: string;
  footer_technology: string; updated_by: string | null; created_at: string; updated_at: string;
};

export type SiteNavigationItem = {
  id: string; location: "header"; label: string; url: string; icon_name: SiteNavigationIcon;
  display_order: number; is_visible: boolean; open_new_tab: boolean; updated_by: string | null;
  created_at: string; updated_at: string;
};

export type SiteHomepageSection = {
  id: string; site_key: string; section_key: string; section_type: HomepageSectionType;
  eyebrow: string; title: string; description: string; body: string; button_label: string;
  button_url: string; display_order: number; is_visible: boolean;
  background_style: HomepageSectionBackground; is_system: boolean; updated_by: string | null;
  created_at: string; updated_at: string;
};

export type HomepagePublicContent = {
  settings: SiteHomepageSettingsRow; navigation: SiteNavigationItem[]; sections: SiteHomepageSection[];
  logoUrl: string | null; heroImageUrl: string | null; source: "database" | "fallback";
};

export const DEFAULT_HOMEPAGE_SETTINGS: SiteHomepageSettingsRow = {
  id:"fallback-homepage-settings", site_key:"main", header_site_name:"TK Mooc", header_tagline:"ศูนย์การเรียนรู้ครูปิง",
  header_logo_path:null, header_logo_alt:"โลโก้ TK Mooc", header_show_tagline:true, header_show_theme_toggle:true,
  header_login_label:"เข้าสู่ระบบ", header_logged_in_label:"แดชบอร์ด", hero_is_visible:true,
  hero_badge:"ห้องเรียนแห่งอนาคต", hero_title_primary:"เชื่อมต่อการสอน", hero_title_accent:"อย่างเป็นระบบ",
  hero_description:"รวมลิงก์ชั้นเรียน ข่าวประกาศ และกิจกรรมสำคัญไว้ในที่เดียว พร้อมส่วนจัดการข้อมูลสำหรับผู้ดูแลระบบ",
  hero_primary_label:"สำหรับครู", hero_primary_url:"/login", hero_secondary_label:"ดูกิจกรรม", hero_secondary_url:"#calendar",
  hero_visual_mode:"phone", hero_image_path:null, hero_image_alt:"ภาพประกอบ TK Mooc", footer_is_visible:true,
  footer_description:"พื้นที่เรียนรู้ที่เชื่อมโยงทุกคนอย่างเป็นระบบ", footer_contact_heading:"ติดต่อเรา",
  footer_contact_line_1:"กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี", footer_contact_line_2:"admin@example.com",
  footer_social_heading:"ช่องทางออนไลน์", footer_facebook_label:"Facebook", footer_facebook_url:"",
  footer_youtube_label:"YouTube", footer_youtube_url:"", footer_line_label:"LINE", footer_line_url:"",
  footer_copyright:"© 2026 TK Mooc. All rights reserved.", footer_technology:"Next.js · Supabase · Vercel",
  updated_by:null, created_at:"", updated_at:""
};

export const DEFAULT_NAVIGATION: SiteNavigationItem[] = [
  nav("fallback-home","หน้าหลัก","#home","home",10), nav("fallback-teacher","สำหรับครู","#roles","teacher",20),
  nav("fallback-student","สำหรับนักเรียน","#roles","student",30), nav("fallback-about","เกี่ยวกับ","#about","about",40),
];
function nav(id:string,label:string,url:string,icon_name:SiteNavigationIcon,display_order:number):SiteNavigationItem {
  return {id,location:"header",label,url,icon_name,display_order,is_visible:true,open_new_tab:false,updated_by:null,created_at:"",updated_at:""};
}

export const DEFAULT_SECTIONS: SiteHomepageSection[] = [
  section("fallback-hero","hero","hero","ห้องเรียนแห่งอนาคต","เชื่อมต่อการสอนอย่างเป็นระบบ","รวมลิงก์ชั้นเรียน ข่าวประกาศ และกิจกรรมสำคัญไว้ในที่เดียว",10,"default",true),
  section("fallback-roles","roles","roles","CHOOSE YOUR SPACE","เลือกพื้นที่การเรียนรู้ของคุณ","เข้าสู่ระบบตามบทบาท เพื่อจัดการชั้นเรียนหรือเริ่มต้นเรียนรู้ได้ทันที",20,"default",true),
  section("fallback-news","news","news","LATEST NEWS","ข่าวสารและประกาศ","ติดตามข้อมูลสำคัญ ข่าวประชาสัมพันธ์ และประกาศล่าสุดจาก TK Mooc",30,"soft",true),
  section("fallback-calendar","calendar","calendar","ACTIVITY CALENDAR","ปฏิทินและกิจกรรม","ดูวันสำคัญ กำหนดการ และกิจกรรมที่กำลังจะมาถึง",40,"default",true),
  section("fallback-links","links","links","USEFUL LINKS","ลิงก์และบริการที่เกี่ยวข้อง","เข้าถึงคู่มือ ช่องทางสนับสนุน และเว็บไซต์ที่เกี่ยวข้องได้อย่างรวดเร็ว",50,"soft",true),
];
function section(id:string,section_key:string,section_type:HomepageSectionType,eyebrow:string,title:string,description:string,display_order:number,background_style:HomepageSectionBackground,is_system:boolean):SiteHomepageSection {
  return {id,site_key:"main",section_key,section_type,eyebrow,title,description,body:"",button_label:"",button_url:"",display_order,is_visible:true,background_style,is_system,updated_by:null,created_at:"",updated_at:""};
}

function publicAssetUrl(supabase: Awaited<ReturnType<typeof createClient>>, path:string|null) {
  if (!path) return null; const {data}=supabase.storage.from("site-assets").getPublicUrl(path); return data.publicUrl||null;
}
function isSettingsRow(value:unknown): value is SiteHomepageSettingsRow {
  if(!value||typeof value!=="object") return false; const row=value as Record<string,unknown>;
  return typeof row.header_site_name==="string"&&typeof row.hero_title_primary==="string";
}

export async function getHomepagePublicContent(preview=false):Promise<HomepagePublicContent>{
  try{
    const supabase=await createClient();
    const now=new Date().toISOString();
    const statusFilter=`publish_status.eq.published,and(publish_status.eq.scheduled,scheduled_at.lte.${now})`;
    const [settingsResult,navigationResult,sectionsResult]=await Promise.all([
      supabase.from("site_homepage_settings").select("*").eq("site_key","main").maybeSingle(),
      supabase.from("site_navigation_items").select("*").eq("location","header").eq("is_visible",true).or(preview?"publish_status.in.(draft,scheduled,published)":statusFilter).order("display_order").order("created_at"),
      supabase.from("site_homepage_sections").select("*").eq("site_key","main").eq("is_visible",true).or(preview?"publish_status.in.(draft,scheduled,published)":statusFilter).order("display_order").order("created_at"),
    ]);
    if(settingsResult.error||navigationResult.error||sectionsResult.error||!isSettingsRow(settingsResult.data)) throw new Error("Homepage unavailable");
    const settings=settingsResult.data as SiteHomepageSettingsRow;
    return {settings,navigation:(navigationResult.data?.length?navigationResult.data:DEFAULT_NAVIGATION) as SiteNavigationItem[],sections:(sectionsResult.data?.length?sectionsResult.data:DEFAULT_SECTIONS) as SiteHomepageSection[],logoUrl:publicAssetUrl(supabase,settings.header_logo_path),heroImageUrl:publicAssetUrl(supabase,settings.hero_image_path),source:"database"};
  }catch{return {settings:DEFAULT_HOMEPAGE_SETTINGS,navigation:DEFAULT_NAVIGATION,sections:DEFAULT_SECTIONS,logoUrl:null,heroImageUrl:null,source:"fallback"};}
}

export async function getHomepageCmsDashboard(){
  const supabase=await createClient();
  const [settingsResult,navigationResult,sectionsResult]=await Promise.all([
    supabase.from("site_homepage_settings").select("*").eq("site_key","main").single(),
    supabase.from("site_navigation_items").select("*").eq("location","header").order("display_order").order("created_at"),
    supabase.from("site_homepage_sections").select("*").eq("site_key","main").order("display_order").order("created_at"),
  ]);
  if(settingsResult.error) throw new Error(`โหลดค่าหน้าหลักไม่สำเร็จ: ${settingsResult.error.message}`);
  if(navigationResult.error) throw new Error(`โหลดเมนูไม่สำเร็จ: ${navigationResult.error.message}`);
  if(sectionsResult.error) throw new Error(`โหลด Section ไม่สำเร็จ: ${sectionsResult.error.message} กรุณารัน Migration Phase 8.2`);
  if(!isSettingsRow(settingsResult.data)) throw new Error("ไม่พบข้อมูลหน้าหลัก กรุณารัน Migration Phase 8.1");
  const settings=settingsResult.data as SiteHomepageSettingsRow;
  return {settings,navigation:(navigationResult.data??[]) as SiteNavigationItem[],sections:(sectionsResult.data??[]) as SiteHomepageSection[],logoUrl:publicAssetUrl(supabase,settings.header_logo_path),heroImageUrl:publicAssetUrl(supabase,settings.hero_image_path)};
}

export async function getHomepageSectionsDashboard(){
  const supabase=await createClient();
  const {data,error}=await supabase.from("site_homepage_sections").select("*").eq("site_key","main").order("display_order").order("created_at");
  if(error) throw new Error(`โหลด Section ไม่สำเร็จ: ${error.message} กรุณารัน Migration Phase 8.2`);
  return (data??[]) as SiteHomepageSection[];
}

export type SiteNewsItem={id:string;title:string;summary:string;content:string;image_path:string|null;external_url:string|null;published_at:string;expires_at:string|null;is_pinned:boolean;is_visible:boolean;display_order:number};
export type SiteEventItem={id:string;title:string;description:string;location:string;start_at:string;end_at:string|null;registration_url:string|null;accent_color:string;is_visible:boolean;display_order:number};
export type SiteStatItem={id:string;stat_key:string;label:string;value_mode:string;manual_value:number;suffix:string;icon_name:string;is_visible:boolean;display_order:number;resolved_value?:number};
export type SiteRelatedLink={id:string;title:string;description:string;url:string;icon_name:string;image_path:string|null;open_new_tab:boolean;is_visible:boolean;display_order:number};

export async function getPhase83PublicContent(preview=false){
  try{const supabase=await createClient();const now=new Date().toISOString();const statusFilter=`publish_status.eq.published,and(publish_status.eq.scheduled,scheduled_at.lte.${now})`;const [news,events,stats,links]=await Promise.all([
    supabase.from('site_news_items').select('*').eq('is_visible',true).or(preview?'publish_status.in.(draft,scheduled,published)':statusFilter).lte('published_at',now).or(`expires_at.is.null,expires_at.gt.${now}`).order('is_pinned',{ascending:false}).order('display_order').order('published_at',{ascending:false}).limit(6),
    supabase.from('site_events').select('*').eq('is_visible',true).or(preview?'publish_status.in.(draft,scheduled,published)':statusFilter).gte('start_at',new Date(Date.now()-86400000).toISOString()).order('start_at').order('display_order').limit(8),
    supabase.from('site_stat_items').select('*').eq('is_visible',true).or(preview?'publish_status.in.(draft,scheduled,published)':statusFilter).order('display_order'),
    supabase.from('site_related_links').select('*').eq('is_visible',true).or(preview?'publish_status.in.(draft,scheduled,published)':statusFilter).order('display_order'),
  ]);if(news.error||events.error||stats.error||links.error)throw new Error('phase83 unavailable');
  const statRows=(stats.data??[]) as SiteStatItem[];const counts:Record<string,number>={};for(const mode of new Set(statRows.map(s=>s.value_mode).filter(m=>m!=='manual'))){const table=mode==='courses'?'classes':mode==='teachers'?'teacher_profiles':mode==='students'?'student_profiles':mode==='lessons'?'lessons':'classes';const {count}=await supabase.from(table).select('*',{count:'exact',head:true});counts[mode]=count??0}
  return {news:(news.data??[]) as SiteNewsItem[],events:(events.data??[]) as SiteEventItem[],stats:statRows.map(s=>({...s,resolved_value:s.value_mode==='manual'?s.manual_value:(counts[s.value_mode]??0)})),links:(links.data??[]) as SiteRelatedLink[]};
  }catch{return {news:[] as SiteNewsItem[],events:[] as SiteEventItem[],stats:[] as SiteStatItem[],links:[] as SiteRelatedLink[]};}
}
export async function getPhase83AdminData(table:'site_news_items'|'site_events'|'site_stat_items'|'site_related_links'){const supabase=await createClient();const {data,error}=await supabase.from(table).select('*').order('display_order').order('created_at');if(error)throw new Error(`${error.message} กรุณารัน Migration Phase 8.3`);return data??[]}
