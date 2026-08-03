import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "ระบบครู" };

export default async function TeacherPage() {
  const user = await requireRole("teacher");

  return (
    <DashboardShell
      user={user}
      title="พื้นที่ทำงานสำหรับครู"
      description="บัญชีครูผ่านการตรวจสอบจาก Supabase Auth และโปรไฟล์บทบาท teacher พร้อมต่อยอดสู่ระบบจัดการชั้นเรียนและบทเรียน"
    >
      <PhaseCard items={["สร้างและจัดการชั้นเรียน", "นำเข้ารายชื่อนักเรียน", "สร้างบทเรียนและงาน", "เช็กชื่อและสมุดคะแนน"]} />
    </DashboardShell>
  );
}

function PhaseCard({ items }: { items: string[] }) {
  return (
    <div className="phase-panel">
      <span className="phase-panel-kicker">NEXT · PHASE 2</span>
      <h2>ชั้นเรียนและบทเรียน</h2>
      <div className="phase-item-grid">
        {items.map((item) => (
          <div key={item} className="phase-item">
            <CheckCircle2 size={20} /> {item}
          </div>
        ))}
      </div>
    </div>
  );
}
