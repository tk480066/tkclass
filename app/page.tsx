import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Database,
  Fingerprint,
  GraduationCap,
  Layers3,
  LockKeyhole,
  MessageCircleMore,
  Play,
  School,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  Zap,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ScrollReveal } from "@/components/scroll-reveal";
import { getCurrentUser } from "@/lib/auth/require-role";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="showcase-page">
      <div className="ambient-orb ambient-orb-one" />
      <div className="ambient-orb ambient-orb-two" />
      <div className="showcase-shell">
        <header className="showcase-nav" id="home">
          <Link href="/" aria-label="TK Mooc หน้าหลัก">
            <BrandMark />
          </Link>

          <nav className="desktop-menu" aria-label="เมนูหลัก">
            <a href="#home">หน้าหลัก</a>
            <a href="#foundation">ระบบพื้นฐาน</a>
            <a href="#roles">ผู้ใช้งาน</a>
            <a href="#security">ความปลอดภัย</a>
          </nav>

          <Link href={user ? "/dashboard" : "/login"} className="nav-cta">
            {user ? "ไปยังระบบ" : "เข้าสู่ระบบ"}
            <ArrowRight size={17} />
          </Link>
        </header>

        <section className="hero-stage">
          <div className="hero-grid" />
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />

          <div className="hero-copy">
            <span className="eyebrow-pill">
              <Sparkles size={16} /> TK MOOC · FOUNDATION
            </span>
            <h1>
              พื้นที่การเรียนรู้
              <span> ที่เชื่อมครูและนักเรียน</span>
            </h1>
            <p>
              ระบบพื้นฐานสำหรับพัฒนา Learning Management System ด้วย Next.js,
              Supabase และ Vercel พร้อมระบบเข้าสู่ระบบ บทบาทผู้ใช้ และการป้องกันข้อมูล
            </p>
            <div className="hero-actions">
              <Link href={user ? "/dashboard" : "/login"} className="primary-action shimmer-button">
                <Play size={18} fill="currentColor" />
                {user ? "เปิด Dashboard" : "เริ่มใช้งานระบบ"}
              </Link>
              <a href="#foundation" className="ghost-action">
                ดูโครงสร้างระบบ <ArrowRight size={18} />
              </a>
            </div>
            <div className="hero-trust-row">
              <span><CheckCircle2 size={17} /> Supabase Auth</span>
              <span><CheckCircle2 size={17} /> Row Level Security</span>
              <span><CheckCircle2 size={17} /> Vercel Ready</span>
            </div>
          </div>

          <SystemMockup />
        </section>

        <section className="content-section" id="foundation">
          <ScrollReveal className="section-heading centered-heading">
            <span className="section-kicker">THE FOUNDATION</span>
            <h2>ระบบพื้นฐานที่ออกแบบให้ต่อยอดได้ง่าย</h2>
            <p>
              โครงสร้างพร้อมสำหรับเพิ่มชั้นเรียน บทเรียน งาน แบบทดสอบ คะแนน และการสื่อสารในระยะถัดไป
            </p>
          </ScrollReveal>

          <div className="feature-strip">
            <ScrollReveal delay={0}>
              <FeatureTile
                icon={<Fingerprint />}
                title="เข้าสู่ระบบปลอดภัย"
                detail="ครูใช้อีเมล นักเรียนใช้รหัส 5 หลักและ PIN"
                number="01"
              />
            </ScrollReveal>
            <ScrollReveal delay={110}>
              <FeatureTile
                icon={<Database />}
                title="ฐานข้อมูล PostgreSQL"
                detail="Profiles, Roles, Classes และ Enrollments"
                number="02"
              />
            </ScrollReveal>
            <ScrollReveal delay={220}>
              <FeatureTile
                icon={<ShieldCheck />}
                title="สิทธิ์ระดับฐานข้อมูล"
                detail="ปกป้องข้อมูลด้วย Row Level Security"
                number="03"
              />
            </ScrollReveal>
          </div>
        </section>

        <section className="split-section soft-panel" id="roles">
          <ScrollReveal className="split-copy">
            <span className="section-kicker">ROLE EXPERIENCE</span>
            <h2>
              Dashboard แยกตามบทบาท
              <span> เห็นเฉพาะสิ่งที่ควรเห็น</span>
            </h2>
            <p>
              ครูและนักเรียนได้รับประสบการณ์ใช้งานที่แตกต่างกัน โดยระบบตรวจสอบทั้ง Session,
              Role และ Policy ในฐานข้อมูล
            </p>
            <div className="check-list">
              <span><BadgeCheck /> ตรวจสอบผู้ใช้จาก Supabase Auth</span>
              <span><BadgeCheck /> Redirect ไปยัง Dashboard ตามบทบาท</span>
              <span><BadgeCheck /> ป้องกันการเข้าถึงข้อมูลข้ามบัญชี</span>
            </div>
            <Link href="/login" className="text-link">
              ทดลองเข้าสู่ระบบ <ArrowRight size={18} />
            </Link>
          </ScrollReveal>

          <ScrollReveal className="role-visual" delay={140}>
            <div className="profile-window float-slow">
              <div className="profile-window-top">
                <span className="mini-avatar"><School size={20} /></span>
                <div><strong>ระบบครู</strong><small>Teacher workspace</small></div>
                <span className="status-dot" />
              </div>
              <div className="profile-stat-grid">
                <div><UsersRound /><strong>6</strong><small>ชั้นเรียน</small></div>
                <div><BookOpenCheck /><strong>12</strong><small>บทเรียน</small></div>
                <div><BarChart3 /><strong>84%</strong><small>ความก้าวหน้า</small></div>
              </div>
              <div className="profile-course-row">
                <span className="course-icon"><Layers3 size={19} /></span>
                <div><strong>วิทยาการคำนวณ</strong><small>มัธยมศึกษาปีที่ 2/1</small></div>
                <span className="progress-ring">76</span>
              </div>
            </div>
            <div className="student-phone float-reverse">
              <div className="phone-notch" />
              <div className="phone-header"><GraduationCap size={18} /><span>นักเรียน</span></div>
              <div className="phone-welcome"><small>สวัสดี</small><strong>ธนกร ใจดี</strong></div>
              <div className="phone-progress"><span style={{ width: "72%" }} /></div>
              <div className="phone-task"><CalendarDays /><div><strong>งานที่ต้องส่ง</strong><small>3 รายการ</small></div></div>
              <div className="phone-task"><MessageCircleMore /><div><strong>ข้อความใหม่</strong><small>1 ข้อความ</small></div></div>
            </div>
          </ScrollReveal>
        </section>

        <section className="split-section reverse-layout" id="security">
          <ScrollReveal className="security-visual">
            <div className="security-card">
              <div className="security-orbit orbit-a" />
              <div className="security-orbit orbit-b" />
              <span className="security-core"><LockKeyhole size={38} /></span>
              <span className="security-badge badge-a"><UserRoundCheck size={18} /> Auth</span>
              <span className="security-badge badge-b"><Database size={18} /> RLS</span>
              <span className="security-badge badge-c"><Zap size={18} /> Edge</span>
            </div>
          </ScrollReveal>

          <ScrollReveal className="split-copy" delay={120}>
            <span className="section-kicker">SECURITY BY DESIGN</span>
            <h2>
              ตรวจสอบสิทธิ์หลายชั้น
              <span> ตั้งแต่หน้าเว็บถึงฐานข้อมูล</span>
            </h2>
            <p>
              ระบบไม่พึ่งการซ่อนเมนูเพียงอย่างเดียว แต่ตรวจ Session ด้วย Proxy ตรวจ Role ใน Server Component
              และใช้ Supabase RLS เป็นชั้นป้องกันสุดท้าย
            </p>
            <div className="metric-row">
              <div><strong>3</strong><span>ชั้นการตรวจสิทธิ์</span></div>
              <div><strong>5</strong><span>ตารางพื้นฐาน</span></div>
              <div><strong>100%</strong><span>Responsive UI</span></div>
            </div>
          </ScrollReveal>
        </section>

        <section className="cta-section">
          <ScrollReveal className="cta-card">
            <div>
              <span className="section-kicker light-kicker">START BUILDING</span>
              <h2>พร้อมเริ่มพัฒนา TK Mooc ระยะต่อไป</h2>
              <p>เข้าสู่ระบบเพื่อทดสอบบทบาทครูและนักเรียนบนโครงสร้าง Supabase ที่เตรียมไว้</p>
            </div>
            <Link href={user ? "/dashboard" : "/login"} className="cta-white-button">
              {user ? "เปิด Dashboard" : "เข้าสู่ระบบ"} <ArrowRight size={18} />
            </Link>
          </ScrollReveal>
        </section>

        <footer className="showcase-footer">
          <BrandMark compact />
          <p>Next.js · Supabase · Vercel</p>
          <span>TK Mooc Phase 1</span>
        </footer>
      </div>
    </main>
  );
}

