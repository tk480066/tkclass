import type { Metadata } from "next";
import { Award, BookOpenCheck, GraduationCap, Percent, TimerReset } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { getStudentGrades } from "@/lib/data/phase5";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "คะแนนของฉัน" };

export default async function StudentGradesPage() {
  const user = await requireRole("student");
  const courses = await getStudentGrades(user.id);
  const publishedCourses = courses.filter((course) => course.publish_final_grade && course.total_percent !== null);
  const average = publishedCourses.length ? Math.round((publishedCourses.reduce((sum, course) => sum + (course.total_percent ?? 0), 0) / publishedCourses.length) * 10) / 10 : null;
  const passed = publishedCourses.filter((course) => (course.total_percent ?? 0) >= 50).length;
  const attendanceAverage = courses.filter((course) => course.attendance_percent !== null).length
    ? Math.round((courses.reduce((sum, course) => sum + (course.attendance_percent ?? 0), 0) / courses.filter((course) => course.attendance_percent !== null).length) * 10) / 10
    : null;
  return (
    <DashboardShell user={user} title="คะแนนและผลการเรียนของฉัน" description="ดูคะแนนงาน แบบทดสอบ คะแนนเพิ่มเติม ผลรวมตามหมวด และเปอร์เซ็นต์การเข้าเรียนของแต่ละรายวิชา">
      <div className="phase2-dashboard-grid student-metric-grid">
        <Metric icon={<BookOpenCheck />} label="รายวิชา" value={courses.length} suffix="วิชา" />
        <Metric icon={<Percent />} label="คะแนนเฉลี่ย" value={average ?? 0} suffix={average === null ? "-" : "%"} />
        <Metric icon={<Award />} label="ผ่านเกณฑ์" value={passed} suffix="วิชา" />
        <Metric icon={<TimerReset />} label="เวลาเรียนเฉลี่ย" value={attendanceAverage ?? 0} suffix={attendanceAverage === null ? "-" : "%"} />
      </div>

      <div className="phase5-student-grade-grid">
        {courses.map((course) => (
          <section className="phase5-student-grade-card" key={course.class_id}>
            <header>
              <div><small>{course.class_code} · {course.class_name}</small><h2>{course.subject_name}</h2><p>ครู {course.teacher_name}</p></div>
              <div className="phase5-final-grade"><small>ผลการเรียน</small><strong>{course.publish_final_grade ? course.letter_grade ?? "-" : "รอ"}</strong><span>{course.publish_final_grade && course.total_percent !== null ? `${course.total_percent}%` : "ยังไม่เผยแพร่"}</span></div>
            </header>
            <div className="phase5-attendance-summary"><GraduationCap size={18} /><span>เวลาเรียน {course.attendance_percent === null ? "ยังไม่มีข้อมูล" : `${course.attendance_percent}%`}</span>{course.attendance_percent !== null && course.attendance_percent < course.minimum_attendance_percent && <em>ต่ำกว่าเกณฑ์ {course.minimum_attendance_percent}%</em>}</div>
            <div className="phase5-category-bars">
              {course.categories.map((category) => (
                <div key={category.id}><div><strong>{category.name}</strong><span>{category.percent === null ? "-" : `${category.percent}%`} · น้ำหนัก {category.weight_percent}%</span></div><i><b style={{ width: `${Math.min(category.percent ?? 0, 100)}%` }} /></i></div>
              ))}
            </div>
            <div className="phase5-student-item-list">
              {course.items.map((item) => (
                <div key={item.id}><span className={`phase5-source-icon source-${item.source_type}`}>{item.source_type === "assignment" ? "A" : item.source_type === "quiz" ? "Q" : "+"}</span><div><small>{item.category_name}</small><strong>{item.title}</strong>{item.feedback && <em>{item.feedback}</em>}</div><b>{item.score === null ? "-" : `${item.score}/${item.max_score}`}</b></div>
              ))}
              {!course.items.length && <div className="phase2-empty-state small"><BookOpenCheck size={30} /><p>ครูยังไม่ได้เผยแพร่รายการคะแนน</p></div>}
            </div>
          </section>
        ))}
        {!courses.length && <div className="phase2-empty-state full-span"><GraduationCap size={38} /><h3>ยังไม่มีข้อมูลคะแนน</h3><p>เมื่อมีรายวิชาและครูเผยแพร่คะแนน ระบบจะแสดงข้อมูลที่นี่</p></div>}
      </div>
    </DashboardShell>
  );
}

function Metric({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number; suffix: string }) {
  return <article className="phase2-metric-card"><span>{icon}</span><div><strong>{value}<em>{suffix}</em></strong><small>{label}</small></div></article>;
}
