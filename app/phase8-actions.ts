"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

const visualModeSchema = z.enum(["phone", "image", "none"]);
const navigationIconSchema = z.enum([
  "home",
  "teacher",
  "student",
  "about",
  "book",
  "calendar",
  "info",
  "megaphone",
  "link",
]);

const hrefSchema = z
  .string()
  .max(500, "ลิงก์ต้องไม่เกิน 500 ตัวอักษร")
  .refine(
    (href: string) =>
      href === "" ||
      href.startsWith("/") ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("https://") ||
      href.startsWith("http://"),
    "ลิงก์ต้องขึ้นต้นด้วย /, #, https://, http://, mailto: หรือ tel:",
  );

const headerSchema = z.object({
  siteName: z.string().min(1, "กรุณาระบุชื่อเว็บไซต์").max(100),
  tagline: z.string().max(160),
  logoAlt: z.string().min(1, "กรุณาระบุข้อความอธิบายโลโก้").max(160),
  showTagline: z.boolean(),
  showThemeToggle: z.boolean(),
  loginLabel: z.string().min(1).max(40),
  loggedInLabel: z.string().min(1).max(40),
});

const heroSchema = z.object({
  isVisible: z.boolean(),
  badge: z.string().max(100),
  titlePrimary: z.string().min(1, "กรุณาระบุหัวข้อหลัก").max(140),
  titleAccent: z.string().min(1, "กรุณาระบุข้อความเน้น").max(140),
  description: z.string().min(1, "กรุณาระบุคำอธิบาย").max(1200),
  primaryLabel: z.string().min(1).max(60),
  primaryUrl: hrefSchema.refine((value: string) => value.length > 0, "กรุณาระบุลิงก์ปุ่มหลัก"),
  secondaryLabel: z.string().min(1).max(60),
  secondaryUrl: hrefSchema.refine((value: string) => value.length > 0, "กรุณาระบุลิงก์ปุ่มรอง"),
  visualMode: visualModeSchema,
  imageAlt: z.string().min(1).max(180),
});

const footerSchema = z.object({
  isVisible: z.boolean(),
  description: z.string().max(400),
  contactHeading: z.string().min(1).max(80),
  contactLine1: z.string().max(180),
  contactLine2: z.string().max(180),
  socialHeading: z.string().min(1).max(80),
  facebookLabel: z.string().max(60),
  facebookUrl: hrefSchema,
  youtubeLabel: z.string().max(60),
  youtubeUrl: hrefSchema,
  lineLabel: z.string().max(60),
  lineUrl: hrefSchema,
  copyright: z.string().min(1).max(220),
  technology: z.string().max(220),
});

const navigationSchema = z.object({
  id: z.union([z.literal(""), z.string().uuid()]),
  label: z.string().min(1, "กรุณาระบุชื่อเมนู").max(60),
  url: hrefSchema.refine((value: string) => value.length > 0, "กรุณาระบุลิงก์เมนู"),
  iconName: navigationIconSchema,
  displayOrder: z.coerce.number().int().min(0).max(999),
  isVisible: z.boolean(),
  openNewTab: z.boolean(),
});

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function feedbackRedirect(kind: "saved" | "error", message: string, section = "top"): never {
  const params = new URLSearchParams({ [kind]: message, section });
  redirect(`/admin/content/homepage?${params.toString()}#${section}`);
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function requireAdmin() {
  const user = await requireRole("admin");
  const supabase = await createClient();
  return { user, supabase };
}

async function recordAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventType: string,
  metadata: Record<string, unknown>,
) {
  const { error } = await supabase.rpc("record_audit_event", {
    target_event_type: eventType,
    target_entity_type: "homepage",
    target_entity_id: null,
    target_class_id: null,
    target_metadata: metadata,
  });
  if (error) throw new Error(`บันทึก Audit log ไม่สำเร็จ: ${error.message}`);
}

function formFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

