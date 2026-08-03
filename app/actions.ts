"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
};

const teacherSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

const studentSchema = z.object({
  studentCode: z.string().regex(/^\d{5}$/, "รหัสนักเรียนต้องเป็นตัวเลข 5 หลัก"),
  pin: z.string().min(6, "PIN ต้องมีอย่างน้อย 6 ตัวอักษร"),
});

export async function teacherSignIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = teacherSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    console.error("Teacher sign-in failed:", error?.message ?? "No user returned");
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (profile?.role !== "teacher" || profile.status !== "active") {
    await supabase.auth.signOut();
    return { error: "บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบครู" };
  }

  redirect("/teacher");
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (profile?.role !== "student" || profile.status !== "active") {
    await supabase.auth.signOut();
    return { error: "บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบนักเรียน" };
  }

  redirect("/student");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
