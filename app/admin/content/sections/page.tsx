import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Layers3, Plus, Save, Trash2 } from "lucide-react";
import { deleteHomepageSectionAction, moveHomepageSectionAction, saveHomepageSectionAction } from "@/app/phase8-actions";
import { requireRole } from "@/lib/auth/require-role";
import { getHomepageSectionsDashboard, type HomepageSectionBackground, type HomepageSectionType } from "@/lib/data/phase8";

export const metadata: Metadata = { title: "จัดการ Section | TK Mooc" };

type Props = { searchParams: Promise<{ saved?: string; error?: string }> };
const typeOptions: Array<{value:HomepageSectionType;label:string}> = [
  {value:"hero",label:"Hero"},{value:"roles",label:"พื้นที่ครู/นักเรียน"},{value:"news",label:"ข่าวสาร"},
  {value:"calendar",label:"ปฏิทิน"},{value:"links",label:"ลิงก์ที่เกี่ยวข้อง"},{value:"custom_text",label:"ข้อความกำหนดเอง"},{value:"cta",label:"Call to Action"},
];
const backgrounds: Array<{value:HomepageSectionBackground;label:string}> = [
  {value:"default",label:"พื้นหลังปกติ"},{value:"soft",label:"พื้นหลังอ่อน"},{value:"blue",label:"ไล่สีน้ำเงิน"},{value:"dark",label:"พื้นหลังเข้ม"},
];