async function uploadSiteImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  folder: "logos" | "hero",
  file: File,
) {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error("รองรับเฉพาะไฟล์ JPG, PNG และ WebP");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("รูปภาพต้องมีขนาดไม่เกิน 4 MB");
  }

  const extension = IMAGE_EXTENSIONS[file.type];
  const path = `homepage/${folder}/${userId}/${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from("site-assets").upload(path, bytes, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`อัปโหลดรูปภาพไม่สำเร็จ: ${error.message}`);
  return path;
}

async function removeSiteImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null | undefined,
) {
  if (!path) return;
  // การลบไฟล์เก่าเป็นงานทำความสะอาด ไม่ควรทำให้การบันทึกข้อมูลที่สำเร็จแล้วล้มเหลว
  await supabase.storage.from("site-assets").remove([path]);
}

async function getCurrentSettings(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase
    .from("site_homepage_settings")
    .select("header_logo_path, hero_image_path")
    .eq("site_key", "main")
    .single();
  if (error) throw new Error(`โหลดค่าหน้าหลักไม่สำเร็จ: ${error.message}`);
  return data as { header_logo_path: string | null; hero_image_path: string | null };
}

function refreshHomepage() {
  revalidatePath("/");
  revalidatePath("/admin/content/homepage");
}

export async function saveHeaderSettingsAction(formData: FormData) {
  const parsed = headerSchema.safeParse({
    siteName: text(formData, "siteName"),
    tagline: text(formData, "tagline"),
    logoAlt: text(formData, "logoAlt"),
    showTagline: checked(formData, "showTagline"),
    showThemeToggle: checked(formData, "showThemeToggle"),
    loginLabel: text(formData, "loginLabel"),
    loggedInLabel: text(formData, "loggedInLabel"),
  });
  if (!parsed.success) feedbackRedirect("error", parsed.error.issues[0]?.message ?? "ข้อมูล Header ไม่ถูกต้อง", "header");

  let failure: string | null = null;
  let newPath: string | null = null;
  try {
    const { user, supabase } = await requireAdmin();
    const current = await getCurrentSettings(supabase);
    const logoFile = formFile(formData, "logoFile");
    if (logoFile) newPath = await uploadSiteImage(supabase, user.id, "logos", logoFile);

    const { error } = await supabase
      .from("site_homepage_settings")
      .update({
        header_site_name: parsed.data.siteName,
        header_tagline: parsed.data.tagline,
        header_logo_path: newPath ?? current.header_logo_path,
        header_logo_alt: parsed.data.logoAlt,
        header_show_tagline: parsed.data.showTagline,
        header_show_theme_toggle: parsed.data.showThemeToggle,
        header_login_label: parsed.data.loginLabel,
        header_logged_in_label: parsed.data.loggedInLabel,
        updated_by: user.id,
      })
      .eq("site_key", "main");
    if (error) throw new Error(`บันทึก Header ไม่สำเร็จ: ${error.message}`);

    if (newPath && current.header_logo_path && current.header_logo_path !== newPath) {
      await removeSiteImage(supabase, current.header_logo_path);
    }
    await recordAudit(supabase, "homepage_header_updated", {
      site_name: parsed.data.siteName,
      logo_changed: Boolean(newPath),
    });
    refreshHomepage();
  } catch (error) {
    failure = errorMessage(error, "บันทึก Header ไม่สำเร็จ");
    if (newPath) {
      try {
        const { supabase } = await requireAdmin();
        await removeSiteImage(supabase, newPath);
      } catch {
        // Preserve the original failure message.
      }
    }
  }

  if (failure) feedbackRedirect("error", failure, "header");
  feedbackRedirect("saved", "บันทึก Header และเผยแพร่บนหน้าหลักแล้ว", "header");
}

export async function removeHeaderLogoAction() {
  let failure: string | null = null;
  try {
    const { user, supabase } = await requireAdmin();
    const current = await getCurrentSettings(supabase);
    const { error } = await supabase
      .from("site_homepage_settings")
      .update({ header_logo_path: null, updated_by: user.id })
      .eq("site_key", "main");
    if (error) throw new Error(error.message);
    await removeSiteImage(supabase, current.header_logo_path);
    await recordAudit(supabase, "homepage_logo_removed", {});
    refreshHomepage();
  } catch (error) {
    failure = errorMessage(error, "ลบโลโก้ไม่สำเร็จ");
  }
  if (failure) feedbackRedirect("error", failure, "header");
  feedbackRedirect("saved", "ลบโลโก้แล้ว ระบบจะใช้ไอคอนเริ่มต้น", "header");
}

export async function saveHeroSettingsAction(formData: FormData) {
  const parsed = heroSchema.safeParse({
    isVisible: checked(formData, "isVisible"),
    badge: text(formData, "badge"),
    titlePrimary: text(formData, "titlePrimary"),
    titleAccent: text(formData, "titleAccent"),
    description: text(formData, "description"),
    primaryLabel: text(formData, "primaryLabel"),
    primaryUrl: text(formData, "primaryUrl"),
    secondaryLabel: text(formData, "secondaryLabel"),
    secondaryUrl: text(formData, "secondaryUrl"),
    visualMode: text(formData, "visualMode"),
    imageAlt: text(formData, "imageAlt"),
  });
  if (!parsed.success) feedbackRedirect("error", parsed.error.issues[0]?.message ?? "ข้อมูล Hero ไม่ถูกต้อง", "hero");

  let failure: string | null = null;
  let newPath: string | null = null;
  try {
    const { user, supabase } = await requireAdmin();
    const current = await getCurrentSettings(supabase);
    const imageFile = formFile(formData, "heroImageFile");
    if (imageFile) newPath = await uploadSiteImage(supabase, user.id, "hero", imageFile);

    if (parsed.data.visualMode === "image" && !newPath && !current.hero_image_path) {
      throw new Error("โหมดรูปภาพต้องอัปโหลดภาพ Hero ก่อน");
    }

    const { error } = await supabase
      .from("site_homepage_settings")
      .update({
        hero_is_visible: parsed.data.isVisible,
        hero_badge: parsed.data.badge,
        hero_title_primary: parsed.data.titlePrimary,
        hero_title_accent: parsed.data.titleAccent,
        hero_description: parsed.data.description,
        hero_primary_label: parsed.data.primaryLabel,
        hero_primary_url: parsed.data.primaryUrl,
        hero_secondary_label: parsed.data.secondaryLabel,
        hero_secondary_url: parsed.data.secondaryUrl,
        hero_visual_mode: parsed.data.visualMode,
        hero_image_path: newPath ?? current.hero_image_path,
        hero_image_alt: parsed.data.imageAlt,
        updated_by: user.id,
      })
      .eq("site_key", "main");
    if (error) throw new Error(`บันทึก Hero ไม่สำเร็จ: ${error.message}`);

    if (newPath && current.hero_image_path && current.hero_image_path !== newPath) {
      await removeSiteImage(supabase, current.hero_image_path);
    }
    await recordAudit(supabase, "homepage_hero_updated", {
      visual_mode: parsed.data.visualMode,
      image_changed: Boolean(newPath),
      is_visible: parsed.data.isVisible,
    });
    refreshHomepage();
  } catch (error) {
    failure = errorMessage(error, "บันทึก Hero ไม่สำเร็จ");
    if (newPath) {
      try {
        const { supabase } = await requireAdmin();
        await removeSiteImage(supabase, newPath);
      } catch {
        // Preserve the original failure message.
      }
    }
  }

  if (failure) feedbackRedirect("error", failure, "hero");
  feedbackRedirect("saved", "บันทึก Hero และเผยแพร่บนหน้าหลักแล้ว", "hero");
}

export async function removeHeroImageAction() {
  let failure: string | null = null;
  try {
    const { user, supabase } = await requireAdmin();
    const current = await getCurrentSettings(supabase);
    const { error } = await supabase
      .from("site_homepage_settings")
      .update({ hero_image_path: null, hero_visual_mode: "phone", updated_by: user.id })
      .eq("site_key", "main");
    if (error) throw new Error(error.message);
    await removeSiteImage(supabase, current.hero_image_path);
    await recordAudit(supabase, "homepage_hero_image_removed", {});
    refreshHomepage();
  } catch (error) {
    failure = errorMessage(error, "ลบภาพ Hero ไม่สำเร็จ");
  }
  if (failure) feedbackRedirect("error", failure, "hero");
  feedbackRedirect("saved", "ลบภาพ Hero แล้วและเปลี่ยนเป็นภาพโทรศัพท์จำลอง", "hero");
}

export async function saveFooterSettingsAction(formData: FormData) {
  const parsed = footerSchema.safeParse({
    isVisible: checked(formData, "isVisible"),
    description: text(formData, "description"),
    contactHeading: text(formData, "contactHeading"),
    contactLine1: text(formData, "contactLine1"),
    contactLine2: text(formData, "contactLine2"),
    socialHeading: text(formData, "socialHeading"),
    facebookLabel: text(formData, "facebookLabel"),
    facebookUrl: text(formData, "facebookUrl"),
    youtubeLabel: text(formData, "youtubeLabel"),
    youtubeUrl: text(formData, "youtubeUrl"),
    lineLabel: text(formData, "lineLabel"),
    lineUrl: text(formData, "lineUrl"),
    copyright: text(formData, "copyright"),
    technology: text(formData, "technology"),
  });
  if (!parsed.success) feedbackRedirect("error", parsed.error.issues[0]?.message ?? "ข้อมูล Footer ไม่ถูกต้อง", "footer");

  let failure: string | null = null;
  try {
    const { user, supabase } = await requireAdmin();
    const { error } = await supabase
      .from("site_homepage_settings")
      .update({
        footer_is_visible: parsed.data.isVisible,
        footer_description: parsed.data.description,
        footer_contact_heading: parsed.data.contactHeading,
        footer_contact_line_1: parsed.data.contactLine1,
        footer_contact_line_2: parsed.data.contactLine2,
        footer_social_heading: parsed.data.socialHeading,
        footer_facebook_label: parsed.data.facebookLabel,
        footer_facebook_url: parsed.data.facebookUrl,
        footer_youtube_label: parsed.data.youtubeLabel,
        footer_youtube_url: parsed.data.youtubeUrl,
        footer_line_label: parsed.data.lineLabel,
        footer_line_url: parsed.data.lineUrl,
        footer_copyright: parsed.data.copyright,
        footer_technology: parsed.data.technology,
        updated_by: user.id,
      })
      .eq("site_key", "main");
    if (error) throw new Error(`บันทึก Footer ไม่สำเร็จ: ${error.message}`);
    await recordAudit(supabase, "homepage_footer_updated", {
      is_visible: parsed.data.isVisible,
    });
    refreshHomepage();
  } catch (error) {
    failure = errorMessage(error, "บันทึก Footer ไม่สำเร็จ");
  }

  if (failure) feedbackRedirect("error", failure, "footer");
  feedbackRedirect("saved", "บันทึก Footer และเผยแพร่บนหน้าหลักแล้ว", "footer");
}

export async function saveNavigationItemAction(formData: FormData) {
  const parsed = navigationSchema.safeParse({
    id: text(formData, "id"),
    label: text(formData, "label"),
    url: text(formData, "url"),
    iconName: text(formData, "iconName"),
    displayOrder: text(formData, "displayOrder"),
    isVisible: checked(formData, "isVisible"),
    openNewTab: checked(formData, "openNewTab"),
  });
  if (!parsed.success) feedbackRedirect("error", parsed.error.issues[0]?.message ?? "ข้อมูลเมนูไม่ถูกต้อง", "navigation");

  let failure: string | null = null;
  try {
    const { user, supabase } = await requireAdmin();
    const payload = {
      location: "header" as const,
      label: parsed.data.label,
      url: parsed.data.url,
      icon_name: parsed.data.iconName,
      display_order: parsed.data.displayOrder,
      is_visible: parsed.data.isVisible,
      open_new_tab: parsed.data.openNewTab,
      updated_by: user.id,
    };

    if (parsed.data.id) {
      const { error } = await supabase.from("site_navigation_items").update(payload).eq("id", parsed.data.id);
      if (error) throw new Error(`แก้ไขเมนูไม่สำเร็จ: ${error.message}`);
    } else {
      const { error } = await supabase.from("site_navigation_items").insert(payload);
      if (error) throw new Error(`เพิ่มเมนูไม่สำเร็จ: ${error.message}`);
    }

    await recordAudit(supabase, parsed.data.id ? "homepage_navigation_updated" : "homepage_navigation_created", {
      navigation_id: parsed.data.id || null,
      label: parsed.data.label,
      url: parsed.data.url,
    });
    refreshHomepage();
  } catch (error) {
    failure = errorMessage(error, "บันทึกเมนูไม่สำเร็จ");
  }

  if (failure) feedbackRedirect("error", failure, "navigation");
  feedbackRedirect("saved", parsed.data.id ? "แก้ไขเมนูแล้ว" : "เพิ่มเมนูแล้ว", "navigation");
}

export async function deleteNavigationItemAction(formData: FormData) {
  const id = text(formData, "id");
  if (!z.string().uuid().safeParse(id).success) feedbackRedirect("error", "รหัสเมนูไม่ถูกต้อง", "navigation");

  let failure: string | null = null;
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("site_navigation_items").delete().eq("id", id);
    if (error) throw new Error(`ลบเมนูไม่สำเร็จ: ${error.message}`);
    await recordAudit(supabase, "homepage_navigation_deleted", { navigation_id: id });
    refreshHomepage();
  } catch (error) {
    failure = errorMessage(error, "ลบเมนูไม่สำเร็จ");
  }

  if (failure) feedbackRedirect("error", failure, "navigation");
  feedbackRedirect("saved", "ลบเมนูแล้ว", "navigation");
}
