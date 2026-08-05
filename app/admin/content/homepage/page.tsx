import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  PanelBottom,
  ImageIcon,
  PanelTop,
  Link2,
  Menu,
  Monitor,
  Palette,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import { signOut } from "@/app/actions";
import {
  deleteNavigationItemAction,
  removeHeaderLogoAction,
  removeHeroImageAction,
  saveFooterSettingsAction,
  saveHeaderSettingsAction,
  saveHeroSettingsAction,
  saveNavigationItemAction,
} from "@/app/phase8-actions";
import { CmsSubmitButton } from "@/components/phase8/cms-submit-button";
import { requireRole } from "@/lib/auth/require-role";
import { getHomepageCmsDashboard, type SiteNavigationIcon } from "@/lib/data/phase8";

export const metadata: Metadata = { title: "จัดการหน้าหลัก | TK Mooc" };

type HomepageCmsPageProps = {
  searchParams: Promise<{ saved?: string; error?: string; section?: string }>;
};

const iconOptions: Array<{ value: SiteNavigationIcon; label: string }> = [
  { value: "home", label: "หน้าหลัก" },
  { value: "teacher", label: "ครู" },
  { value: "student", label: "นักเรียน" },
  { value: "about", label: "เกี่ยวกับ" },
  { value: "book", label: "หนังสือ/คู่มือ" },
  { value: "calendar", label: "ปฏิทิน" },
  { value: "info", label: "ข้อมูล" },
  { value: "megaphone", label: "ประกาศ" },
  { value: "link", label: "ลิงก์" },
];

