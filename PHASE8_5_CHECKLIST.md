# Phase 8.5 Checklist

## Responsive
- [ ] Home 360px ไม่มี horizontal scroll
- [ ] Login ใช้งานได้ด้วยคีย์บอร์ดและมือถือ
- [ ] Admin forms ไม่ล้นหน้าจอ
- [ ] ตารางและ code block เลื่อนแนวนอนได้
- [ ] Preview ใช้งานบน Tablet ได้
- [ ] รูปภาพไม่บิดและมี alt text

## RLS
- [ ] รัน Migration 0012
- [ ] `phase85:rls` ผ่าน
- [ ] CMS ทุกตารางเปิด RLS
- [ ] Public อ่านเฉพาะ published/scheduled ที่ถึงเวลา
- [ ] Teacher/Student แก้ CMS ไม่ได้
- [ ] Admin จัดการ CMS ได้
- [ ] Storage `site-assets` จำกัดสิทธิ์อัปโหลดเฉพาะ Admin

## Production
- [ ] `npm run typecheck` ผ่าน
- [ ] `npm run build` ผ่าน
- [ ] Preview deployment ผ่าน
- [ ] Production Environment Variables ครบ
- [ ] `/api/health` ตอบ JSON และ ok=true
- [ ] HTTPS และโดเมนจริงทำงาน
- [ ] Security headers แสดง
- [ ] Backup และ Rollback พร้อม
- [ ] ทดสอบ Admin/Teacher/Student
- [ ] ปิด Maintenance หลังตรวจครบ
