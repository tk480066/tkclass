import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginPanel } from "@/components/login-panel";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default function LoginPage() {
  return (
    <main className="auth-page">
      <div className="auth-container">
        <Link href="/" className="auth-back-link">
          <ArrowLeft size={17} /> กลับหน้าหลัก
        </Link>
        <LoginPanel />
      </div>
    </main>
  );
}
