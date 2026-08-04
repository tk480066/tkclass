# TK Mooc Phase 8.1 — ตั้งค่าเว็บไซต์ Header, Hero และ Footer

Phase 8.1 พัฒนาต่อยอดจาก Phase 7 v7.0.3 โดยเพิ่ม Homepage CMS ให้บัญชีบทบาท `admin` แก้ไขหน้าหลักได้จากหน้าเว็บโดยไม่ต้องแก้ `app/page.tsx` ทุกครั้ง

## ความสามารถที่เพิ่ม

### Header

- เปลี่ยนชื่อเว็บไซต์และคำโปรย
- อัปโหลด เปลี่ยน หรือลบโลโก้
- กำหนดข้อความอธิบายรูปภาพสำหรับการเข้าถึง
- เปิดหรือซ่อนคำโปรยและปุ่ม Dark mode
- เปลี่ยนข้อความปุ่มเข้าสู่ระบบและปุ่ม Dashboard
- เพิ่ม แก้ไข ลบ ซ่อน และเรียงเมนูด้วยเลขลำดับ
- เลือกไอคอนและกำหนดให้เปิดลิงก์ในแท็บใหม่

### Hero

- เปิดหรือซ่อน Hero Section
- แก้ไขป้ายข้อความ หัวข้อหลัก ข้อความเน้น และคำอธิบาย
- แก้ไขข้อความและลิงก์ของปุ่มหลัก/ปุ่มรอง
- เลือกภาพประกอบ 3 โหมด: โทรศัพท์จำลอง รูปภาพที่อัปโหลด หรือไม่แสดงภาพ
- อัปโหลด เปลี่ยน หรือลบภาพ Hero

### Footer

- เปิดหรือซ่อน Footer
- แก้ไขคำอธิบาย ข้อมูลติดต่อ และหัวข้อช่องทางออนไลน์
- กำหนดชื่อและ URL ของ Facebook, YouTube และ LINE
- แก้ไขข้อความลิขสิทธิ์และเทคโนโลยีที่ใช้

### การเผยแพร่และความปลอดภัย

- บันทึกแล้วเผยแพร่บนหน้าหลักทันที
- เรียก `revalidatePath("/")` หลังบันทึกเพื่อโหลดข้อมูลล่าสุด
- บันทึก Audit event ทุกครั้งที่แก้ไข
- เฉพาะ `profiles.role = admin` และ `status = active` เท่านั้นที่แก้ไขได้
- ผู้ใช้ทั่วไปอ่านเฉพาะข้อมูลหน้าหลักและเมนูที่เปิดแสดง
- ตรวจ URL ก่อนบันทึกและไม่อนุญาต JavaScript URL
- รูปภาพรองรับ JPG, PNG และ WebP ขนาดไม่เกิน 4 MB
- หน้าแรกมีค่าเริ่มต้นสำรอง หากฐานข้อมูล Phase 8.1 ยังไม่พร้อม

## ตารางฐานข้อมูลใหม่

```text
site_homepage_settings
site_navigation_items
```

Storage Bucket:

```text
site-assets
```

Bucket เป็น Public สำหรับไฟล์ที่ต้องแสดงบนหน้าสาธารณะ แต่การอัปโหลด แก้ไข และลบอนุญาตเฉพาะ Admin ผ่าน RLS Policy

## เส้นทางใหม่

```text
/admin
/admin/content/homepage
```

หน้า `/admin` เป็นศูนย์ผู้ดูแลระบบ ส่วน `/admin/content/homepage` เป็นหน้าจัดการ Header, เมนู, Hero และ Footer

# การติดตั้งจาก Phase 7 v7.0.3

## 1. สำรองโครงการเดิม

```bash
cd /Users/tkping/projects
cp -R TK_Mooc_Phase1 TK_Mooc_Phase7_backup_before_phase8_1
```

## 2. แตกไฟล์และคัดลอก

```bash
cd ~/Downloads
unzip TK_Mooc_Phase8_1_v8.1.0.zip

rsync -av \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.vercel' \
  ~/Downloads/TK_Mooc_Phase8_1_v8.1.0/ \
  /Users/tkping/projects/TK_Mooc_Phase1/
```

## 3. รัน Migration

เปิดไฟล์:

```text
supabase/migrations/0008_phase8_1_homepage_cms.sql
```

นำ SQL ทั้งหมดไป Run ใน Supabase SQL Editor หลัง Migration `0001` ถึง `0007` สำเร็จแล้ว

ลำดับ Migration:

```text
0001_phase1_foundation.sql
0002_phase2_classes_lessons.sql
0003_phase3_assignments_submissions.sql
0004_phase4_quizzes.sql
0005_phase5_attendance_gradebook.sql
0006_phase6_communication.sql
0007_phase7_launch_migration.sql
0008_phase8_1_homepage_cms.sql
```

ตรวจสอบด้วย:

```text
supabase/verify_phase8_1.sql
```

ควรพบตารางใหม่ 2 ตาราง, RLS เปิดใช้งาน, Bucket `site-assets`, Policy ของ Storage และ `schema_version = 8.1.0`

## 4. ติดตั้งและตรวจ Build

```bash
cd /Users/tkping/projects/TK_Mooc_Phase1
rm -rf .next
npm install
npm run typecheck
npm run build
npm run dev
```

เปิด:

```text
http://localhost:3000/admin/content/homepage
```

เข้าสู่ระบบด้วยแท็บ **ผู้ดูแล** ก่อนเปิดเส้นทางดังกล่าว

## 5. การใช้งาน

1. เปิด `/admin/content/homepage`
2. แก้ไข Header และกด **บันทึกและเผยแพร่ Header**
3. เพิ่มหรือแก้ไขเมนู แล้วกำหนดลำดับ เช่น 10, 20, 30
4. แก้ไข Hero และเลือกโหมดภาพ
5. แก้ไข Footer และลิงก์ช่องทางออนไลน์
6. กด **เปิดหน้าหลัก** เพื่อตรวจสอบผลจริง
7. ทดสอบ Desktop, Tablet, Mobile และ Dark mode

## หมายเหตุสำคัญ

- Phase 8.1 เป็นการเผยแพร่ทันที ยังไม่มี Draft, Scheduled publishing หรือ Revision history
- ระบบฉบับร่างและประวัติเวอร์ชันอยู่ในขอบเขต Phase 8.4
- ไม่ต้องรัน Seed Script ใหม่
- ไม่ต้องสร้างบัญชี Admin ใหม่ หากบัญชีจาก Phase 7 ใช้งานได้แล้ว
- ไม่ควรลบ Bucket `site-assets` เพราะโลโก้และภาพ Hero อ้างอิงไฟล์ใน Bucket นี้
- ก่อน Deploy Production ควรสำรองฐานข้อมูลและ Storage ตาม Phase 7 Runbook

## Deploy

```bash
git status
git add .
git commit -m "Develop Phase 8.1 homepage CMS"
git push origin main
```

หลัง Vercel Deploy สำเร็จ ให้ตรวจ:

```text
/
/login
/admin
/admin/content/homepage
/api/health
```
