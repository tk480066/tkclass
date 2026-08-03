import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="unauthorized-page">
      <div className="unauthorized-card">
        <span className="unauthorized-icon"><ShieldAlert size={31} /></span>
        <h1>ไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
        <p>บัญชีของคุณไม่ตรงกับบทบาทที่กำหนด กรุณากลับไปยังหน้าระบบหลัก</p>
        <Link href="/dashboard">กลับไปยังระบบ</Link>
      </div>
    </main>
  );
}
