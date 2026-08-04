import type { Metadata } from "next";
import { Clock3, GraduationCap, Wrench } from "lucide-react";

export const metadata: Metadata = { title: "กำลังปรับปรุงระบบ" };

export default function MaintenancePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-blue-950 via-blue-800 to-sky-500 px-4 py-10 text-white">
      <section className="w-full max-w-2xl rounded-[2rem] border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl md:p-12">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-white text-blue-700 shadow-xl"><Wrench size={36} /></span>
        <div className="mt-6 flex items-center justify-center gap-2 text-blue-100"><GraduationCap size={20} /><strong>TK Mooc</strong></div>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">ระบบกำลังอยู่ระหว่างการปรับปรุง</h1>
        <p className="mx-auto mt-4 max-w-xl leading-8 text-blue-100">ผู้ดูแลกำลังย้ายข้อมูลและตรวจสอบความพร้อมก่อนเปิดใช้งาน กรุณากลับมาใหม่อีกครั้งในภายหลัง</p>
        <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 font-bold text-blue-50"><Clock3 size={18} /> ข้อมูลและบัญชีผู้ใช้ยังคงปลอดภัย</div>
      </section>
    </main>
  );
}
