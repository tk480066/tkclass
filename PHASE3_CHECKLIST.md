# TK Mooc Phase 3 Checklist

## Database

- [ ] รัน 0001_phase1_foundation.sql
- [ ] รัน 0002_phase2_classes_lessons.sql
- [ ] รัน 0003_phase3_assignments_submissions.sql
- [ ] รัน verify_phase3.sql
- [ ] พบตาราง Phase 3 ครบ 6 ตาราง
- [ ] RLS เปิดทุกตาราง
- [ ] พบ Bucket assignment-files และ submission-files

## Teacher

- [ ] เปิดหน้า /teacher/assignments ได้
- [ ] สร้างงานเดี่ยวได้
- [ ] สร้างงานกลุ่มได้
- [ ] มอบหมายทั้งห้องได้
- [ ] มอบหมายรายบุคคลได้
- [ ] มอบหมายกลุ่มได้
- [ ] อัปโหลดเอกสารประกอบได้
- [ ] แนบลิงก์ได้
- [ ] เห็นผลงานที่นักเรียนส่ง
- [ ] ดาวน์โหลดไฟล์ผลงานได้
- [ ] ให้คะแนนได้
- [ ] ขอแก้ไขงานได้

## Student

- [ ] เปิดหน้า /student/assignments ได้
- [ ] เห็นเฉพาะงานที่ตนได้รับมอบหมาย
- [ ] บันทึกฉบับร่างได้
- [ ] อัปโหลดเอกสารได้
- [ ] อัปโหลดรูปภาพได้
- [ ] อัปโหลดวิดีโอได้
- [ ] แนบลิงก์ได้
- [ ] ส่งงานได้
- [ ] ส่งล่าช้าตามสิทธิ์ได้
- [ ] ยกเลิกและส่งใหม่ตามสิทธิ์ได้
- [ ] ดูคะแนนและความคิดเห็นได้
- [ ] งานกลุ่มแสดงสมาชิกได้

## Security

- [ ] นักเรียนไม่เห็นงานของห้องอื่น
- [ ] นักเรียนไม่เห็นงานรายบุคคลของคนอื่น
- [ ] นักเรียนแก้ submission ของคนอื่นไม่ได้
- [ ] ครูเห็นเฉพาะงานในชั้นเรียนของตน
- [ ] Bucket ทั้งสองเป็น Private
- [ ] Signed URL เปิดไฟล์ได้
- [ ] SUPABASE_SECRET_KEY ไม่อยู่ใน Client และ Git

## Deployment

- [ ] npm run typecheck ผ่าน
- [ ] npm run build ผ่าน
- [ ] Environment Variables บน Vercel ครบ
- [ ] Push GitHub สำเร็จ
- [ ] Production Deployment สำเร็จ
