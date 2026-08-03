import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { signOut } from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
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
  return (
    <main className="dashboard-page">
      <div className="dashboard-frame">
        <header className="dashboard-header">
          <Link href="/">
            <BrandMark />
          </Link>

          <nav className="dashboard-nav-links" aria-label="เมนู Dashboard">
            <Link href="/dashboard">ภาพรวม</Link>
            <Link href="#account">บัญชีผู้ใช้</Link>
            <Link href="#permissions">สิทธิ์ระบบ</Link>
          </nav>

          <div className="dashboard-user-actions">
            <span className="user-avatar"><UserRound size={19} /></span>
            <div className="user-meta">
              <strong>{user.profile.display_name}</strong>
              <small>{user.profile.role}</small>
            </div>
            <form action={signOut}>
              <button className="signout-button" type="submit">
                <LogOut size={16} /> <span>ออกจากระบบ</span>
              </button>
            </form>
          </div>
        </header>

        <section className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <span className="dashboard-hero-kicker">PHASE 1 · FOUNDATION DASHBOARD</span>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="dashboard-hero-chip-row">
              <span><CheckCircle2 size={16} /> Supabase Auth</span>
              <span><CheckCircle2 size={16} /> Role Protected</span>
              <span><CheckCircle2 size={16} /> Responsive UI</span>
            </div>
          </div>

          <div className="dashboard-hero-widget float-reverse" aria-hidden="true">
            <div className="dashboard-widget-title">
              <strong>ความพร้อมของระบบ</strong>
              <span><LayoutDashboard size={15} /></span>
            </div>
            <div className="widget-progress"><i /></div>
            <div className="dashboard-widget-metrics">
              <div><strong>76%</strong><small>Foundation</small></div>
              <div><strong>03</strong><small>Security layers</small></div>
            </div>
          </div>
        </section>

        <div className="dashboard-content">
          <section className="dashboard-info-grid" id="account">
            <InfoCard icon={<UserRound />} title="บัญชีผู้ใช้" detail={user.profile.display_name} />
            <InfoCard icon={<ShieldCheck />} title="บทบาทและสิทธิ์" detail={user.profile.role} />
            <InfoCard icon={<BookOpen />} title="สถานะระบบ" detail="พร้อมพัฒนาระยะที่ 2" />
          </section>

          <section className="dashboard-main-panel" id="permissions">{children}</section>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <article className="dashboard-info-card">
      <span className="dashboard-info-icon">{icon}</span>
      <small>{title}</small>
      <strong>{detail}</strong>
    </article>
  );
}
