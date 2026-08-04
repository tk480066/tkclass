"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

export type AuthActionState = {
  error?: string;
};

const emailPasswordSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

const studentSchema = z.object({
  studentCode: z.string().regex(/^\d{5}$/, "รหัสนักเรียนต้องเป็นตัวเลข 5 หลัก"),
  pin: z.string().min(6, "PIN ต้องมีอย่างน้อย 6 ตัวอักษร"),
});

const roleDestination: Record<AppRole, string> = {
  admin: "/admin/launch",
  teacher: "/teacher",
  student: "/student",
};

async function emailRoleSignIn(
  formData: FormData,
  expectedRole: "admin" | "teacher",
): Promise<AuthActionState> {
  const parsed = emailPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    console.error(`${expectedRole} sign-in failed:`, error?.message ?? "No user returned");
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    console.error(`${expectedRole} profile lookup failed:`, profileError?.message ?? "No profile returned");
    await supabase.auth.signOut();
    return { error: "พบบัญชีในระบบยืนยันตัวตน แต่ยังไม่มีโปรไฟล์ผู้ใช้งาน กรุณารันคำสั่งสร้างบัญชีอีกครั้ง" };
  }

  if (profile.role !== expectedRole || profile.status !== "active") {
    await supabase.auth.signOut();
    const label = expectedRole === "admin" ? "ผู้ดูแลระบบ" : "ครู";
    return { error: `บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานในสถานะ${label} หรือถูกปิดใช้งาน` };
  }

  redirect(roleDestination[expectedRole]);
}

export async function adminSignIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return emailRoleSignIn(formData, "admin");
}

export async function teacherSignIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return emailRoleSignIn(formData, "teacher");
}

export async function studentSignIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = studentSchema.safeParse({
    studentCode: formData.get("studentCode"),
    pin: formData.get("pin"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const supabase = await createClient();
  const email = `${parsed.data.studentCode}@students.tkmooc.local`;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.pin,
  });

  if (error || !data.user) {
    console.error("Student sign-in failed:", error?.message ?? "No user returned");
    return { error: "รหัสนักเรียนหรือ PIN ไม่ถูกต้อง" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    console.error("Student profile lookup failed:", profileError?.message ?? "No profile returned");
    await supabase.auth.signOut();
    return { error: "พบบัญชีในระบบยืนยันตัวตน แต่ยังไม่มีโปรไฟล์นักเรียน" };
  }

  if (profile.role !== "student" || profile.status !== "active") {
    await supabase.auth.signOut();
    return { error: "บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบนักเรียน หรือถูกปิดใช้งาน" };
  }

  redirect(roleDestination.student);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
