import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileQuestion } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { QuizForm } from "@/components/phase4/quiz-form";
import { QuizStatusBadge } from "@/components/phase4/quiz-status-badge";
import { getClassCurriculum, getTeacherClass } from "@/lib/data/phase2";
import { getTeacherQuizzes } from "@/lib/data/phase4";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "แบบทดสอบของชั้นเรียน" };

export default async function ClassQuizzesPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const user = await requireRole("teacher");
  const [classRow, curriculum, quizzes] = await Promise.all([
    getTeacherClass(user.id, classId),
    getClassCurriculum(user.id, classId),
    getTeacherQuizzes(user.id, classId),
  ]);
  const lessons = curriculum.flatMap((unit) => unit.lessons);
  return (
    <DashboardShell user={user} title={`แบบทดสอบ · ${classRow.subject_name}`} description={`${classRow.class_name} · สร้างแบบทดสอบ กำหนดเวลา จำนวนครั้ง และการแสดงผลคะแนน`}>
      <Link href={`/teacher/classes/${classId}`} className="phase2-back-link"><ArrowLeft size={16} /> กลับหน้าชั้นเรียน</Link>
      <div className="phase4-editor-layout">
        <section className="phase2-section-card">
          <div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">CREATE QUIZ</span><h2>สร้างแบบทดสอบใหม่</h2><p>บันทึกข้อมูลพื้นฐานก่อน แล้วจึงเพิ่มคำถามในหน้ารายละเอียด</p></div></div>
          <QuizForm classRow={classRow} lessons={lessons} />
        </section>
        <section className="phase2-section-card">
          <div className="phase2-section-heading compact"><div><span className="phase-panel-kicker">CLASS QUIZZES</span><h2>แบบทดสอบในชั้นเรียน</h2><p>{quizzes.length} ชุด</p></div></div>
          <div className="phase4-compact-quiz-list">
            {quizzes.map((quiz) => <Link href={`/teacher/quizzes/${quiz.id}`} key={quiz.id}><span><FileQuestion size={18} /></span><div><QuizStatusBadge status={quiz.status} /><strong>{quiz.title}</strong><small>{quiz.question_count} ข้อ · {quiz.total_points} คะแนน · {quiz.attempt_count} ครั้ง</small></div><ArrowRight size={17} /></Link>)}
            {!quizzes.length && <div className="phase2-empty-state small"><FileQuestion size={30} /><p>ยังไม่มีแบบทดสอบในชั้นเรียนนี้</p></div>}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
