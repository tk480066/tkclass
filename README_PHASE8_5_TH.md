# TK Mooc Phase 8.5 — Responsive, RLS และ Production Deployment

Phase 8.5 เป็นขั้นตรวจคุณภาพก่อนเปิดใช้งานจริง ต่อจาก Phase 8.4 โดยเพิ่มศูนย์ตรวจความพร้อม, SQL audit, คำสั่งตรวจ Responsive/RLS/Production, Security headers และ GitHub Actions

## ติดตั้ง

1. สำรองโครงการเดิม
2. คัดลอก Patch ทับโครงการ Phase 8.4
3. รัน `supabase/migrations/0012_phase8_5_production_readiness.sql`
4. รัน `supabase/verify_phase8_5.sql`
5. รันคำสั่งตรวจคุณภาพ

```bash
npm install
npm run phase85:responsive
npm run phase85:rls
npm run typecheck
npm run build
```

หน้า Admin ใหม่:

```text
/admin/quality
```

## ตรวจ Production

```bash
npm run phase85:production -- --url=https://โดเมนจริงของระบบ
```

สคริปต์ตรวจหน้า `/`, `/login`, `/api/health` และบังคับใช้ HTTPS

## Breakpoints ที่ต้องตรวจด้วย Browser DevTools

- 360 × 800
- 390 × 844
- 768 × 1024
- 1024 × 768
- 1440 × 900

ตรวจหน้า Home, Login, Teacher, Student, Admin CMS, Preview และตารางข้อมูลที่มีหลายคอลัมน์

## RLS

ฟังก์ชัน `phase85_readiness_report()` ตรวจ:

- ตารางหลักครบ
- ตาราง CMS เปิด RLS
- ตาราง CMS มี Policy
- Storage Bucket ครบ
- Deployment checks ไม่มีสถานะ failed

## Production

ก่อนเปิดระบบจริงให้ตรวจ Environment Variables ของ Vercel, HTTPS, Custom domain, Backup, Rollback, Admin login และข้อมูลจริงทุกบทบาท
