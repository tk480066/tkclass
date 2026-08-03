# TK Mooc Phase 2 — ชั้นเรียนและบทเรียน

เวอร์ชันนี้ต่อยอดจาก Phase 1 v1.0.6 โดยคงระบบ Auth, Roles, RLS, UI theme และ Dark mode เดิม พร้อมเพิ่มระบบจัดการชั้นเรียน รายชื่อนักเรียน หน่วยการเรียนรู้ บทเรียน เนื้อหาแบบบล็อก และความก้าวหน้าของนักเรียน

## ฟังก์ชันที่เพิ่ม

### ระบบครู

- Dashboard แสดงจำนวนชั้นเรียน นักเรียน หน่วย และบทเรียน
- สร้าง แก้ไข และเก็บชั้นเรียนเข้าคลัง
- จัดการรายชื่อนักเรียน
- เพิ่มนักเรียนเดิมด้วยรหัส 5 หลัก
- นำเข้ารายชื่อ CSV และสร้างบัญชีนักเรียน
- สร้างหน่วยการเรียนรู้
- สร้างบทเรียน กำหนดลำดับ เวลา และสถานะเผยแพร่
- สร้าง Lesson Blocks: ข้อความ รูปภาพ วิดีโอ เอกสาร ลิงก์ และกิจกรรม
- อัปโหลดไฟล์เข้าสู่ Supabase Storage แบบ Private

### ระบบนักเรียน

- ดูรายวิชาที่ลงทะเบียนและชื่อครูผู้สอน
- ดูจำนวนหน่วย บทเรียน และเปอร์เซ็นต์ความก้าวหน้า
- เปิดรายวิชาและบทเรียนที่ครูเผยแพร่
- อ่านข้อความ ดูรูปภาพ วิดีโอ ดาวน์โหลดเอกสาร และเปิดลิงก์
- ตอบกิจกรรมระหว่างบท
- เริ่มเรียนและทำเครื่องหมายว่าเรียนจบ
- ติดตามความก้าวหน้าของตนเอง

## ตารางฐานข้อมูลใหม่

- `units`
- `lessons`
- `lesson_blocks`
- `lesson_progress`
- `lesson_responses`

และเพิ่มคอลัมน์ใน `classes`:

- `online_meeting_url`
- `cover_path`
- `course_color`
- `syllabus`

Supabase Storage จะสร้าง Bucket ส่วนตัวชื่อ `course-content` อัตโนมัติ

---

## 1. สำรองโปรเจกต์เดิม

```bash
cd /Users/tkping/projects
cp -R TK_Mooc_Phase1 TK_Mooc_Phase1_backup_before_phase2
```

## 2. คัดลอกโค้ด Phase 2

สมมติแตกไฟล์ไว้ใน Downloads:

```bash
cd ~/Downloads
unzip TK_Mooc_Phase2_v2.0.0.zip
```

คัดลอกไปยังโครงการเดิมโดยไม่ทับไฟล์ลับและ Git:

```bash
rsync -av \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.vercel' \
  ~/Downloads/TK_Mooc_Phase2_v2.0.0/ \
  /Users/tkping/projects/TK_Mooc_Phase1/
```

## 3. สร้างฐานข้อมูล Phase 2

เปิดไฟล์:

```text
supabase/migrations/0002_phase2_classes_lessons.sql
```

คัดลอกทั้งหมดไปที่:

```text
Supabase Dashboard → SQL Editor → New query → Run
```

ต้องรัน `0001_phase1_foundation.sql` มาก่อนแล้ว

ตรวจสอบด้วยไฟล์:

```text
supabase/verify_phase2.sql
```

ควรพบ 5 ตารางใหม่ RLS Policies และ Bucket `course-content`

## 4. ติดตั้ง Package

```bash
cd /Users/tkping/projects/TK_Mooc_Phase1
npm install
```

## 5. สร้างข้อมูลตัวอย่าง

หากยังไม่มีบัญชี Phase 1:

```bash
npm run create-demo-users
```

จากนั้นสร้างข้อมูล Phase 2:

```bash
npm run seed-phase2
```

บัญชีตัวอย่าง:

### ครู

```text
teacher@tkmooc.local
TKMOOC@1234
```

### นักเรียน

```text
10001 / 123456
10002 / 123456
10003 / 123456
10004 / 123456
```

## 6. เปิดระบบ

```bash
rm -rf .next
npm run dev
```

เปิด:

```text
http://localhost:3000
```

## 7. เส้นทางสำคัญ

### ครู

```text
/teacher
/teacher/classes
/teacher/classes/[classId]
/teacher/classes/[classId]/students
/teacher/classes/[classId]/curriculum
/teacher/lessons/[lessonId]
```

### นักเรียน

```text
/student
/student/courses
/student/courses/[classId]
/student/lessons/[lessonId]
```

## 8. รูปแบบ CSV

ใช้ไฟล์ `students_phase2_sample.csv` หรือหัวคอลัมน์:

```text
student_code,title,first_name,last_name,nickname,level,room,student_number,pin,group_name
```

ถ้าไม่ใส่ PIN ระบบใช้ `123456` เป็นค่าเริ่มต้น ควรเพิ่มระบบเปลี่ยน PIN ก่อนใช้งานจริง

## 9. การอัปโหลดไฟล์

- Bucket: `course-content`
- ขนาดสูงสุด: 50 MB ต่อไฟล์
- Path: `teacher-user-id/class-id/uuid-filename`
- Bucket เป็น Private
- นักเรียนอ่านไฟล์ได้เฉพาะรายวิชาที่ลงทะเบียน
- หน้าเว็บสร้าง Signed URL อายุ 1 ชั่วโมง


## Environment Variables สำหรับ Phase 2

Phase 2 ใช้ `SUPABASE_SECRET_KEY` ใน Server Action สำหรับนำเข้ารายชื่อนักเรียนและสร้างบัญชี Auth ดังนั้นต้องเพิ่มตัวแปรนี้ใน Vercel ด้วย:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
NEXT_PUBLIC_SITE_URL
```

ห้ามตั้งชื่อ Secret key ขึ้นต้นด้วย `NEXT_PUBLIC_` และห้ามเรียกใช้จาก Client Component

## 10. ตรวจสอบก่อน Deploy

```bash
npm run typecheck
npm run build
```

แก้ Error แรกที่พบก่อน Deploy

## 11. Commit และ Push

```bash
git status
git add .
git commit -m "Develop TK Mooc Phase 2 classes and lessons"
git push origin main
```

หาก Vercel เชื่อมกับ Repository อยู่แล้ว ระบบจะสร้าง Deployment ใหม่อัตโนมัติ

## 12. ทดสอบสิทธิ์

- ครู A ต้องไม่เห็นหรือแก้ชั้นเรียนของครู B
- นักเรียนต้องเห็นเฉพาะรายวิชาที่ลงทะเบียน
- นักเรียนต้องไม่เห็นหน่วยหรือบทเรียนสถานะ Draft
- นักเรียนต้องแก้ Progress และ Response ของตนเองเท่านั้น
- ครูต้องเห็น Progress และ Response เฉพาะนักเรียนในวิชาของตน
- ไฟล์ใน Storage ต้องไม่เปิดด้วย Public URL
