import Link from "next/link";
import { BarChart3, CalendarDays, Database, Eye, Layers3, LayoutDashboard, Link2, Megaphone, Rocket } from "lucide-react";
import { signOut } from "@/app/actions";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminIndexPage() {
  const user = await requireRole("admin");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-sky-500 p-7 text-white shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-xs font-black tracking-[0.22em] text-blue-100">TK MOOC ADMIN</span>
              <h1 className="mt-3 text-4xl font-black">ศูนย์ผู้ดูแลระบบ</h1>
              <p className="mt-2 text-blue-100">{user.profile.display_name}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/" target="_blank" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"><Eye size={16} /> เปิดเว็บไซต์</Link>
              <form action={signOut}><button className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20" type="submit">ออกจากระบบ</button></form>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <Link href="/admin/launch" className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Rocket /></span>
            <h2 className="mt-5 text-2xl font-black">ศูนย์เปิดใช้งานระบบ</h2>
            <p className="mt-2 leading-7 text-slate-500">ตรวจฐานข้อมูล Migration, Maintenance mode, Go-live checklist และสถานะ Production</p>
          </Link>
          <Link href="/admin/content/homepage" className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-50 text-sky-700"><LayoutDashboard /></span>
            <h2 className="mt-5 text-2xl font-black">จัดการหน้าหลัก</h2>
            <p className="mt-2 leading-7 text-slate-500">แก้ไข Header เมนู Hero รูปภาพ ปุ่ม Footer และข้อมูลติดต่อโดยไม่ต้องแก้โค้ด</p>
          </Link>
          <Link href="/admin/content/sections" className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-700"><Layers3 /></span>
            <h2 className="mt-5 text-2xl font-black">จัดการ Section</h2>
            <p className="mt-2 leading-7 text-slate-500">เรียงลำดับ ซ่อน แสดง แก้ไขหัวข้อ และเพิ่ม Section ข้อความหรือ Call to Action</p>
          </Link>

          <Link href="/admin/content/news" className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700"><Megaphone /></span><h2 className="mt-5 text-2xl font-black">ข่าวสาร</h2><p className="mt-2 leading-7 text-slate-500">เผยแพร่ ปักหมุด ตั้งเวลา และจัดลำดับข่าวบนหน้าหลัก</p></Link>
          <Link href="/admin/content/events" className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CalendarDays /></span><h2 className="mt-5 text-2xl font-black">กิจกรรม</h2><p className="mt-2 leading-7 text-slate-500">จัดการวันเวลา สถานที่ และลิงก์ลงทะเบียนกิจกรรม</p></Link>
          <Link href="/admin/content/statistics" className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-700"><BarChart3 /></span><h2 className="mt-5 text-2xl font-black">สถิติ</h2><p className="mt-2 leading-7 text-slate-500">เลือกตัวเลขอัตโนมัติจากฐานข้อมูลหรือกำหนดค่าเอง</p></Link>
          <Link href="/admin/content/links" className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-50 text-cyan-700"><Link2 /></span><h2 className="mt-5 text-2xl font-black">ลิงก์ที่เกี่ยวข้อง</h2><p className="mt-2 leading-7 text-slate-500">เพิ่มคู่มือ เว็บไซต์ และช่องทางสนับสนุนบนหน้าหลัก</p></Link>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><Database className="text-blue-600" /><div><h2 className="text-xl font-black">สถานะโครงการ</h2><p className="text-sm text-slate-500">Phase 8.3 · News, Events, Statistics & Related Links</p></div></div>
        </section>
      </div>
    </main>
  );
}
