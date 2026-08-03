"use client";

import { useActionState, useState } from "react";
import {
  BarChart3,
  GraduationCap,
  School,
  ShieldCheck,
} from "lucide-react";
import {
  studentSignIn,
  teacherSignIn,
  type AuthActionState,
} from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { SubmitButton } from "@/components/submit-button";

const initialState: AuthActionState = {};

export function LoginPanel() {
  const [mode, setMode] = useState<"teacher" | "student">("teacher");
  const [teacherState, teacherAction] = useActionState(teacherSignIn, initialState);
  const [studentState, studentAction] = useActionState(studentSignIn, initialState);

  return (
    <div className="login-frame">
      <section className="login-showcase">
        <div className="login-showcase-copy">
          <BrandMark />
          <h1>
            เรียนรู้และจัดการ
            <span>ในพื้นที่เดียวกัน</span>
          </h1>
          <p>
            ระบบเข้าสู่ระบบที่แบ่งบทบาทครูและนักเรียนอย่างชัดเจน พร้อมการปกป้องข้อมูลด้วย Supabase Auth และ Row Level Security
          </p>
        </div>

        <div className="login-mini-dashboard float-slow" aria-hidden="true">
          <div className="login-mini-top">
            <span>ภาพรวมระบบ</span>
            <span>ออนไลน์</span>
          </div>
          <div className="login-mini-grid">
            <div><small>ชั้นเรียน</small><strong>06</strong></div>
            <div><small>นักเรียน</small><strong>186</strong></div>
            <div><small>ความก้าวหน้า</small><strong>84%</strong></div>
            <div><small>สถานะระบบ</small><strong><BarChart3 size={17} /></strong></div>
          </div>
        </div>

        <div className="login-security-pill">
          <ShieldCheck size={17} /> ตรวจสอบสิทธิ์หลายชั้น
        </div>
      </section>

      <section className="login-form-side">
        <span className="form-kicker">WELCOME BACK</span>
        <h2>เข้าสู่ระบบ TK Mooc</h2>
        <p>เลือกประเภทผู้ใช้งาน แล้วกรอกข้อมูลบัญชีของคุณ</p>

        <div className="role-tabs" role="tablist" aria-label="ประเภทผู้ใช้งาน">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "teacher"}
            onClick={() => setMode("teacher")}
            className={`role-tab ${mode === "teacher" ? "active" : ""}`}
          >
            <School size={18} /> ครู
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "student"}
            onClick={() => setMode("student")}
            className={`role-tab ${mode === "student" ? "active" : ""}`}
          >
            <GraduationCap size={18} /> นักเรียน
          </button>
        </div>

        {mode === "teacher" ? (
          <form action={teacherAction} className="auth-form" key="teacher-form">
            <label className="field-label">
              <span>อีเมลครู</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="teacher@school.ac.th"
                className="field-control"
              />
            </label>
            <label className="field-label">
              <span>รหัสผ่าน</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                placeholder="กรอกรหัสผ่าน"
                className="field-control"
              />
            </label>
            {teacherState.error && <ErrorMessage message={teacherState.error} />}
            <SubmitButton label="เข้าสู่ระบบครู" />
          </form>
        ) : (
          <form action={studentAction} className="auth-form" key="student-form">
            <label className="field-label">
              <span>รหัสนักเรียน</span>
              <input
                name="studentCode"
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                required
                placeholder="ตัวเลข 5 หลัก"
                className="field-control student-code-input"
              />
            </label>
            <label className="field-label">
              <span>PIN</span>
              <input
                name="pin"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                required
                minLength={6}
                placeholder="กรอก PIN"
                className="field-control"
              />
            </label>
            {studentState.error && <ErrorMessage message={studentState.error} />}
            <SubmitButton label="เข้าสู่ระบบนักเรียน" />
          </form>
        )}
      </section>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div role="alert" className="auth-error">{message}</div>;
}
