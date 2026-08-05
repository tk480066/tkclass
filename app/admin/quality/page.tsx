import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleAlert, Database, ExternalLink, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/require-role";
import { getPhase85Readiness } from "@/lib/data/phase85";

export const metadata: Metadata = { title: "ตรวจคุณภาพ Production" };

function ListResult({ title, values }: { title: string; values: string[] }) {
  const passed = values.length === 0;
  return (
    <article className={`phase85-check ${passed ? "is-pass" : "is-fail"}`}>
      {passed ? <CheckCircle2 /> : <CircleAlert />}
      <div><strong>{title}</strong><span>{passed ? "ผ่าน" : values.join(", ")}</span></div>
    </article>
  );
}

export default async function AdminQualityPage() {
  await requireRole("admin");
  const report = await getPhase85Readiness();
  return (
    <main className="phase85-page">
      <header className="phase85-hero">
        <div><span>PHASE 8.5</span><h1>Responsive, RLS และ Production</h1><p>ศูนย์ตรวจความพร้อมก่อนเปิดเว็บไซต์จริง</p></div>
        <nav><Link href="/admin">ศูนย์ผู้ดูแล</Link><Link href="/" target="_blank">เปิดเว็บไซต์ <ExternalLink size={16}/></Link></nav>
      </header>
      <section className="phase85-summary">
        <article><MonitorSmartphone/><strong>Responsive</strong><span>ตรวจมือถือ แท็บเล็ต และเดสก์ท็อปผ่านคำสั่ง phase85:responsive</span></article>
        <article><ShieldCheck/><strong>RLS Security</strong><span>ตรวจ CMS ทุกตารางว่ามี RLS และ Policy</span></article>
        <article><Database/><strong>Production</strong><span>Schema {report.schema_version} · Pending {report.deployment_pending}</span></article>
      </section>
      <section className="phase85-panel">
        <div className={`phase85-status ${report.ok ? "is-pass" : "is-fail"}`}>
          {report.ok ? <CheckCircle2/> : <CircleAlert/>}<div><h2>{report.ok ? "โครงสร้างหลักพร้อม" : "พบรายการต้องแก้ไข"}</h2><p>ตรวจล่าสุด {new Date(report.checked_at).toLocaleString("th-TH")}</p></div>
        </div>
        <div className="phase85-check-grid">
          <ListResult title="ตารางที่จำเป็น" values={report.missing_tables}/>
          <ListResult title="RLS ของ CMS" values={report.rls_disabled}/>
          <ListResult title="Policies ของ CMS" values={report.tables_without_policies}/>
          <ListResult title="Storage Buckets" values={report.missing_buckets}/>
        </div>
      </section>
      <section className="phase85-panel">
        <h2>คำสั่งตรวจบนเครื่อง</h2>
        <pre>npm run phase85:responsive{"\n"}npm run phase85:rls{"\n"}npm run phase85:production -- --url=https://โดเมนจริง</pre>
      </section>
    </main>
  );
}
