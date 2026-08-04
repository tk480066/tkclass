import { createClient } from "@/lib/supabase/server";

export type SiteHeroVisualMode = "phone" | "image" | "none";
export type SiteNavigationIcon =
  | "home"
  | "teacher"
  | "student"
  | "about"
  | "book"
  | "calendar"
  | "info"
  | "megaphone"
  | "link";

export type SiteHomepageSettingsRow = {
  id: string;
  site_key: string;
  header_site_name: string;
  header_tagline: string;
  header_logo_path: string | null;
  header_logo_alt: string;
  header_show_tagline: boolean;
  header_show_theme_toggle: boolean;
  header_login_label: string;
  header_logged_in_label: string;
  hero_is_visible: boolean;
  hero_badge: string;
  hero_title_primary: string;
  hero_title_accent: string;
  hero_description: string;
  hero_primary_label: string;
  hero_primary_url: string;
  hero_secondary_label: string;
  hero_secondary_url: string;
  hero_visual_mode: SiteHeroVisualMode;
  hero_image_path: string | null;
  hero_image_alt: string;
  footer_is_visible: boolean;
  footer_description: string;
  footer_contact_heading: string;
  footer_contact_line_1: string;
  footer_contact_line_2: string;
  footer_social_heading: string;
  footer_facebook_label: string;
  footer_facebook_url: string;
  footer_youtube_label: string;
  footer_youtube_url: string;
  footer_line_label: string;
  footer_line_url: string;
  footer_copyright: string;
  footer_technology: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteNavigationItem = {
  id: string;
  location: "header";
  label: string;
  url: string;
  icon_name: SiteNavigationIcon;
  display_order: number;
  is_visible: boolean;
  open_new_tab: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type HomepagePublicContent = {
  settings: SiteHomepageSettingsRow;
  navigation: SiteNavigationItem[];
  logoUrl: string | null;
  heroImageUrl: string | null;
  source: "database" | "fallback";
};

export const DEFAULT_HOMEPAGE_SETTINGS: SiteHomepageSettingsRow = {
  id: "fallback-homepage-settings",
  site_key: "main",
  header_site_name: "TK Mooc",
  header_tagline: "ศูนย์การเรียนรู้ครูปิง",
  header_logo_path: null,
  header_logo_alt: "โลโก้ TK Mooc",
  header_show_tagline: true,
  header_show_theme_toggle: true,
  header_login_label: "เข้าสู่ระบบ",
  header_logged_in_label: "แดชบอร์ด",
  hero_is_visible: true,
  hero_badge: "ห้องเรียนแห่งอนาคต",
  hero_title_primary: "เชื่อมต่อการสอน",
  hero_title_accent: "อย่างเป็นระบบ",
  hero_description:
    "รวมลิงก์ชั้นเรียน ข่าวประกาศ และกิจกรรมสำคัญไว้ในที่เดียว พร้อมส่วนจัดการข้อมูลสำหรับผู้ดูแลระบบ",
  hero_primary_label: "สำหรับครู",
  hero_primary_url: "/login",
  hero_secondary_label: "ดูกิจกรรม",
  hero_secondary_url: "#calendar",
  hero_visual_mode: "phone",
  hero_image_path: null,
  hero_image_alt: "ภาพประกอบ TK Mooc",
  footer_is_visible: true,
  footer_description: "พื้นที่เรียนรู้ที่เชื่อมโยงทุกคนอย่างเป็นระบบ",
  footer_contact_heading: "ติดต่อเรา",
  footer_contact_line_1: "กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี",
  footer_contact_line_2: "admin@example.com",
  footer_social_heading: "ช่องทางออนไลน์",
  footer_facebook_label: "Facebook",
  footer_facebook_url: "",
  footer_youtube_label: "YouTube",
  footer_youtube_url: "",
  footer_line_label: "LINE",
  footer_line_url: "",
  footer_copyright: "© 2026 TK Mooc. All rights reserved.",
  footer_technology: "Next.js · Supabase · Vercel",
  updated_by: null,
  created_at: "",
  updated_at: "",
};

export const DEFAULT_NAVIGATION: SiteNavigationItem[] = [
  {
    id: "fallback-home",
    location: "header",
    label: "หน้าหลัก",
    url: "#home",
    icon_name: "home",
    display_order: 10,
    is_visible: true,
    open_new_tab: false,
    updated_by: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-teacher",
    location: "header",
    label: "สำหรับครู",
    url: "#roles",
    icon_name: "teacher",
    display_order: 20,
    is_visible: true,
    open_new_tab: false,
    updated_by: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-student",
    location: "header",
    label: "สำหรับนักเรียน",
    url: "#roles",
    icon_name: "student",
    display_order: 30,
    is_visible: true,
    open_new_tab: false,
    updated_by: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-about",
    location: "header",
    label: "เกี่ยวกับ",
    url: "#about",
    icon_name: "about",
    display_order: 40,
    is_visible: true,
    open_new_tab: false,
    updated_by: null,
    created_at: "",
    updated_at: "",
  },
];

function publicAssetUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null,
) {
  if (!path) return null;
  const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
  return data.publicUrl || null;
}

function isSettingsRow(value: unknown): value is SiteHomepageSettingsRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.header_site_name === "string" && typeof row.hero_title_primary === "string";
}

export async function getHomepagePublicContent(): Promise<HomepagePublicContent> {
  try {
    const supabase = await createClient();
    const [{ data: settingsData, error: settingsError }, { data: navigationData, error: navigationError }] =
      await Promise.all([
        supabase.from("site_homepage_settings").select("*").eq("site_key", "main").maybeSingle(),
        supabase
          .from("site_navigation_items")
          .select("*")
          .eq("location", "header")
          .eq("is_visible", true)
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

    if (settingsError || navigationError || !isSettingsRow(settingsData)) {
      throw new Error(settingsError?.message || navigationError?.message || "Homepage settings unavailable");
    }

    const settings = settingsData as SiteHomepageSettingsRow;
    const navigation = (navigationData ?? []) as SiteNavigationItem[];

    return {
      settings,
      navigation: navigation.length ? navigation : DEFAULT_NAVIGATION,
      logoUrl: publicAssetUrl(supabase, settings.header_logo_path),
      heroImageUrl: publicAssetUrl(supabase, settings.hero_image_path),
      source: "database",
    };
  } catch {
    return {
      settings: DEFAULT_HOMEPAGE_SETTINGS,
      navigation: DEFAULT_NAVIGATION,
      logoUrl: null,
      heroImageUrl: null,
      source: "fallback",
    };
  }
}

export async function getHomepageCmsDashboard() {
  const supabase = await createClient();
  const [{ data: settingsData, error: settingsError }, { data: navigationData, error: navigationError }] =
    await Promise.all([
      supabase.from("site_homepage_settings").select("*").eq("site_key", "main").single(),
      supabase
        .from("site_navigation_items")
        .select("*")
        .eq("location", "header")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

  if (settingsError) throw new Error(`โหลดค่าหน้าหลักไม่สำเร็จ: ${settingsError.message}`);
  if (navigationError) throw new Error(`โหลดเมนูไม่สำเร็จ: ${navigationError.message}`);
  if (!isSettingsRow(settingsData)) throw new Error("ไม่พบข้อมูลหน้าหลัก กรุณารัน Migration Phase 8.1");

  const settings = settingsData as SiteHomepageSettingsRow;
  return {
    settings,
    navigation: (navigationData ?? []) as SiteNavigationItem[],
    logoUrl: publicAssetUrl(supabase, settings.header_logo_path),
    heroImageUrl: publicAssetUrl(supabase, settings.hero_image_path),
  };
}
