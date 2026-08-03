import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Home,
  Info,
  LogIn,
  Megaphone,
  MessageCircleMore,
  MonitorPlay,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/auth/require-role";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="site-page" id="home">
      <div className="site-ambient site-ambient-one" />
      <div className="site-ambient site-ambient-two" />

      <header className="floating-header">
        <Link href="/" className="header-brand" aria-label="TK Mooc หน้าหลัก">
          <BrandMark />
        </Link>

        <nav className="main-nav" aria-label="เมนูหลัก">
          <a href="#home"><Home size={16} /> หน้าหลัก</a>
          <a href="#roles"><MonitorPlay size={16} /> สำหรับครู</a>
          <a href="#roles"><CircleUserRound size={16} /> สำหรับนักเรียน</a>
          <a href="#about"><Info size={16} /> เกี่ยวกับ</a>
        </nav>

        <div className="header-actions">
          <ThemeToggle />
          <Link href={user ? "/dashboard" : "/login"} className="admin-button">
            <LogIn size={17} /> {user ? "เข้าสู่ระบบ" : "ผู้ดูแลระบบ"}
          </Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-blue-shape" />
        <div className="hero-dot hero-dot-one" />
        <div className="hero-dot hero-dot-two" />

        <div className="hero-content">
          <span className="hero-label"><Sparkles size={15} /> ห้องเรียนแห่งอนาคต</span>
          <h1>
            เชื่อมต่อการสอน
            <span>อย่างเป็นระบบ</span>
          </h1>
          <p>
            รวมลิงก์ชั้นเรียน ข่าวประกาศ และกิจกรรมสำคัญไว้ในที่เดียว
            พร้อมส่วนจัดการข้อมูลสำหรับผู้ดูแลระบบ
          </p>
          <div className="hero-buttons">
            <Link href="/login" className="button-primary">สำหรับครู <ArrowRight size={17} /></Link>
            <a href="#calendar" className="button-secondary">ดูกิจกรรม</a>
          </div>
        </div>

        <div className="hero-phone-zone" aria-label="ตัวอย่าง TK Mooc Dashboard">
          <div className="hero-phone-shadow" />
          <div className="hero-phone float-phone">
            <div className="phone-speaker" />
            <div className="phone-dashboard-card">
              <small>TK Mooc Dashboard</small>
              <strong>Welcome back!</strong>
              <i /><i className="short" />
            </div>
            <div className="phone-shortcuts">
              <span><BookOpenCheck size={17} /></span>
              <span><CalendarDays size={17} /></span>
            </div>
            <div className="phone-progress-title"><strong>Learning progress</strong><b>72%</b></div>
            <div className="phone-progress-track"><i /></div>
            <div className="phone-lines"><i /><i /><i /></div>
          </div>
          <div className="floating-chip teacher-chip"><MonitorPlay size={18} /><span><small>สำหรับครู</small><strong>จัดการชั้นเรียน</strong></span></div>
          <div className="floating-chip student-chip"><CircleUserRound size={18} /><span><small>สำหรับนักเรียน</small><strong>เรียนรู้ทันที</strong></span></div>
        </div>

        <div className="hero-slider-controls" aria-hidden="true">
          <button type="button"><ChevronLeft size={17} /></button>
          <span /><span className="active" />
          <button type="button"><ChevronRight size={17} /></button>
        </div>
      </section>

      <section className="section role-section" id="roles">
        <ScrollReveal className="section-title centered-title">
          <span>CHOOSE YOUR SPACE</span>
          <h2>เลือกพื้นที่การเรียนรู้ของคุณ</h2>
          <p>เข้าสู่ระบบตามบทบาท เพื่อจัดการชั้นเรียนหรือเริ่มต้นเรียนรู้ได้ทันที</p>
        </ScrollReveal>

        <div className="role-card-grid">
          <ScrollReveal delay={0}>
            <RoleCard
              icon={<MonitorPlay size={25} />}
              title="ระบบสำหรับครู"
              description="จัดการชั้นเรียน เนื้อหา แบบฝึกหัด และติดตามผลการเรียนรู้"
              label="เข้าสู่ระบบครู"
              href="/login"
            />
          </ScrollReveal>
          <ScrollReveal delay={110}>
            <RoleCard
              icon={<CircleUserRound size={25} />}
              title="ระบบสำหรับนักเรียน"
              description="เข้าเรียน ส่งงาน ทำแบบทดสอบ และตรวจสอบความก้าวหน้า"
              label="เข้าสู่ระบบนักเรียน"
              href="/login"
            />
          </ScrollReveal>
        </div>
      </section>

      <section className="section news-section" id="news">
        <ScrollReveal className="section-title centered-title">
          <span>LATEST NEWS</span>
          <h2>ข่าวสารและประกาศ</h2>
          <p>ติดตามข้อมูลสำคัญ ข่าวประชาสัมพันธ์ และประกาศล่าสุดจาก TK Mooc</p>
        </ScrollReveal>

        <div className="news-grid">
          <ScrollReveal delay={0}>
            <NewsCard
              date="22 ส.ค. 2569"
              title="ยินดีต้อนรับสู่ TK Mooc"
              description="ศูนย์รวมการเรียนรู้ ข่าวสาร และกิจกรรมสำหรับครูและนักเรียน"
              pinned
            />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <NewsCard
              date="22 ส.ค. 2569"
              title="เปิดใช้งานระบบห้องเรียนออนไลน์"
              description="ครูและนักเรียนสามารถเข้าใช้งานผ่านระบบตามบทบาทได้แล้ว"
            />
          </ScrollReveal>
        </div>
      </section>

      <section className="section calendar-section" id="calendar">
        <ScrollReveal className="section-title centered-title">
          <span>ACTIVITY CALENDAR</span>
          <h2>ปฏิทินและกิจกรรม</h2>
          <p>ดูวันสำคัญ กำหนดการ และกิจกรรมที่กำลังจะมาถึง</p>
        </ScrollReveal>

        <div className="calendar-layout">
          <ScrollReveal className="calendar-card">
            <div className="calendar-heading">
              <button type="button"><ChevronLeft size={17} /></button>
              <strong>สิงหาคม 2569</strong>
              <button type="button"><ChevronRight size={17} /></button>
            </div>
            <div className="calendar-weekdays">
              {['อา','จ','อ','พ','พฤ','ศ','ส'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="calendar-days">
              {Array.from({ length: 35 }, (_, index) => {
                const value = index < 5 ? 27 + index : index - 4;
                const muted = index < 5 || value > 31;
                return <span key={index} className={`${muted ? 'muted' : ''} ${value === 3 && !muted ? 'selected' : ''}`}>{value > 31 ? value - 31 : value}</span>;
              })}
            </div>
          </ScrollReveal>

          <ScrollReveal className="event-column" delay={120}>
            <article className="event-card">
              <span className="event-icon"><CalendarDays size={21} /></span>
              <div>
                <small>กิจกรรมถัดไป</small>
                <h3>อบรมการใช้งานระบบ TK Mooc</h3>
                <p>22 ส.ค. 2569 · ห้องปฏิบัติการคอมพิวเตอร์</p>
              </div>
            </article>
            <article className="event-card soft-event">
              <span className="event-icon"><UsersRound size={21} /></span>
              <div>
                <small>สำหรับนักเรียน</small>
                <h3>เปิดชั้นเรียนประจำภาคเรียน</h3>
                <p>ตรวจสอบรายวิชาและตารางเรียนผ่านระบบนักเรียน</p>
              </div>
            </article>
          </ScrollReveal>
        </div>
      </section>

      <section className="section links-section" id="about">
        <ScrollReveal className="section-title centered-title">
          <span>USEFUL LINKS</span>
          <h2>ลิงก์และบริการที่เกี่ยวข้อง</h2>
          <p>เข้าถึงคู่มือ ช่องทางสนับสนุน และเว็บไซต์ที่เกี่ยวข้องได้อย่างรวดเร็ว</p>
        </ScrollReveal>

        <div className="link-grid">
          <ScrollReveal delay={0}>
            <a className="useful-link" href="#home">
              <span><BookOpenCheck size={20} /></span>
              <div><strong>คู่มือการใช้งาน</strong><small>รวมคู่มือสำหรับครูและนักเรียน</small></div>
              <ArrowRight size={18} />
            </a>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <a className="useful-link" href="mailto:admin@example.com">
              <span><MessageCircleMore size={20} /></span>
              <div><strong>ติดต่อผู้ดูแลระบบ</strong><small>แจ้งปัญหาการใช้งานและขอความช่วยเหลือ</small></div>
              <ArrowRight size={18} />
            </a>
          </ScrollReveal>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-glow" />
        <div className="footer-main">
          <div className="footer-brand"><BrandMark /><p>พื้นที่เรียนรู้ที่เชื่อมโยงทุกคนอย่างเป็นระบบ</p></div>
          <div><strong>ติดต่อเรา</strong><p>กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี</p><p>admin@example.com</p></div>
          <div><strong>ช่องทางออนไลน์</strong><p>Facebook</p><p>YouTube</p><p>LINE</p></div>
        </div>
        <div className="footer-bottom"><span>© 2026 TK Mooc. All rights reserved.</span><span>Next.js · Supabase · Vercel</span></div>
      </footer>
    </main>
  );
}

function RoleCard({ icon, title, description, label, href }: { icon: React.ReactNode; title: string; description: string; label: string; href: string }) {
  return (
    <article className="role-card">
      <div className="role-card-corner" />
      <span className="role-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link href={href}>{label} <ArrowRight size={17} /></Link>
    </article>
  );
}

function NewsCard({ date, title, description, pinned = false }: { date: string; title: string; description: string; pinned?: boolean }) {
  return (
    <article className="news-card">
      <div className="news-cover">
        {pinned && <span>ปักหมุด</span>}
        <Megaphone size={34} />
      </div>
      <div className="news-content">
        <small>{date}</small>
        <h3>{title}</h3>
        <p>{description}</p>
        <a href="#news">อ่านรายละเอียด <ArrowRight size={16} /></a>
      </div>
    </article>
  );
}
