# TK Mooc Phase 5 — เช็กชื่อและสมุดคะแนน

Phase 5 พัฒนาต่อจาก TK Mooc Phase 4 โดยเพิ่มระบบบันทึกการเข้าเรียนและสมุดคะแนนแบบรวมศูนย์ ภายใต้ระบบสิทธิ์เดิมของ Supabase Auth และ Row Level Security

## ความสามารถหลัก

### ครู: เช็กชื่อ

- เลือกชั้นเรียนและสร้างคาบเช็กชื่อ
- กำหนดวันที่ คาบ เวลาเปิด–ปิด และเกณฑ์มาสาย
- เปิดให้นักเรียนเช็กชื่อด้วยรหัสตัวเลข 6 หลัก
- เช็กชื่อด้วยตนเองแบบรายคน หรือกด “มาเรียนทั้งหมด”
- สถานะ: ยังไม่เช็ก, มาเรียน, มาสาย, ขาดเรียน, ลากิจ, ลาป่วย และร่วมกิจกรรม
- ปิดคาบและเปลี่ยนรายการที่ยังไม่เช็กเป็นขาดเรียน
- ดูสรุปจำนวนมาเรียน มาสาย ขาด ลา และยังไม่เช็ก
- ส่งออกรายชื่อและผลเช็กชื่อเป็น CSV

### นักเรียน: การเข้าเรียน

- กรอกรหัสเช็กชื่อ 6 หลัก
- ระบบตรวจช่วงเวลา ชั้นเรียน และสถานะคาบก่อนบันทึก
- ระบบกำหนดสถานะมาเรียนหรือมาสายอัตโนมัติ
- ดูประวัติการเข้าเรียนแยกตามรายวิชา
- ดูอัตราการเข้าเรียนรวม จำนวนคาบเข้าเรียน มาสาย และขาดเรียน

### ครู: สมุดคะแนน

- ดึงรายการคะแนนจากงาน Phase 3 และแบบทดสอบ Phase 4 อัตโนมัติ
- สร้างหมวดคะแนนและกำหนดน้ำหนักแต่ละหมวด
- เลือกวิธีคำนวณแบบน้ำหนักหมวด หรือรวมคะแนนทั้งหมด
- เพิ่มคะแนนอื่น ๆ เช่น จิตพิสัย กิจกรรม และการมีส่วนร่วม
- กรอกคะแนนเพิ่มเติม ความเห็น และสถานะยกเว้นคะแนนรายคน
- ซ่อนหรือเผยแพร่รายการคะแนนให้นักเรียน
- กำหนดเกณฑ์เวลาเรียนขั้นต่ำ
- เผยแพร่หรือซ่อนคะแนนรวมและระดับผลการเรียน
- ส่งออกสมุดคะแนนเป็น CSV

### นักเรียน: คะแนนของฉัน

- ดูคะแนนงาน แบบทดสอบ และคะแนนเพิ่มเติมที่ครูเผยแพร่
- ดูผลรวมตามหมวดและน้ำหนักคะแนน
- ดูคะแนนรวมและระดับผลการเรียนเมื่อครูเปิดเผย
- ดูเปอร์เซ็นต์เวลาเรียนและคำเตือนเมื่อไม่ถึงเกณฑ์
- ดูความคิดเห็นจากครูในรายการคะแนนเพิ่มเติม

---

## โครงสร้างฐานข้อมูลใหม่

Migration Phase 5 สร้างตาราง:

```text
attendance_sessions
attendance_records
grade_categories
grade_settings
grade_items
grade_entries
```

Enum ใหม่:

```text
attendance_session_status
attendance_status
attendance_checkin_method
grade_source_type
grade_item_status
grade_calculation_method
```

Database Functions:

```text
generate_attendance_code
ensure_attendance_records
student_check_in
ensure_default_gradebook
sync_gradebook_sources
is_teacher_of_attendance_session
is_teacher_of_grade_item
```

