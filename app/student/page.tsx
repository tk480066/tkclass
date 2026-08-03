import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "ระบบนักเรียน" };

export default async function StudentPage() {
  const user = await requireRole("student");

  return (
    <DashboardShell
      user={user}
      title="พื้นที่การเรียนรู้ของนักเรียน"
      description="นักเรียนเข้าสู่ระบบด้วยรหัส 5 หลักและ PIN โดยข้อมูลบัญชีและชั้นเรียนถูกแยกตามผู้ใช้ด้วย Supabase RLS"
    >
      <div className="phase-panel student-panel">
        <span className="phase-panel-kicker">NEXT · PHASE 2</span>
        <h2>รายวิชาและบทเรียนของฉัน</h2>
        <div className="phase-item-grid">
          {["ดูรายวิชาที่ลงทะเบียน", "เปิดบทเรียน", "ติดตามความก้าวหน้า", "ดูงานที่ต้องส่ง"].map((item) => (
            <div key={item} className="phase-item">
              <CheckCircle2 size={20} /> {item}
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