function SystemMockup() {
  return (
    <div className="hero-visual" aria-label="ตัวอย่าง Dashboard TK Mooc">
      <div className="dashboard-device float-main">
        <div className="device-toolbar">
          <span className="toolbar-dots"><i /><i /><i /></span>
          <span className="toolbar-search">TK Mooc Dashboard</span>
          <span className="toolbar-avatar"><School size={15} /></span>
        </div>
        <div className="device-body">
          <aside className="device-sidebar">
            <span className="active"><BarChart3 /></span>
            <span><BookOpenCheck /></span>
            <span><CalendarDays /></span>
            <span><MessageCircleMore /></span>
          </aside>
          <div className="device-content">
            <div className="device-title"><div><small>ภาพรวมวันนี้</small><strong>ยินดีต้อนรับ ครูปิง</strong></div><span>+ สร้างใหม่</span></div>
            <div className="mini-stat-row">
              <div><small>ชั้นเรียน</small><strong>06</strong><i className="purple" /></div>
              <div><small>นักเรียน</small><strong>186</strong><i className="blue" /></div>
              <div><small>งานรอตรวจ</small><strong>12</strong><i className="pink" /></div>
            </div>
            <div className="chart-panel">
              <div className="chart-heading"><span>ความก้าวหน้าการเรียน</span><small>สัปดาห์นี้</small></div>
              <div className="bar-chart">
                {[34, 52, 43, 66, 58, 82, 72].map((height, index) => (
                  <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="floating-notice notice-one">
        <span><CheckCircle2 size={18} /></span>
        <div><strong>ระบบพร้อมใช้งาน</strong><small>Authentication connected</small></div>
      </div>
      <div className="floating-notice notice-two">
        <span><ShieldCheck size={18} /></span>
        <div><strong>RLS Protected</strong><small>ข้อมูลแยกตามผู้ใช้</small></div>
      </div>
    </div>
  );
}

function FeatureTile({
  icon,
  title,
  detail,
  number,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  number: string;
}) {
  return (
    <article className="feature-tile">
      <div className="feature-illustration"><span>{icon}</span></div>
      <h3>{title}</h3>
      <p>{detail}</p>
      <span className="feature-number">{number}</span>
    </article>
  );
}