export default async function HomepageCmsPage({ searchParams }: HomepageCmsPageProps) {
  await requireRole("admin");
  const feedback = await searchParams;

  let dashboard: Awaited<ReturnType<typeof getHomepageCmsDashboard>>;
  try {
    dashboard = await getHomepageCmsDashboard();
  } catch (error) {
    const message = error instanceof Error ? error.message : "โหลดข้อมูล Phase 8.1 ไม่สำเร็จ";
    return <MigrationRequired message={message} />;
  }

  const { settings, navigation, logoUrl, heroImageUrl } = dashboard;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-sky-500 p-7 text-white shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <span className="text-xs font-black tracking-[0.22em] text-blue-100">PHASE 8.2 · HOMEPAGE CMS</span>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">จัดการ Header, Hero และ Footer</h1>
              <p className="mt-3 max-w-3xl leading-7 text-blue-100">
                แก้ไขข้อความ เมนู โลโก้ ภาพ Hero ปุ่ม และข้อมูลติดต่อ โดยข้อมูลที่บันทึกจะเผยแพร่บนหน้าหลักทันที
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/launch" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20">
                <ArrowLeft size={16} /> ศูนย์เปิดใช้งาน
              </Link>
              <Link href="/admin/content/sections" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20">จัดการ Section</Link>
              <Link href="/" target="_blank" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20">
                <Eye size={16} /> เปิดหน้าหลัก
              </Link>
              <form action={signOut}>
                <button type="submit" className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20">ออกจากระบบ</button>
              </form>
            </div>
          </div>
        </header>

        {feedback.saved ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800">{feedback.saved}</div>
        ) : null}
        {feedback.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 font-bold text-rose-800">{feedback.error}</div>
        ) : null}

        <nav className="sticky top-3 z-30 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <Anchor href="#header" icon={<PanelTop size={16} />} label="Header" />
          <Anchor href="#navigation" icon={<Menu size={16} />} label="เมนู" />
          <Anchor href="#hero" icon={<Monitor size={16} />} label="Hero" />
          <Anchor href="#footer" icon={<PanelBottom size={16} />} label="Footer" />
        </nav>

        <section id="header" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading icon={<PanelTop />} title="Header และแบรนด์เว็บไซต์" description="กำหนดชื่อระบบ คำโปรย โลโก้ ปุ่มเข้าสู่ระบบ และ Dark mode" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <form action={saveHeaderSettingsAction} className="grid gap-4 md:grid-cols-2">
              <Field label="ชื่อเว็บไซต์"><input name="siteName" defaultValue={settings.header_site_name} required /></Field>
              <Field label="คำโปรยใต้ชื่อเว็บไซต์"><input name="tagline" defaultValue={settings.header_tagline} /></Field>
              <Field label="ข้อความอธิบายโลโก้"><input name="logoAlt" defaultValue={settings.header_logo_alt} required /></Field>
              <Field label="ข้อความปุ่มเมื่อยังไม่เข้าสู่ระบบ"><input name="loginLabel" defaultValue={settings.header_login_label} required /></Field>
              <Field label="ข้อความปุ่มหลังเข้าสู่ระบบ"><input name="loggedInLabel" defaultValue={settings.header_logged_in_label} required /></Field>
              <Field label="อัปโหลดโลโก้ใหม่" hint="JPG, PNG หรือ WebP ไม่เกิน 4 MB">
                <input type="file" name="logoFile" accept="image/jpeg,image/png,image/webp" />
              </Field>
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold">
                <input type="checkbox" name="showTagline" defaultChecked={settings.header_show_tagline} className="h-4 w-4 accent-blue-600" /> แสดงคำโปรยใต้ชื่อเว็บไซต์
              </label>
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold">
                <input type="checkbox" name="showThemeToggle" defaultChecked={settings.header_show_theme_toggle} className="h-4 w-4 accent-blue-600" /> แสดงปุ่ม Light/Dark mode
              </label>
              <CmsSubmitButton label="บันทึกและเผยแพร่ Header" className="md:col-span-2" />
            </form>

            <PreviewCard title="ตัวอย่างแบรนด์">
              <div className="grid min-h-48 place-items-center rounded-2xl bg-gradient-to-br from-slate-950 to-blue-700 p-6 text-center text-white">
                {logoUrl ? <img src={logoUrl} alt={settings.header_logo_alt} className="h-24 w-24 rounded-3xl bg-white object-contain p-2 shadow-xl" /> : <Palette size={64} />}
                <strong className="mt-4 text-2xl">{settings.header_site_name}</strong>
                {settings.header_show_tagline ? <small className="mt-1 text-blue-100">{settings.header_tagline}</small> : null}
              </div>
              {settings.header_logo_path ? (
                <form action={removeHeaderLogoAction} className="mt-3">
                  <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-3 font-bold text-rose-700 hover:bg-rose-50">
                    <Trash2 size={16} /> ลบโลโก้และใช้ไอคอนเริ่มต้น
                  </button>
                </form>
              ) : null}
            </PreviewCard>
          </div>
        </section>

        <section id="navigation" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading icon={<Menu />} title="เมนูด้านบน" description="เพิ่ม แก้ไข ซ่อน เปิดลิงก์ในแท็บใหม่ และกำหนดลำดับเมนู" />

          <div className="mt-6 grid gap-4">
            {navigation.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <form action={saveNavigationItemAction} className="grid gap-3 lg:grid-cols-[1.1fr_1.4fr_180px_100px_auto_auto] lg:items-end">
                  <input type="hidden" name="id" value={item.id} />
                  <Field label="ชื่อเมนู"><input name="label" defaultValue={item.label} required /></Field>
                  <Field label="ลิงก์"><input name="url" defaultValue={item.url} required /></Field>
                  <Field label="ไอคอน">
                    <select name="iconName" defaultValue={item.icon_name}>{iconOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                  </Field>
                  <Field label="ลำดับ"><input type="number" name="displayOrder" min={0} max={999} defaultValue={item.display_order} /></Field>
                  <div className="grid gap-2 pb-1 text-sm font-bold">
                    <label className="flex items-center gap-2"><input type="checkbox" name="isVisible" defaultChecked={item.is_visible} className="accent-blue-600" /> แสดง</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="openNewTab" defaultChecked={item.open_new_tab} className="accent-blue-600" /> แท็บใหม่</label>
                  </div>
                  <CmsSubmitButton label="บันทึก" className="min-w-28" />
                </form>
                <form action={deleteNavigationItemAction} className="mt-3 flex justify-end border-t border-slate-200 pt-3">
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50"><Trash2 size={15} /> ลบเมนู</button>
                </form>
              </article>
            ))}
          </div>

          <form action={saveNavigationItemAction} className="mt-6 grid gap-3 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 p-4 lg:grid-cols-[1.1fr_1.4fr_180px_100px_auto_auto] lg:items-end">
            <input type="hidden" name="id" value="" />
            <Field label="ชื่อเมนูใหม่"><input name="label" placeholder="เช่น ข่าวสาร" required /></Field>
            <Field label="ลิงก์"><input name="url" placeholder="#news หรือ https://..." required /></Field>
            <Field label="ไอคอน"><select name="iconName" defaultValue="link">{iconOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
            <Field label="ลำดับ"><input type="number" name="displayOrder" min={0} max={999} defaultValue={50} /></Field>
            <div className="grid gap-2 pb-1 text-sm font-bold"><label className="flex items-center gap-2"><input type="checkbox" name="isVisible" defaultChecked className="accent-blue-600" /> แสดง</label><label className="flex items-center gap-2"><input type="checkbox" name="openNewTab" className="accent-blue-600" /> แท็บใหม่</label></div>
            <CmsSubmitButton label="เพิ่มเมนู" className="min-w-28" />
          </form>
        </section>

        <section id="hero" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading icon={<Monitor />} title="Hero Section" description="แก้หัวข้อ ข้อความ ปุ่ม รูปภาพ และรูปแบบภาพประกอบด้านขวา" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <form action={saveHeroSettingsAction} className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4 text-sm font-bold md:col-span-2"><input type="checkbox" name="isVisible" defaultChecked={settings.hero_is_visible} className="h-4 w-4 accent-blue-600" /> แสดง Hero Section บนหน้าหลัก</label>
              <Field label="ป้ายข้อความด้านบน"><input name="badge" defaultValue={settings.hero_badge} /></Field>
              <Field label="รูปแบบภาพประกอบ">
                <select name="visualMode" defaultValue={settings.hero_visual_mode}><option value="phone">โทรศัพท์จำลอง</option><option value="image">รูปภาพที่อัปโหลด</option><option value="none">ไม่แสดงภาพประกอบ</option></select>
              </Field>
              <Field label="หัวข้อบรรทัดหลัก"><input name="titlePrimary" defaultValue={settings.hero_title_primary} required /></Field>
              <Field label="ข้อความเน้นสีน้ำเงิน"><input name="titleAccent" defaultValue={settings.hero_title_accent} required /></Field>
              <Field label="คำอธิบาย" className="md:col-span-2"><textarea name="description" rows={4} defaultValue={settings.hero_description} required /></Field>
              <Field label="ข้อความปุ่มหลัก"><input name="primaryLabel" defaultValue={settings.hero_primary_label} required /></Field>
              <Field label="ลิงก์ปุ่มหลัก"><input name="primaryUrl" defaultValue={settings.hero_primary_url} required /></Field>
              <Field label="ข้อความปุ่มรอง"><input name="secondaryLabel" defaultValue={settings.hero_secondary_label} required /></Field>
              <Field label="ลิงก์ปุ่มรอง"><input name="secondaryUrl" defaultValue={settings.hero_secondary_url} required /></Field>
              <Field label="อัปโหลดภาพ Hero" hint="แนะนำภาพแนวนอน 1600×1000 px, JPG/PNG/WebP ไม่เกิน 4 MB"><input type="file" name="heroImageFile" accept="image/jpeg,image/png,image/webp" /></Field>
              <Field label="ข้อความอธิบายภาพ"><input name="imageAlt" defaultValue={settings.hero_image_alt} required /></Field>
              <CmsSubmitButton label="บันทึกและเผยแพร่ Hero" className="md:col-span-2" />
            </form>

            <PreviewCard title="ภาพ Hero ปัจจุบัน">
              <div className="grid min-h-64 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 to-sky-500 p-4 text-white">
                {heroImageUrl ? <img src={heroImageUrl} alt={settings.hero_image_alt} className="h-full max-h-72 w-full rounded-xl object-cover shadow-xl" /> : <ImageIcon size={72} />}
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">โหมดปัจจุบัน: <strong>{settings.hero_visual_mode}</strong></div>
              {settings.hero_image_path ? (
                <form action={removeHeroImageAction} className="mt-3">
                  <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-3 font-bold text-rose-700 hover:bg-rose-50"><Trash2 size={16} /> ลบภาพ Hero</button>
                </form>
              ) : null}
            </PreviewCard>
          </div>
        </section>

        <section id="footer" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading icon={<PanelBottom />} title="Footer" description="กำหนดข้อความติดต่อ ช่องทางออนไลน์ ลิขสิทธิ์ และข้อความเทคโนโลยี" />
          <form action={saveFooterSettingsAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4 text-sm font-bold md:col-span-2"><input type="checkbox" name="isVisible" defaultChecked={settings.footer_is_visible} className="h-4 w-4 accent-blue-600" /> แสดง Footer บนหน้าหลัก</label>
            <Field label="คำอธิบายเว็บไซต์" className="md:col-span-2"><textarea name="description" rows={3} defaultValue={settings.footer_description} /></Field>
            <Field label="หัวข้อติดต่อ"><input name="contactHeading" defaultValue={settings.footer_contact_heading} required /></Field>
            <Field label="ข้อมูลติดต่อบรรทัดที่ 1"><input name="contactLine1" defaultValue={settings.footer_contact_line_1} /></Field>
            <Field label="ข้อมูลติดต่อบรรทัดที่ 2"><input name="contactLine2" defaultValue={settings.footer_contact_line_2} /></Field>
            <Field label="หัวข้อช่องทางออนไลน์"><input name="socialHeading" defaultValue={settings.footer_social_heading} required /></Field>
            <SocialFields labelName="facebookLabel" urlName="facebookUrl" label="Facebook" defaultLabel={settings.footer_facebook_label} defaultUrl={settings.footer_facebook_url} />
            <SocialFields labelName="youtubeLabel" urlName="youtubeUrl" label="YouTube" defaultLabel={settings.footer_youtube_label} defaultUrl={settings.footer_youtube_url} />
            <SocialFields labelName="lineLabel" urlName="lineUrl" label="LINE" defaultLabel={settings.footer_line_label} defaultUrl={settings.footer_line_url} />
            <Field label="ข้อความลิขสิทธิ์"><input name="copyright" defaultValue={settings.footer_copyright} required /></Field>
            <Field label="ข้อความเทคโนโลยี"><input name="technology" defaultValue={settings.footer_technology} /></Field>
            <CmsSubmitButton label="บันทึกและเผยแพร่ Footer" className="md:col-span-2" />
          </form>
        </section>

        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 text-blue-950">
          <div className="flex items-start gap-3"><Settings className="mt-1 shrink-0" /><div><h2 className="text-lg font-black">การเผยแพร่ใน Phase 8.1</h2><p className="mt-2 leading-7">ทุกครั้งที่กดบันทึก ระบบจะอัปเดตฐานข้อมูล บันทึก Audit log และรีเฟรชหน้าหลักทันที ระบบฉบับร่าง การตั้งเวลา และประวัติเวอร์ชันจะพัฒนาต่อใน Phase 8.4</p></div></div>
        </section>
      </div>
    </main>
  );
}

