import type { Metadata } from "next";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Database,
  Rocket,
  ShieldCheck,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  markMigrationCompletedAction,
  markProductionReadyAction,
  saveLaunchSettingsAction,
  toggleMaintenanceModeAction,
  updateDeploymentCheckAction,
} from "@/app/phase7-actions";
import { signOut } from "@/app/actions";
import { requireRole } from "@/lib/auth/require-role";
import { getPhase7LaunchDashboard } from "@/lib/data/phase7";

export const metadata: Metadata = { title: "ศูนย์เปิดใช้งานระบบ" };

type LaunchPageProps = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

function toBangkokDateTimeLocal(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

export default async function LaunchCenterPage({ searchParams }: LaunchPageProps) {
  await requireRole("admin");
  const feedback = await searchParams;
  const data = await getPhase7LaunchDashboard();
  const maintenance = Boolean(data.settingMap.maintenance_mode);
  const productionReady = Boolean(data.settingMap.production_ready);
  const migrationCompleted = Boolean(data.settingMap.data_migration_completed);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-800 to-sky-500 p-7 text-white shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-[0.2em] text-blue-100">PHASE 7 · GO LIVE CENTER</span>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">ย้ายข้อมูลและเปิดใช้งาน TK Mooc</h1>
              <p className="mt-3 max-w-3xl text-blue-100">ตรวจสถานะฐานข้อมูล การย้ายข้อมูล การ Deploy และแผนย้อนกลับก่อนเปิดให้ครูและนักเรียนใช้งานจริง</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-sm font-bold ${productionReady ? "bg-emerald-400/20 text-emerald-100" : "bg-amber-300/20 text-amber-100"}`}>
                {productionReady ? "พร้อมเปิดใช้งาน" : "กำลังเตรียมเปิดใช้งาน"}
              </span>
              <form action={signOut}>
                <button type="submit" className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
                  ออกจากระบบ
                </button>
              </form>
            </div>
          </div>
        </header>

        {feedback.saved ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800">
            {feedback.saved}
          </div>
        ) : null}
        {feedback.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 font-bold text-rose-800">
            {feedback.error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          <Metric icon={<CheckCircle2 />} label="ผ่าน" value={data.metrics.passed} tone="emerald" />
          <Metric icon={<CircleDashed />} label="รอดำเนินการ" value={data.metrics.pending} tone="blue" />
          <Metric icon={<AlertTriangle />} label="คำเตือน" value={data.metrics.warnings} tone="amber" />
          <Metric icon={<XCircle />} label="ไม่ผ่าน" value={data.metrics.failed} tone="rose" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-blue-600" />
              <div><h2 className="text-xl font-black">Preflight ฐานข้อมูล</h2><p className="text-sm text-slate-500">ตรวจตาราง RLS และ Storage Bucket</p></div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <StatusBox label="Required tables" ok={!data.preflight.missing_tables.length} detail={data.preflight.missing_tables.join(", ") || "ครบ"} />
              <StatusBox label="Row Level Security" ok={!data.preflight.rls_disabled.length} detail={data.preflight.rls_disabled.join(", ") || "เปิดครบ"} />
              <StatusBox label="Storage buckets" ok={!data.preflight.missing_buckets.length} detail={data.preflight.missing_buckets.join(", ") || "ครบ"} />
              <StatusBox label="ภาพรวม" ok={data.preflight.ok} detail={`ผู้ใช้ ${data.preflight.profile_count} · ชั้นเรียน ${data.preflight.class_count}`} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><Wrench className="text-blue-600" /><h2 className="text-xl font-black">Maintenance mode</h2></div>
            <p className="mt-2 text-sm leading-6 text-slate-500">เปิดระหว่างนำเข้าข้อมูลหรือแก้ปัญหาสำคัญ แล้วปิดก่อนประกาศใช้งานจริง</p>
            <div className={`mt-5 rounded-2xl p-4 font-bold ${maintenance ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
              สถานะปัจจุบัน: {maintenance ? "เปิด" : "ปิด"}
            </div>
            <form action={toggleMaintenanceModeAction} className="mt-4">
              <input type="hidden" name="enabled" value={maintenance ? "false" : "true"} />
              <button className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700" type="submit">
                {maintenance ? "ปิด Maintenance mode" : "เปิด Maintenance mode"}
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><Rocket className="text-blue-600" /><h2 className="text-xl font-black">ค่าการเปิดใช้งาน</h2></div>
          <form action={saveLaunchSettingsAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">ปีการศึกษา<input name="academicYear" defaultValue={String(data.settingMap.academic_year ?? 2569)} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">ภาคเรียน<input name="semester" defaultValue={String(data.settingMap.semester ?? 1)} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">วันเวลาเปิดระบบ<input type="datetime-local" name="launchAt" defaultValue={toBangkokDateTimeLocal(data.settingMap.launch_at)} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">อีเมลผู้ดูแล<input type="email" name="supportEmail" defaultValue={String(data.settingMap.support_email ?? "")} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">ข้อความแจ้งเตือนส่วนกลาง<textarea name="announcementBanner" defaultValue={String(data.settingMap.announcement_banner ?? "")} rows={3} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label>
            <button className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 md:col-span-2" type="submit">บันทึกค่าการเปิดใช้งาน</button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><Database className="text-blue-600" /><div><h2 className="text-xl font-black">Go-live checklist</h2><p className="text-sm text-slate-500">เปลี่ยนสถานะหลังตรวจสอบหลักฐานจริงแต่ละรายการ</p></div></div>
          <div className="mt-5 grid gap-3">
            {data.checks.map((check) => (
              <form action={updateDeploymentCheckAction} key={check.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1fr_160px_1fr_auto] md:items-center">
                <input type="hidden" name="checkKey" value={check.check_key} />
                <div><strong>{check.check_label}</strong><small className="mt-1 block text-slate-500">{check.check_key}</small></div>
                <select name="status" defaultValue={check.status} className="rounded-xl border border-slate-200 px-3 py-2">
                  <option value="pending">รอดำเนินการ</option><option value="passed">ผ่าน</option><option value="warning">คำเตือน</option><option value="failed">ไม่ผ่าน</option><option value="skipped">ข้าม</option>
                </select>
                <input name="note" placeholder="หมายเหตุหรือหลักฐาน" defaultValue={String(check.details?.note ?? "")} className="rounded-xl border border-slate-200 px-3 py-2" />
                <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white">บันทึก</button>
              </form>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><Users className="text-blue-600" /><h2 className="text-xl font-black">ประวัติการย้ายข้อมูล</h2></div>
            <div className="mt-4 space-y-3">
              {data.migrationRuns.length ? data.migrationRuns.map((run) => (
                <div key={run.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex justify-between gap-3"><strong>{run.source_label || run.source_system}</strong><span className="text-sm font-bold text-blue-700">{run.status}</span></div>
                  <p className="mt-2 text-sm text-slate-500">ทั้งหมด {run.total_rows} · เพิ่ม {run.inserted_rows} · อัปเดต {run.updated_rows} · ผิดพลาด {run.error_rows}</p>
                </div>
              )) : <p className="text-slate-500">ยังไม่มีประวัติการนำเข้าข้อมูล</p>}
            </div>
            <form action={markMigrationCompletedAction} className="mt-4"><button className="w-full rounded-xl border border-blue-200 px-4 py-3 font-bold text-blue-700" type="submit">{migrationCompleted ? "ยืนยันแล้วว่าย้ายข้อมูลเสร็จ" : "ยืนยันการย้ายข้อมูลเสร็จสมบูรณ์"}</button></form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><Rocket className="text-blue-600" /><h2 className="text-xl font-black">เปิดใช้งานจริง</h2></div>
            <p className="mt-3 leading-7 text-slate-600">ปุ่มนี้จะใช้ได้เมื่อ checklist ทุกข้อเป็น “ผ่าน” หรือ “ข้าม” เท่านั้น หลังจากนั้นให้ปิด Maintenance mode และตรวจ `/api/health` อีกครั้ง</p>
            <form action={markProductionReadyAction} className="mt-5"><button className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700" type="submit">ทำเครื่องหมายว่าพร้อมเปิดใช้งาน</button></form>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "emerald" | "blue" | "amber" | "rose" }) {
  const classes = { emerald: "bg-emerald-50 text-emerald-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700" };
  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><span className={`inline-grid h-11 w-11 place-items-center rounded-2xl ${classes[tone]}`}>{icon}</span><strong className="mt-4 block text-3xl font-black">{value}</strong><small className="text-slate-500">{label}</small></article>;
}
function StatusBox({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return <div className={`rounded-2xl p-4 ${ok ? "bg-emerald-50" : "bg-rose-50"}`}><div className="flex items-center gap-2 font-bold">{ok ? <CheckCircle2 className="text-emerald-600" size={18} /> : <XCircle className="text-rose-600" size={18} />}{label}</div><p className="mt-2 break-words text-sm text-slate-600">{detail}</p></div>;
}
