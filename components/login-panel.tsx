"use client";

import { useActionState, useState } from "react";
import {
  BookOpenCheck,
  CircleUserRound,
  GraduationCap,
  MonitorPlay,
  School,
  ShieldCheck,
} from "lucide-react";
import {
  adminSignIn,
  studentSignIn,
  teacherSignIn,
  type AuthActionState,
} from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { SubmitButton } from "@/components/submit-button";

const initialState: AuthActionState = {};
type LoginMode = "admin" | "teacher" | "student";

export function LoginPanel() {
  const [mode, setMode] = useState<LoginMode>("teacher");
  const [adminState, adminAction] = useActionState(adminSignIn, initialState);
  const [teacherState, teacherAction] = useActionState(teacherSignIn, initialState);
  const [studentState, studentAction] = useActionState(studentSignIn, initialState);

  return (
    <div className="login-frame site-login-frame">
      <section className="login-visual-panel">
        <div className="login-visual-shape" />
        <BrandMark />
        <div className="login-copy">
          <span>TK MOOC LEARNING SPACE</span>
          <h1>เชื่อมต่อการเรียนรู้<br />อย่างเป็นระบบ</h1>
          <p>เข้าสู่พื้นที่ของผู้ดูแลระบบ ครู หรือนักเรียน ด้วย Supabase Auth และการกำหนดสิทธิ์ตามบทบาท</p>
        </div>
        <div className="login-phone float-phone">
          <div className="login-phone-notch" />
          <div className="login-phone-card"><small>TK Mooc</small><strong>Welcome back!</strong></div>
          <div className="login-phone-icons"><span><BookOpenCheck size={17} /></span><span><CircleUserRound size={17} /></span></div>
          <div className="login-phone-progress"><i /></div>
        </div>
        <div className="login-safe"><ShieldCheck size={17} /> ปลอดภัยด้วย Supabase Auth และ RLS</div>
      </section>

      <section className="login-form-side">
        <span className="form-kicker">WELCOME BACK</span>
        <h2>เข้าสู่ระบบ TK Mooc</h2>
        <p>เลือกประเภทผู้ใช้งาน แล้วกรอกข้อมูลบัญชีของคุณ</p>

        <div className="role-tabs role-tabs-three" role="tablist" aria-label="ประเภทผู้ใช้งาน">
          <button type="button" role="tab" aria-selected={mode === "admin"} onClick={() => setMode("admin")} className={`role-tab ${mode === "admin" ? "active" : ""}`}>
            <ShieldCheck size={18} /> ผู้ดูแล
          </button>
          <button type="button" role="tab" aria-selected={mode === "teacher"} onClick={() => setMode("teacher")} className={`role-tab ${mode === "teacher" ? "active" : ""}`}>
            <MonitorPlay size={18} /> ครู
          </button>
          <button type="button" role="tab" aria-selected={mode === "student"} onClick={() => setMode("student")} className={`role-tab ${mode === "student" ? "active" : ""}`}>
            <GraduationCap size={18} /> นักเรียน
          </button>
        </div>

        {mode === "admin" && (
          <form action={adminAction} className="auth-form auth-form-slide" key="admin-form">
            <label className="field-label"><span>อีเมลผู้ดูแลระบบ</span><input name="email" type="email" autoComplete="username" required placeholder="admin@school.ac.th" className="field-control" /></label>
            <label className="field-label"><span>รหัสผ่าน</span><input name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="กรอกรหัสผ่าน" className="field-control" /></label>
            {adminState.error && <ErrorMessage message={adminState.error} />}
            <SubmitButton label="เข้าสู่ศูนย์ผู้ดูแลระบบ" />
          </form>
        )}

        {mode === "teacher" && (
          <form action={teacherAction} className="auth-form auth-form-slide" key="teacher-form">
            <label className="field-label"><span>อีเมลครู</span><input name="email" type="email" autoComplete="username" required placeholder="teacher@school.ac.th" className="field-control" /></label>
            <label className="field-label"><span>รหัสผ่าน</span><input name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="กรอกรหัสผ่าน" className="field-control" /></label>
            {teacherState.error && <ErrorMessage message={teacherState.error} />}
            <SubmitButton label="เข้าสู่ระบบครู" />
          </form>
        )}

        {mode === "student" && (
          <form action={studentAction} className="auth-form auth-form-slide" key="student-form">
            <label className="field-label"><span>รหัสนักเรียน</span><input name="studentCode" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} required placeholder="ตัวเลข 5 หลัก" className="field-control student-code-input" /></label>
            <label className="field-label"><span>PIN</span><input name="pin" type="password" inputMode="numeric" autoComplete="current-password" required minLength={6} placeholder="กรอก PIN" className="field-control" /></label>
            {studentState.error && <ErrorMessage message={studentState.error} />}
            <SubmitButton label="เข้าสู่ระบบนักเรียน" />
          </form>
        )}

        <div className="login-help"><School size={16} /> ติดต่อผู้ดูแลระบบเมื่อไม่สามารถเข้าสู่ระบบได้</div>
      </section>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div role="alert" className="auth-error">{message}</div>;
}
