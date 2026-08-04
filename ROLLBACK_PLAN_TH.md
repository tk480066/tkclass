# แผนย้อนกลับเมื่อเปิดระบบไม่สำเร็จ

## เงื่อนไขที่ควร Rollback ทันที

- ผู้ใช้ส่วนใหญ่เข้าสู่ระบบไม่ได้
- ครูเห็นข้อมูลนักเรียนผิดห้องหรือข้ามชั้นเรียน
- นักเรียนเข้าถึงข้อมูลของผู้อื่นได้
- คะแนน งาน หรือคำตอบสูญหายหรือผิดจำนวนมาก
- Production มี HTTP 5xx ต่อเนื่อง
- Migration ทำให้ฐานข้อมูลไม่พร้อมใช้งาน

## ขั้นตอนเร่งด่วน

1. เปิด Maintenance mode

```bash
npm run phase7:maintenance -- --on
```

2. หยุดการนำเข้าข้อมูลและหยุดการ Deploy เพิ่ม
3. เก็บ Vercel Logs, Migration Run ID และเวลาที่เกิดเหตุ
4. Rollback Vercel ไป Deployment ก่อนหน้า

```bash
npx vercel@latest rollback
npx vercel@latest rollback status
```

5. ตรวจว่าเว็บไซต์เวอร์ชันก่อนหน้ากลับมาใช้งานได้
6. หากปัญหาอยู่ที่ข้อมูล ให้หยุดก่อน Restore Database เพราะการ Restore อาจทำให้ข้อมูลหลัง Backup สูญหาย

## การย้อนกลับข้อมูล

ลำดับความปลอดภัย:

1. Export ข้อมูลปัจจุบันก่อนเสมอ แม้ข้อมูลจะผิด
2. ประเมินว่าซ่อมเฉพาะแถวได้หรือไม่
3. ใช้ `migration_key_map` และ `migration_runs` เพื่อระบุข้อมูลที่นำเข้ารอบนั้น
4. Restore จาก Supabase Backup/PITR เฉพาะเมื่อจำเป็นและได้รับอนุมัติ
5. ตรวจ Storage แยกจาก Database เพราะ Database Backup ไม่ได้เก็บ Object bytes

## หลัง Rollback

- แจ้งผู้ใช้ว่าระบบกลับสู่โหมดบำรุงรักษา
- วิเคราะห์สาเหตุและสร้าง Issue ใน GitHub
- แก้ไขใน Branch ใหม่และทดสอบ Preview/Staging
- ห้าม Deploy ซ้ำโดยข้าม Dry run และ Postflight
