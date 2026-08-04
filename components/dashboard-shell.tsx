import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Home,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  School,
  UserRound,
} from "lucide-react";
import { signOut } from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AuthUserWithProfile } from "@/lib/types";

export function DashboardShell({
  user,
  title,
  description,
  children,
}: {
  user: AuthUserWithProfile;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const isTeacher = user.profile.role === "teacher";
  return (
    <main className="dashboard-page site-dashboard-page">
      <div className="dashboard-frame site-dashboard-frame">
        <header className="dashboard-header site-dashboard-header">
          <Link href="/"><BrandMark /></Link>
          <nav className="dashboard-nav-links" aria-label="เมนูระบบ">
            <Link href={isTeacher ? "/teacher" : "/student"}><Home size={15} /> ภาพรวม</Link>
            {isTeacher ? (
              <>
                <Link href="/teacher/classes"><School size={15} /> ชั้นเรียน</Link>
                <Link href="/teacher/classes"><LibraryBig size={15} /> บทเรียน</Link>
                <Link href="/teacher/assignments"><ClipboardList size={15} /> งานและการส่งงาน</Link>
              </>
            ) : (
              <>
                <Link href="/student/courses"><GraduationCap size={15} /> รายวิชาของฉัน</Link>
                <Link href="/student/courses"><BookOpen size={15} /> บทเรียน</Link>
                <Link href="/student/assignments"><ClipboardList size={15} /> งานของฉัน</Link>
              </>
            )}
          </nav>
          <div className="dashboard-user-actions">
            <ThemeToggle />
            <span className="user-avatar"><UserRound size={19} /></span>
            <div className="user-meta"><strong>{user.profile.display_name}</strong><small>{user.profile.role}</small></div>
            <form action={signOut}><button className="signout-button" type="submit"><LogOut size={16} /><span>ออกจากระบบ</span></button></form>
          </div>
        </header>

        <section className="dashboard-hero site-dashboard-hero phase3-dashboard-hero">
          <div className="dashboard-hero-copy">
            <span className="dashboard-hero-kicker">TK MOOC · PHASE 3</span>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="dashboard-hero-chip-row">
              <span><CheckCircle2 size={16} /> Classes & Lessons</span>
              <span><CheckCircle2 size={16} /> Assignments & Files</span>
              <span><CheckCircle2 size={16} /> Submission Review</span>
            </div>
          </div>
          <div className="dashboard-hero-widget dashboard-phone-widget float-dashboard" aria-hidden="true">
            <div className="dashboard-widget-title"><strong>Phase 3 readiness</strong><span><LayoutDashboard size={15} /></span></div>
            <div className="widget-progress phase3-widget-progress"><i /></div>
            <div className="dashboard-widget-metrics"><div><strong>100%</strong><small>Assignments</small></div><div><strong>02</strong><small>Storage buckets</small></div></div>
          </div>
        </section>

        <div className="dashboard-content site-dashboard-content">{children}</div>
      </div>
    </main>
  );
}