function MigrationRequired({ message }: { message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-slate-900">
      <section className="w-full max-w-2xl rounded-3xl border border-amber-200 bg-white p-8 shadow-xl">
        <Upload className="text-amber-600" size={44} />
        <h1 className="mt-4 text-3xl font-black">กรุณารัน SQL Phase 8.1 ก่อน</h1>
        <p className="mt-3 leading-7 text-slate-600">{message}</p>
        <code className="mt-5 block rounded-xl bg-slate-950 p-4 text-sm text-slate-100">supabase/migrations/0008_phase8_1_homepage_cms.sql</code>
        <Link href="/admin/launch" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"><ArrowLeft size={16} /> กลับศูนย์เปิดใช้งาน</Link>
      </section>
    </main>
  );
}

function Anchor({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return <a href={href} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">{icon}{label}</a>;
}

function SectionHeading({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">{icon}</span><div><h2 className="text-2xl font-black">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div></div>;
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return <label className={`grid gap-2 text-sm font-bold ${className}`}><span>{label}</span><div className="[&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200 [&_input]:px-4 [&_input]:py-3 [&_input]:font-normal [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-200 [&_select]:px-4 [&_select]:py-3 [&_select]:font-normal [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:font-normal">{children}</div>{hint ? <small className="font-normal text-slate-500">{hint}</small> : null}</label>;
}

function PreviewCard({ title, children }: { title: string; children: ReactNode }) {
  return <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center gap-2 font-black"><Eye size={17} className="text-blue-600" />{title}</div>{children}</aside>;
}

function SocialFields({ labelName, urlName, label, defaultLabel, defaultUrl }: { labelName: string; urlName: string; label: string; defaultLabel: string; defaultUrl: string }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[.7fr_1.3fr] md:col-span-2">
      <Field label={`ข้อความ ${label}`}><input name={labelName} defaultValue={defaultLabel} /></Field>
      <Field label={`ลิงก์ ${label}`}><input name={urlName} defaultValue={defaultUrl} placeholder="https://..." /></Field>
    </div>
  );
}
