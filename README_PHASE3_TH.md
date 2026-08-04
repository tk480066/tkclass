# TK Mooc Phase 3 — งานและการส่งงาน

พัฒนาต่อยอดจาก Phase 2 โดยคงระบบ Next.js, Supabase Auth, RLS, ชั้นเรียน บทเรียน Dark mode และ UI เดิม พร้อมเพิ่มระบบมอบหมายงาน การส่งงาน และการตรวจงาน

## ความสามารถระบบครู

- ดูจำนวนงาน ผลงานที่ส่ง และงานรอตรวจบน Dashboard
- สร้างงานเดี่ยวและงานกลุ่ม
- กำหนดคำสั่ง คะแนนเต็ม คะแนนผ่าน วันเผยแพร่ และกำหนดส่ง
- อนุญาตหรือไม่อนุญาตการส่งล่าช้าและการส่งใหม่
- เลือกรูปแบบการส่ง: ข้อความ เอกสาร รูปภาพ วิดีโอ และลิงก์
- มอบหมายให้ทั้งห้อง รายบุคคล หรือกลุ่ม
- อัปโหลดเอกสารประกอบหลายไฟล์
- แนบลิงก์ Google Drive, YouTube หรือเว็บไซต์อื่น
- ดูผลงานและไฟล์ของนักเรียน
- กรองงานรอตรวจ งานล่าช้า งานต้องแก้ไข และงานที่ผ่าน
- ให้คะแนน แสดงความคิดเห็น และขอให้นักเรียนแก้ไข
- เก็บงานเข้าคลัง

## ความสามารถระบบนักเรียน

- Dashboard แสดงงานที่ต้องทำและงานใกล้ครบกำหนด
- ดูงานตามสถานะ ยังไม่เริ่ม กำลังทำ ส่งแล้ว ส่งล่าช้า ต้องแก้ไข ครูตรวจแล้ว ผ่าน และไม่ผ่าน
- อ่านคำสั่ง คะแนนเต็ม กำหนดส่ง และเอกสารประกอบ
- บันทึกฉบับร่างก่อนส่ง
- ส่งคำตอบแบบข้อความ ลิงก์ เอกสาร รูปภาพ และวิดีโอ
- อัปโหลดหลายไฟล์ สูงสุด 100 MB ต่อไฟล์
- ยกเลิกการส่งและส่งใหม่เมื่อครูอนุญาต
- รองรับงานกลุ่มและแสดงสมาชิกกลุ่ม
- ดูคะแนนและความคิดเห็นจากครู

## ตารางใหม่

```text
assignments
assignment_targets
assignment_attachments
submissions
submission_members
submission_files
```

## Storage Buckets

```text
assignment-files   เอกสารประกอบจากครู สูงสุด 30 MB ต่อไฟล์
submission-files   ผลงานนักเรียน สูงสุด 100 MB ต่อไฟล์
```

ทั้งสอง Bucket เป็น Private และใช้ RLS/Signed URL

---

## 1. สำรองโครงการเดิม

```bash
cd /Users/tkping/projects
cp -R TK_Mooc_Phase1 TK_Mooc_Phase2_backup_before_phase3
```

ชื่อโฟลเดอร์โครงการจริงอาจยังเป็น `TK_Mooc_Phase1` แม้พัฒนาถึง Phase 2

## 2. แตกและคัดลอก Phase 3

```bash
cd ~/Downloads
unzip TK_Mooc_Phase3_v3.0.0.zip

rsync -av \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.vercel' \
  ~/Downloads/TK_Mooc_Phase3_v3.0.0/ \
  /Users/tkping/projects/TK_Mooc_Phase1/
```

## 3. รัน SQL Phase 3

เปิดไฟล์:

```text
supabase/migrations/0003_phase3_assignments_submissions.sql
```

คัดลอกทั้งหมดไปที่:

```text
Supabase Dashboard → SQL Editor → New query → Run
```

ต้องรันตามลำดับก่อนหน้าแล้ว:

```text
0001_phase1_foundation.sql
0002_phase2_classes_lessons.sql
0003_phase3_assignments_submissions.sql
```

ตรวจสอบด้วย:

```text
supabase/verify_phase3.sql
```

## 4. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

ห้าม Commit `.env.local` หรือ `SUPABASE_SECRET_KEY` ขึ้น GitHub

## 5. สร้างข้อมูลตัวอย่าง

รันตามลำดับ:

```bash
npm run create-demo-users
npm run seed-phase2
npm run seed-phase3
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

ข้อมูล Phase 3 ตัวอย่าง:

- งานรายบุคคล 2 งาน
- งานกลุ่ม 1 งาน
- งานฉบับร่าง 1 งาน
- นักเรียน 10001 มีงานที่ครูขอให้แก้ไข
- นักเรียน 10002 มีงานรอครูตรวจ

## 6. เปิดระบบ

```bash
cd /Users/tkping/projects/TK_Mooc_Phase1
npm install
rm -rf .next
npm run dev
```

เปิด:

```text
http://localhost:3000
```

## 7. เส้นทางใหม่

ระบบครู:

```text
/teacher/assignments
/teacher/classes/[classId]/assignments
/teacher/assignments/[assignmentId]
```

ระบบนักเรียน:

```text
/student/assignments
/student/assignments/[assignmentId]
```

## 8. ขั้นตอนทดสอบครู

1. Login เป็นครู
2. เปิด `งานและการส่งงาน`
3. เลือกชั้นเรียน
4. สร้างงานและกำหนดสถานะ `เผยแพร่`
5. ทดลองมอบหมายทั้งห้อง รายบุคคล และกลุ่ม
6. เปิดรายละเอียดงานแล้วแนบไฟล์/ลิงก์
7. Login เป็นนักเรียนและส่งงาน
8. กลับเป็นครู เปิดผลงาน ให้คะแนน และบันทึกความคิดเห็น
9. ทดลองเลือก `ขอให้แก้ไข`

## 9. ขั้นตอนทดสอบนักเรียน

1. Login ด้วยรหัส 10001
2. เปิด `งานของฉัน`
3. เปิดงานที่ต้องแก้ไข
4. แก้คำตอบและบันทึกฉบับร่าง
5. อัปโหลดไฟล์
6. กดส่งงาน
7. ทดลองยกเลิกการส่งเมื่อครูอนุญาต
8. ตรวจคะแนนและความคิดเห็นหลังครูตรวจ

## 10. ตรวจ Build

```bash
npm run typecheck
npm run build
```

จากนั้น Commit:

```bash
git add .
git commit -m "Develop TK Mooc Phase 3 assignments and submissions"
git push origin main
```

หาก Vercel เชื่อม GitHub อยู่แล้ว ระบบจะ Deploy ให้อัตโนมัติ

## ข้อจำกัดใน Phase 3

- ยังไม่มี Rubric Builder แบบแก้ไขผ่าน UI แม้ฐานข้อมูลเตรียม `rubric_json` และ `rubric_scores` ไว้แล้ว
- ยังไม่มีการ ZIP ดาวน์โหลดผลงานทั้งหมด เนื่องจากควรทำผ่าน Server/Background job ในระยะรายงาน
- ยังไม่มีการแจ้งเตือนแบบ Realtime จะเพิ่มในระยะการสื่อสาร
- ไฟล์วิดีโอขนาดใหญ่มากควรใช้ YouTube/Google Drive แล้วแนบลิงก์