export default async function SectionsPage({searchParams}:Props){
  await requireRole("admin"); const feedback=await searchParams;
  let sections;
  try { sections=await getHomepageSectionsDashboard(); }
  catch(error){ return <MigrationError message={error instanceof Error?error.message:"โหลดข้อมูลไม่สำเร็จ"}/>; }
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900"><div className="mx-auto max-w-7xl space-y-6">
    <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-sky-500 p-7 text-white shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-5"><div><span className="text-xs font-black tracking-[.22em] text-blue-100">PHASE 8.2 · SECTION MANAGER</span><h1 className="mt-3 text-3xl font-black md:text-5xl">จัดการ Section และลำดับหน้าหลัก</h1><p className="mt-3 max-w-3xl text-blue-100">ซ่อน แสดง แก้ไขหัวข้อ เลื่อนลำดับ และเพิ่ม Section แบบข้อความหรือ Call to Action</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/content/homepage" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold"><ArrowLeft size={16}/> Header / Hero / Footer</Link><Link href="/" target="_blank" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold"><Eye size={16}/> ดูหน้าหลัก</Link></div></div>
    </header>
    {feedback.saved?<div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800">{feedback.saved}</div>:null}
    {feedback.error?<div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 font-bold text-rose-800">{feedback.error}</div>:null}
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><Layers3 className="text-blue-600"/><div><h2 className="text-xl font-black">ลำดับ Section ปัจจุบัน</h2><p className="text-sm text-slate-500">ปุ่มขึ้น–ลงจะสลับตำแหน่งและเผยแพร่ทันที</p></div></div>
      <div className="mt-5 space-y-5">{sections.map((section,index)=><article key={section.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">ลำดับ {index+1} · {section.section_type}</span><h3 className="mt-2 text-xl font-black">{section.title}</h3><p className="text-sm text-slate-500">#{section.section_key} · {section.is_visible?"แสดง":"ซ่อน"} · {section.is_system?"Section ระบบ":"Section กำหนดเอง"}</p></div><div className="flex gap-2"><form action={moveHomepageSectionAction}><input type="hidden" name="id" value={section.id}/><input type="hidden" name="direction" value="up"/><button disabled={index===0} className="rounded-xl border bg-white p-2 disabled:opacity-30" title="เลื่อนขึ้น"><ArrowUp size={18}/></button></form><form action={moveHomepageSectionAction}><input type="hidden" name="id" value={section.id}/><input type="hidden" name="direction" value="down"/><button disabled={index===sections.length-1} className="rounded-xl border bg-white p-2 disabled:opacity-30" title="เลื่อนลง"><ArrowDown size={18}/></button></form></div></div>
        <SectionForm section={section}/>
        {!section.is_system?<form action={deleteHomepageSectionAction} className="mt-3"><input type="hidden" name="id" value={section.id}/><button className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700"><Trash2 size={16}/> ลบ Section</button></form>:null}
      </article>)}</div>
    </section>
    <section className="rounded-3xl border border-dashed border-blue-300 bg-blue-50 p-6"><div className="flex items-center gap-3"><Plus className="text-blue-700"/><div><h2 className="text-xl font-black">เพิ่ม Section ใหม่</h2><p className="text-sm text-blue-700">เหมาะกับข้อความประชาสัมพันธ์ คำเชิญชวน หรือลิงก์สำคัญ</p></div></div><div className="mt-5"><SectionForm/></div></section>
  </div></main>;
}

function SectionForm({section}:{section?:Awaited<ReturnType<typeof getHomepageSectionsDashboard>>[number]}){
  return <form action={saveHomepageSectionAction} className="grid gap-4 md:grid-cols-2">
    <input type="hidden" name="id" value={section?.id??""}/>
    <Field label="คีย์ Section"><input name="sectionKey" required readOnly={section?.is_system} defaultValue={section?.section_key??`custom-${Date.now()}`} className="input"/></Field>
    <Field label="ประเภท"><select name="sectionType" defaultValue={section?.section_type??"custom_text"} disabled={section?.is_system} className="input">{typeOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>{section?.is_system?<input type="hidden" name="sectionType" value={section.section_type}/>:null}</Field>
    <Field label="ข้อความเหนือหัวข้อ"><input name="eyebrow" defaultValue={section?.eyebrow??""} className="input"/></Field>
    <Field label="ชื่อ Section"><input name="title" required defaultValue={section?.title??""} className="input"/></Field>
    <Field label="คำอธิบาย" wide><textarea name="description" defaultValue={section?.description??""} rows={2} className="input"/></Field>
    <Field label="เนื้อหากำหนดเอง" wide><textarea name="body" defaultValue={section?.body??""} rows={4} className="input" placeholder="ใช้กับ custom_text หรือ CTA"/></Field>
    <Field label="ข้อความปุ่ม"><input name="buttonLabel" defaultValue={section?.button_label??""} className="input"/></Field>
    <Field label="ลิงก์ปุ่ม"><input name="buttonUrl" defaultValue={section?.button_url??""} className="input" placeholder="/login หรือ https://..."/></Field>
    <Field label="ลำดับ"><input name="displayOrder" type="number" min="0" max="9999" defaultValue={section?.display_order??100} className="input"/></Field>
    <Field label="พื้นหลัง"><select name="backgroundStyle" defaultValue={section?.background_style??"default"} className="input">{backgrounds.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
    <label className="flex items-center gap-3 font-bold"><input type="checkbox" name="isVisible" defaultChecked={section?.is_visible??true}/> แสดง Section บนหน้าหลัก</label>
    <div className="md:text-right"><button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-black text-white"><Save size={17}/> {section?"บันทึก Section":"เพิ่ม Section"}</button></div>
  </form>;
}
function Field({label,wide=false,children}:{label:string;wide?:boolean;children:ReactNode}){return <label className={`space-y-2 text-sm font-bold ${wide?"md:col-span-2":""}`}><span>{label}</span>{children}</label>}
function MigrationError({message}:{message:string}){return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="max-w-xl rounded-3xl border border-amber-200 bg-white p-8 shadow-xl"><h1 className="text-2xl font-black">ต้องติดตั้ง Phase 8.2 ก่อน</h1><p className="mt-3 text-slate-600">{message}</p><code className="mt-5 block rounded-xl bg-slate-950 p-4 text-sm text-white">supabase/migrations/0009_phase8_2_homepage_sections.sql</code></div></main>}
