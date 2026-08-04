import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  GraduationCap,
  Home,
  Info,
  Link2,
  LogIn,
  Megaphone,
  MessageCircleMore,
  MonitorPlay,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SiteBrand } from "@/components/site-brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/auth/require-role";
import {
  getHomepagePublicContent,
  type SiteNavigationIcon,
  type SiteNavigationItem,
} from "@/lib/data/phase8";

export default async function HomePage() {
  const [user, homepage] = await Promise.all([getCurrentUser(), getHomepagePublicContent()]);
  const settings = homepage.settings;

  return (
    <main className="site-page" id="home">
      <div className="site-ambient site-ambient-one" />
      <div className="site-ambient site-ambient-two" />

      <header className="floating-header">
        <Link href="/" className="header-brand" aria-label={`${settings.header_site_name} หน้าหลัก`}>
          <SiteBrand
            siteName={settings.header_site_name}
            tagline={settings.header_tagline}
            logoUrl={homepage.logoUrl}
            logoAlt={settings.header_logo_alt}
            showTagline={settings.header_show_tagline}
          />
        </Link>

        <nav className="main-nav" aria-label="เมนูหลัก">
          {homepage.navigation.map((item) => (
            <NavigationLink key={item.id} item={item} />
          ))}
        </nav>

        <div className="header-actions">
          {settings.header_show_theme_toggle ? <ThemeToggle /> : null}
          <Link href={user ? "/dashboard" : "/login"} className="admin-button">
            <LogIn size={17} />
            {user ? settings.header_logged_in_label : settings.header_login_label}
          </Link>
        </div>
      </header>

      {settings.hero_is_visible ? (
        <section className={`hero-section hero-mode-${settings.hero_visual_mode}`}>
          <div className="hero-blue-shape" />
          <div className="hero-dot hero-dot-one" />
          <div className="hero-dot hero-dot-two" />

          <div className="hero-content">
            {settings.hero_badge ? (
              <span className="hero-label">
                <Sparkles size={15} /> {settings.hero_badge}
              </span>
            ) : null}
            <h1>
              {settings.hero_title_primary}
              <span>{settings.hero_title_accent}</span>
            </h1>
            <p>{settings.hero_description}</p>
            <div className="hero-buttons">
              <SmartLink href={settings.hero_primary_url} className="button-primary">
                {settings.hero_primary_label} <ArrowRight size={17} />
              </SmartLink>
              <SmartLink href={settings.hero_secondary_url} className="button-secondary">
                {settings.hero_secondary_label}
              </SmartLink>
            </div>
          </div>

          {settings.hero_visual_mode === "image" && homepage.heroImageUrl ? (
            <div className="hero-image-zone">
              <div className="hero-image-halo" />
              <div className="hero-image-frame float-dashboard">
                <img src={homepage.heroImageUrl} alt={settings.hero_image_alt} />
              </div>
              <div className="floating-chip teacher-chip">
                <MonitorPlay size={18} />
                <span><small>สำหรับครู</small><strong>จัดการชั้นเรียน</strong></span>
              </div>
              <div className="floating-chip student-chip">
                <CircleUserRound size={18} />
                <span><small>สำหรับนักเรียน</small><strong>เรียนรู้ทันที</strong></span>
              </div>
            </div>
          ) : null}

          {settings.hero_visual_mode === "phone" ? <PhoneHeroVisual siteName={settings.header_site_name} /> : null}
        </section>
      ) : null}

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
          <p>ติดตามข้อมูลสำคัญ ข่าวประชาสัมพันธ์ และประกาศล่าสุดจาก {settings.header_site_name}</p>
        </ScrollReveal>

        <div className="news-grid">
          <ScrollReveal delay={0}>
            <NewsCard
              date="22 ส.ค. 2569"
              title={`ยินดีต้อนรับสู่ ${settings.header_site_name}`}
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
              <button type="button" aria-label="เดือนก่อนหน้า"><ChevronLeft size={17} /></button>
              <strong>สิงหาคม 2569</strong>
              <button type="button" aria-label="เดือนถัดไป"><ChevronRight size={17} /></button>
            </div>
            <div className="calendar-weekdays">
              {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="calendar-days">
              {Array.from({ length: 35 }, (_, index) => {
                const value = index < 5 ? 27 + index : index - 4;
                const muted = index < 5 || value > 31;
                return (
                  <span key={index} className={`${muted ? "muted" : ""} ${value === 3 && !muted ? "selected" : ""}`}>
                    {value > 31 ? value - 31 : value}
                  </span>
                );
              })}
            </div>
          </ScrollReveal>

          <ScrollReveal className="event-column" delay={120}>
            <article className="event-card">
              <span className="event-icon"><CalendarDays size={21} /></span>
              <div>
                <small>กิจกรรมถัดไป</small>
                <h3>อบรมการใช้งานระบบ {settings.header_site_name}</h3>
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
            <a className="useful-link" href={contactHref(settings.footer_contact_line_2)}>
              <span><MessageCircleMore size={20} /></span>
              <div><strong>ติดต่อผู้ดูแลระบบ</strong><small>แจ้งปัญหาการใช้งานและขอความช่วยเหลือ</small></div>
              <ArrowRight size={18} />
            </a>
          </ScrollReveal>
        </div>
      </section>

      {settings.footer_is_visible ? (
        <footer className="site-footer">
          <div className="footer-glow" />
          <div className="footer-main">
            <div className="footer-brand">
              <SiteBrand
                siteName={settings.header_site_name}
                tagline={settings.header_tagline}
                logoUrl={homepage.logoUrl}
                logoAlt={settings.header_logo_alt}
                showTagline={settings.header_show_tagline}
              />
              <p>{settings.footer_description}</p>
            </div>
            <div>
              <strong>{settings.footer_contact_heading}</strong>
              {settings.footer_contact_line_1 ? <p>{settings.footer_contact_line_1}</p> : null}
              {settings.footer_contact_line_2 ? <p>{settings.footer_contact_line_2}</p> : null}
            </div>
            <div>
              <strong>{settings.footer_social_heading}</strong>
              <FooterLink label={settings.footer_facebook_label} href={settings.footer_facebook_url} />
              <FooterLink label={settings.footer_youtube_label} href={settings.footer_youtube_url} />
              <FooterLink label={settings.footer_line_label} href={settings.footer_line_url} />
            </div>
          </div>
          <div className="footer-bottom">
            <span>{settings.footer_copyright}</span>
            {settings.footer_technology ? <span>{settings.footer_technology}</span> : null}
          </div>
        </footer>
      ) : null}
    </main>
  );
}

function NavigationLink({ item }: { item: SiteNavigationItem }) {
  const target = item.open_new_tab ? "_blank" : undefined;
  const rel = item.open_new_tab ? "noreferrer noopener" : undefined;
  return (
    <a href={safeHref(item.url)} target={target} rel={rel}>
      <NavigationIcon name={item.icon_name} />
      {item.label}
    </a>
  );
}

function NavigationIcon({ name }: { name: SiteNavigationIcon }) {
  const props = { size: 16 };
  switch (name) {
    case "home": return <Home {...props} />;
    case "teacher": return <MonitorPlay {...props} />;
    case "student": return <CircleUserRound {...props} />;
    case "about": return <Info {...props} />;
    case "book": return <BookOpenCheck {...props} />;
    case "calendar": return <CalendarDays {...props} />;
    case "info": return <Info {...props} />;
    case "megaphone": return <Megaphone {...props} />;
    default: return <Link2 {...props} />;
  }
}

function SmartLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const safe = safeHref(href);
  if (safe.startsWith("/")) return <Link href={safe} className={className}>{children}</Link>;
  return <a href={safe} className={className}>{children}</a>;
}

function PhoneHeroVisual({ siteName }: { siteName: string }) {
  return (
    <div className="hero-phone-zone" aria-label={`ตัวอย่าง ${siteName} Dashboard`}>
      <div className="hero-phone-shadow" />
      <div className="hero-phone float-phone">
        <div className="phone-speaker" />
        <div className="phone-dashboard-card">
          <small>{siteName} Dashboard</small>
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
  );
}

function FooterLink({ label, href }: { label: string; href: string }) {
  if (!label) return null;
  if (!href) return <p>{label}</p>;
  return <p><a href={safeHref(href)} target="_blank" rel="noreferrer noopener">{label}</a></p>;
}

function contactHref(value: string) {
  const contact = value.trim();
  return contact.includes("@") ? `mailto:${contact}` : "#about";
}

function safeHref(value: string) {
  const href = value.trim();
  if (
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("https://") ||
    href.startsWith("http://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return href;
  }
  return "#";
}

function RoleCard({ icon, title, description, label, href }: { icon: ReactNode; title: string; description: string; label: string; href: string }) {
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
        {pinned ? <span>ปักหมุด</span> : null}
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
