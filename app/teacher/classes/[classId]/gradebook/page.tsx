import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Download, GraduationCap, RefreshCw, Settings2, UsersRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { GradeCategoryForm } from "@/components/phase5/grade-category-form";
import { GradeSettingsForm } from "@/components/phase5/grade-settings-form";
import { CustomGradeItemForm } from "@/components/phase5/custom-grade-item-form";
import { GradebookGrid } from "@/components/phase5/gradebook-grid";
import { setGradeItemStatusAction, syncGradebookAction } from "@/app/phase5-actions";
import { getTeacherGradebook } from "@/lib/data/phase5";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "สมุดคะแนนชั้นเรียน" };

export default async function ClassGradebookPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ synced?: string }> }) {
  const [{ classId }, query] = await Promise.all([params, searchParams]);
  const user = await requireRole("teacher");
  const data = await getTeacherGradebook(user.id, classId);
  const weightTotal = data.categories.filter((row) => row.is_active).reduce((sum, row) => sum + Number(row.weight_percent), 0);
  const customItems = data.items.filter((item) => item.source_type === "custom");
  const average = data.students.filter((row) => row.total_percent !== null).length
    ? Math.round((data.students.reduce((sum, row) => sum + (row.total_percent ?? 0), 0) / data.students.filter((row) => row.total_percent !== null).length) * 10) / 10
    : null;
  return (
    <DashboardShell user={user} title={`สมุดคะแนน · ${data.classRow.subject_name}`} description={`${data.classRow.class_code} · ${data.classRow.class_name} · รวมคะแนนงาน แบบทดสอบ คะแนนเพิ่มเติม และเวลาเรียน`}>
      <Link href={`/teacher/classes/${classId}`} className="phase2-back-link"><ArrowLeft size={17} /> กลับหน้าชั้นเรียน</Link>
      {query.synced === "1" && <div className="phase5-feedback success">ซิงก์งานและแบบทดสอบเข้าสมุดคะแนนแล้ว</div>}
      <div className="phase2-dashboard-grid">
        <Metric icon={<UsersRound />} label="นักเรียน" value={data.students.length} suffix="คน" />
        <Metric icon={<BookOpenCheck />} label="รายการคะแนน" value={data.items.length} suffix="รายการ" />
        <Metric icon={<Settings2 />} label="น้ำหนักรวม" value={weightTotal} suffix="%" warning={data.settings.calculation_method === "weighted_categories" && Math.abs(weightTotal - 100) > 0.01} />
        <Metric icon={<GraduationCap />} label="คะแนนเฉลี่ย" value={average ?? 0} suffix={average === null ? "-" : "%"} />
      </div>

      <section className="phase2-section-card">
        <div className="phase2-section-heading"><div><span className="phase-panel-kicker">GRADEBOOK SYNC</span><h2>รายการคะแนนจากระบบ</h2><p>งานและแบบทดสอบจะถูกเพิ่มเป็นรายการคะแนนโดยอัตโนมัติเมื่อซิงก์</p></div><div className="phase5-heading-actions"><Link href={`/teacher/classes/${classId}/gradebook/export`} className="phase2-secondary-button"><Download size={16} /> ส่งออก CSV</Link><form action={syncGradebookAction}><input type="hidden" name="classId" value={classId} /><button className="phase2-secondary-button" type="submit"><RefreshCw size={16} /> ซิงก์งานและแบบทดสอบ</button></form></div></div>
        <div className="phase5-grade-item-list">
          {data.items.map((item) => (
            <article key={item.id}>
              <span className={`phase5-source-icon source-${item.source_type}`}>{item.source_type === "assignment" ? "A" : item.source_type === "quiz" ? "Q" : "+"}</span>
              <div><small>{item.category_name} · {item.source_type}</small><strong>{item.title}</strong><em>{item.max_score} คะแนน · น้ำหนัก {item.item_weight}</em></div>
              <span className={`phase4-status-badge status-${item.status}`}>{item.status === "published" ? "เผยแพร่" : item.status === "draft" ? "ฉบับร่าง" : "เก็บคลัง"}</span>
              <form action={setGradeItemStatusAction}><input type="hidden" name="classId" value={classId} /><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="status" value={item.status === "published" ? "draft" : "published"} /><button type="submit">{item.status === "published" ? "ซ่อน" : "เผยแพร่"}</button></form>
            </article>
          ))}
          {!data.items.length && <div className="phase2-empty-state small"><BookOpenCheck size={30} /><p>ยังไม่มีรายการคะแนน</p></div>}
        </div>
      </section>

      <GradebookGrid classId={classId} items={data.items} students={data.students} entries={data.gradeEntries} />

      <div className="phase5-settings-grid">
        <section className="phase2-section-card">
          <div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">CATEGORIES</span><h2>หมวดและน้ำหนักคะแนน</h2></div></div>
          <div className="phase5-category-summary">{data.categories.map((category) => <div key={category.id}><strong>{category.name}</strong><span>{category.weight_percent}%</span></div>)}</div>
          <GradeCategoryForm classId={classId} />
        </section>
        <section className="phase2-section-card">
          <GradeSettingsForm classId={classId} settings={data.settings} />
          <CustomGradeItemForm classId={classId} categories={data.categories} />
          {customItems.length > 0 && <div className="phase5-custom-item-note">มีคะแนนเพิ่มเติม {customItems.length} รายการ สามารถกรอกคะแนนได้จากตารางด้านบน</div>}
        </section>
      </div>
    </DashboardShell>
  );
}

function Metric({ icon, label, value, suffix, warning = false }: { icon: React.ReactNode; label: string; value: number; suffix: string; warning?: boolean }) {
  return <article className={`phase2-metric-card ${warning ? "phase5-warning-card" : ""}`}><span>{icon}</span><div><strong>{value}<em>{suffix}</em></strong><small>{label}</small></div></article>;
}