ทุกตารางเปิด Row Level Security โดยครูเข้าถึงเฉพาะชั้นเรียนของตน และนักเรียนอ่านเฉพาะข้อมูลการเข้าเรียนและคะแนนของบัญชีตนเอง

---

# วิธีอัปเดตจาก Phase 4

## 1. สำรองโครงการเดิม

```bash
cd /Users/tkping/projects
cp -R TK_Mooc_Phase1 TK_Mooc_Phase4_backup_before_phase5
```

## 2. แตกไฟล์ Phase 5

สมมติไฟล์ ZIP อยู่ใน Downloads:

```bash
cd ~/Downloads
unzip TK_Mooc_Phase5_v5.0.0.zip
```

## 3. คัดลอกเข้าโครงการเดิม

```bash
rsync -av \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.vercel' \
  ~/Downloads/TK_Mooc_Phase5_v5.0.0/ \
  /Users/tkping/projects/TK_Mooc_Phase1/
```

เข้าโครงการ:

```bash
cd /Users/tkping/projects/TK_Mooc_Phase1
code .
```

---

# ติดตั้งฐานข้อมูล Phase 5

เปิดไฟล์:

```text
supabase/migrations/0005_phase5_attendance_gradebook.sql
```

คัดลอก SQL ทั้งหมด แล้วนำไปรันที่:

```text
Supabase Dashboard
→ SQL Editor
→ New query
→ Run
```

Migration ต้องรันตามลำดับ:

```text
0001_phase1_foundation.sql
0002_phase2_classes_lessons.sql
0003_phase3_assignments_submissions.sql
0004_phase4_quizzes.sql
0005_phase5_attendance_gradebook.sql
```

ไฟล์ `0003` ในโครงการชุดนี้เป็นเวอร์ชันที่แก้ปัญหา Constraint ซ้ำแล้ว

ตรวจสอบ Phase 5 ด้วย:

```text
supabase/verify_phase5.sql
```

ผลตรวจควรพบตาราง 6 ตาราง, Enum 6 รายการ, Functions 7 รายการ และ RLS Policies ของ Phase 5

---

# Environment Variables

