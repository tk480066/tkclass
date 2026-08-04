# Phase 7 Checklist — ย้ายข้อมูลและเปิดใช้งาน

## Source data

- [ ] สำรอง Google Sheets/ระบบเดิม
- [ ] กำหนดวันหยุดแก้ไขข้อมูลต้นทาง
- [ ] ตรวจรหัสครู นักเรียน และชั้นเรียนไม่ซ้ำ
- [ ] Export CSV เป็น UTF-8
- [ ] ตรวจวันเวลาและเขตเวลาไทย
- [ ] เก็บข้อมูลจริงนอก Git Repository

## Database

- [ ] รัน Migration 0001–0007 ครบ
- [ ] รัน `verify_phase7.sql` ผ่าน
- [ ] `phase7:preflight` ไม่มี Failure
- [ ] RLS เปิดทุกตาราง
- [ ] Security Advisor ไม่มีประเด็นร้ายแรง
- [ ] Storage Buckets และ Policies ครบ
- [ ] สร้าง Admin Production แล้ว

## Migration

- [ ] เปิด Maintenance mode
- [ ] สร้าง Backup ก่อนย้าย
- [ ] Dry run ผ่าน
- [ ] นำเข้าจริงสำเร็จ
- [ ] ตรวจ `migration_row_errors`
- [ ] จำนวนครูและนักเรียนตรงต้นทาง
- [ ] จำนวนชั้นเรียนและ Enrollments ตรงต้นทาง
- [ ] ตรวจตัวอย่างบทเรียน งาน แบบทดสอบ เช็กชื่อ และคะแนน
- [ ] ทำเครื่องหมาย `data_migration_completed`

## Application

- [ ] `npm ci` หรือ `npm install` สำเร็จ
- [ ] `npm run typecheck` ผ่าน
- [ ] `npm run build` ผ่าน
- [ ] `/api/health` คืน `ok: true`
- [ ] ทดสอบ Desktop, Tablet และ Smartphone
- [ ] ทดสอบ Light/Dark mode
- [ ] ทดสอบ Admin, Teacher และ Student

## Vercel

- [ ] Environment Variables ครบใน Production
- [ ] Secret key ไม่ใช้ชื่อขึ้นต้น `NEXT_PUBLIC_`
- [ ] Deploy Preview ผ่าน
- [ ] Deploy Production ผ่าน
- [ ] Custom Domain และ HTTPS พร้อม
- [ ] Supabase Site URL และ Redirect URLs ตรงโดเมนจริง
- [ ] Postflight ผ่าน
- [ ] เตรียม Vercel Rollback

## Go live

- [ ] Pilot users ทดสอบผ่าน
- [ ] Checklist หน้า `/admin/launch` ผ่านทั้งหมด
- [ ] ทำเครื่องหมาย `production_ready`
- [ ] ปิด Maintenance mode
- [ ] ส่งประกาศและคู่มือให้ผู้ใช้
- [ ] เฝ้าระวัง Logs และ Usage 24 ชั่วโมงแรก
- [ ] เก็บระบบเดิมแบบ Read-only ชั่วคราว