ใช้ค่าชุดเดิมจาก Phase 1–4:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SECRET_KEY` ใช้เฉพาะ Server Script และห้ามตั้งชื่อขึ้นต้นด้วย `NEXT_PUBLIC_`

---

# สร้างข้อมูลตัวอย่าง

ติดตั้ง Package:

```bash
npm install
```

สร้างข้อมูลตามลำดับ:

```bash
npm run create-demo-users
npm run seed-phase2
npm run seed-phase3
npm run seed-phase4
npm run seed-phase5
```

`seed-phase5` จะสร้าง:

- คาบเช็กชื่อย้อนหลัง 2 คาบ
- คาบเช็กชื่อที่กำลังเปิด 1 คาบ
- ผลมาเรียน มาสาย ขาด และลา
- หมวดคะแนน งาน 40%, แบบทดสอบ 40%, คะแนนอื่น ๆ 20%
- รายการคะแนนจากงานและแบบทดสอบ
- คะแนนกิจกรรมในชั้นเรียน
- เปิดเผยคะแนนรวมตัวอย่าง

รหัสเช็กชื่อตัวอย่าง:

```text
510203
```

บัญชีครู:

```text
teacher@tkmooc.local
TKMOOC@1234
```

บัญชีนักเรียน:

```text
10001 / 123456
10002 / 123456
10003 / 123456
10004 / 123456
```

> รหัส `510203` ใช้ได้หลังรัน `seed-phase5` และตราบใดที่คาบตัวอย่างยังอยู่ในสถานะเปิดและไม่เลยเวลาปิด

---

# เปิดระบบ

```bash
rm -rf .next
npm run dev
```

เปิด Browser:

```text
http://localhost:3000
```

## เส้นทางระบบครู

```text
/teacher/attendance
/teacher/classes/[classId]/attendance
/teacher/attendance/[sessionId]
/teacher/attendance/[sessionId]/export
/teacher/gradebook
/teacher/classes/[classId]/gradebook
/teacher/classes/[classId]/gradebook/export
```

## เส้นทางระบบนักเรียน

```text
/student/attendance
/student/grades
```

---

# ลำดับทดสอบระบบเช็กชื่อ

1. เข้าระบบด้วยบัญชีครู
2. เปิดเมนู **เช็กชื่อ**
3. เลือกชั้นเรียน
4. สร้างคาบเช็กชื่อและตั้งสถานะเป็น “เปิดเช็กชื่อ”
5. จดรหัส 6 หลักที่ระบบสร้าง
6. เปิดหน้าต่างไม่ระบุตัวตนและ Login เป็นนักเรียน
7. เปิดเมนู **การเข้าเรียน** แล้วกรอกรหัส
8. กลับบัญชีครู ตรวจว่ารายชื่อนักเรียนเปลี่ยนเป็นมาเรียนหรือมาสาย
9. บันทึกสถานะนักเรียนที่เหลือ
10. ปิดคาบและตรวจว่ารายการยังไม่เช็กเปลี่ยนเป็นขาดเรียน
11. ดาวน์โหลด CSV และเปิดตรวจสอบใน Excel หรือ Google Sheets

# ลำดับทดสอบสมุดคะแนน

1. เข้าระบบด้วยบัญชีครู
2. เปิดเมนู **สมุดคะแนน**
3. เลือกชั้นเรียน
4. กดซิงก์งานและแบบทดสอบ
5. ตรวจว่ารายการจาก Phase 3 และ Phase 4 แสดงในตาราง
6. เพิ่มหมวดคะแนนหรือรายการคะแนนเพิ่มเติม
7. กรอกคะแนนเพิ่มเติมและความคิดเห็นรายคน
8. ตั้งค่าการคำนวณและเกณฑ์เวลาเรียน
9. เผยแพร่รายการคะแนนและเปิดเผยผลรวม
10. Login เป็นนักเรียนและเปิด **คะแนนของฉัน**
11. ตรวจคะแนนรายรายการ ผลตามหมวด คะแนนรวม ระดับผลการเรียน และเวลาเรียน
12. ดาวน์โหลด CSV สมุดคะแนนจากบัญชีครู

---

# ตรวจสอบก่อน Deploy

```bash
npm run typecheck
npm run build
```

จากนั้น Commit:

```bash
git status
git add .
git commit -m "Develop TK Mooc Phase 5 attendance and gradebook"
git push origin main
```

หาก Vercel เชื่อมกับ Repository นี้อยู่แล้ว ระบบจะสร้าง Deployment ใหม่จาก Branch `main`

Environment Variables บน Vercel ต้องมีครบ:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
NEXT_PUBLIC_SITE_URL
```

---

# หมายเหตุการคำนวณคะแนน

- คะแนนงานใช้คะแนนที่ครูตรวจในระบบการส่งงาน
- งานกลุ่มส่งคะแนนให้สมาชิกใน Submission เดียวกัน
- คะแนนแบบทดสอบใช้คะแนนสูงสุดจาก Attempt ที่มีคะแนน
- รายการที่ยังไม่มีคะแนนจะยังไม่ถูกนำไปหารค่าเฉลี่ย
- รายการที่เลือก “ยกเว้น” จะไม่ถูกนำมาคำนวณ
- คะแนนรวมแบบน้ำหนักหมวดจะปรับสัดส่วนตามหมวดที่มีข้อมูลคะแนนจริง
- นักเรียนเห็นเฉพาะรายการที่สถานะเป็น `published`
- คะแนนรวมและระดับผลการเรียนจะแสดงเมื่อตั้งค่า `publish_final_grade` เท่านั้น
