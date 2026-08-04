# TK Mooc Phase 7 v7.0.2 — Full Cumulative Package

## แก้ไข v7.0.2: เข้าสู่ระบบ Admin

หน้า Login มีแท็บ `ผู้ดูแล` แยกจากครู และจะ Redirect ไป `/admin/launch` หลังตรวจสอบว่า `profiles.role = admin` และ `status = active`

ตรวจบัญชี Admin ได้ด้วย:

```bash
npm run phase7:verify-admin -- \
  --email=admin@school.ac.th \
  --password='YOUR_STRONG_PASSWORD'
```

รายละเอียดเพิ่มเติมอยู่ใน `FIX_ADMIN_LOGIN_TH.md`
> เวอร์ชันนี้รวมไฟล์แกนกลางจาก Phase 1–6 และไฟล์ Phase 7 ครบถ้วนแล้ว แก้ปัญหา `Module not found` ของ `lib/auth` และ `lib/supabase` ที่เกิดเมื่อใช้ Phase 7 v7.0.0 เป็นโครงการเดี่ยว

# TK Mooc Phase 7 — ย้ายข้อมูลและเปิดใช้งาน

Phase 7 เป็นชุดเครื่องมือและหน้าควบคุมสำหรับนำ TK Mooc จากระบบทดสอบเข้าสู่ Production โดยต่อยอดจาก Phase 6 และคงระบบเดิมทุกส่วน ได้แก่ ชั้นเรียน บทเรียน งาน แบบทดสอบ เช็กชื่อ สมุดคะแนน และการสื่อสาร

## สิ่งที่เพิ่มใน Phase 7

- ตารางตั้งค่าระบบและสถานะการเปิดใช้งาน
- ตารางบันทึกรอบการย้ายข้อมูลและ Error รายแถว
- ตารางจับคู่รหัสจาก Google Sheets/CSV กับ UUID ของ Supabase
- Go-live checklist และ Audit events
- หน้า Admin Launch Center ที่ `/admin/launch`
- หน้า Maintenance ที่ `/maintenance`
- Health endpoint ที่ `/api/health`
- สคริปต์สร้างบัญชี Admin
- สคริปต์ Preflight และ Postflight
- สคริปต์ Backup ข้อมูลและ Storage
- สคริปต์นำเข้า CSV แบบ Dry run และรันซ้ำได้
- CSV Templates สำหรับข้อมูลหลักตั้งแต่ Phase 1–6
- GitHub Actions สำหรับ Typecheck/Build และ Supabase Migrations
- Go-live Runbook และ Rollback Plan

## ไฟล์สำคัญ

```text
TK_Mooc_Phase7_v7.0.2/
├── app/
│   ├── admin/launch/page.tsx
│   ├── api/health/route.ts
│   ├── maintenance/page.tsx
│   └── phase7-actions.ts
├── lib/
│   ├── data/phase7.ts
│   └── launch/maintenance.ts
├── scripts/
│   ├── register-phase7-scripts.mjs
│   └── phase7/
│       ├── _shared.mjs
│       ├── backup.mjs
│       ├── create-admin.mjs
│       ├── import-csv.mjs
│       ├── postflight.mjs
│       ├── preflight.mjs
│       └── set-maintenance.mjs
├── migration_templates/
├── supabase/migrations/0007_phase7_launch_migration.sql
├── supabase/verify_phase7.sql
├── .github/workflows/
├── DATA_MAPPING_TH.md
├── GO_LIVE_RUNBOOK_TH.md
├── ROLLBACK_PLAN_TH.md
└── PHASE7_CHECKLIST.md
```

# 1. สำรองโครงการ Phase 6

```bash
cd /Users/tkping/projects
cp -R TK_Mooc_Phase1 TK_Mooc_Phase6_backup_before_phase7
```

# 2. แตกและคัดลอก Phase 7

```bash
cd ~/Downloads
unzip TK_Mooc_Phase7_v7.0.0.zip

rsync -av \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.vercel' \
  ~/Downloads/TK_Mooc_Phase7_v7.0.0/ \
  /Users/tkping/projects/TK_Mooc_Phase1/
```

เข้าโครงการ:

```bash
cd /Users/tkping/projects/TK_Mooc_Phase1
code .
```

# 3. เพิ่มคำสั่ง Phase 7 ใน package.json

รันเพียงครั้งเดียว:

```bash
node scripts/register-phase7-scripts.mjs
```

ตรวจใน `package.json` ว่ามี:

```text
phase7:create-admin
phase7:preflight
phase7:backup
phase7:import
phase7:maintenance
phase7:postflight
```

เพิ่มข้อความจาก `.gitignore.phase7.snippet` ลง `.gitignore` เพื่อป้องกันข้อมูลจริงและ Backup ถูก Commit

# 4. Environment Variables

ไฟล์ `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000

ADMIN_EMAIL=admin@example.ac.th
ADMIN_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
ADMIN_DISPLAY_NAME=ผู้ดูแลระบบ TK Mooc
```

กฎสำคัญ:

- `SUPABASE_SECRET_KEY` ห้ามขึ้นต้นด้วย `NEXT_PUBLIC_`
- ห้าม Commit `.env.local`
- Production และ Preview ควรใช้ Supabase Project คนละตัวเมื่อทำได้
- เปลี่ยนรหัสผ่าน Admin หลังสร้างบัญชีและเก็บใน Password Manager

# 5. รัน SQL Phase 7

เปิดไฟล์:

```text
supabase/migrations/0007_phase7_launch_migration.sql
```

นำไป Run ที่ Supabase SQL Editor หลังจาก Migration 0001–0006 สำเร็จแล้ว

ลำดับทั้งหมด:

```text
0001_phase1_foundation.sql
0002_phase2_classes_lessons.sql
0003_phase3_assignments_submissions.sql
0004_phase4_quizzes.sql
0005_phase5_attendance_gradebook.sql
0006_phase6_communication.sql
0007_phase7_launch_migration.sql
```

ตรวจสอบด้วย:

```text
supabase/verify_phase7.sql
```

หรือใช้ Supabase CLI:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest migration list
npx supabase@latest db push
```

# 6. สร้าง Admin Production

```bash
npm run phase7:create-admin -- \
  --email=admin@example.ac.th \
  --password='STRONG_PASSWORD' \
  --name='ผู้ดูแลระบบ TK Mooc'
```

จากนั้นเข้าสู่ระบบและเปิด:

```text
http://localhost:3000/admin/launch
```

บัญชี Admin ต้องมี `profiles.role = admin`

# 7. ตรวจ Preflight

```bash
npm run phase7:preflight
```

ระบบจะตรวจ:

- Environment Variables
- Supabase connection
- ตาราง Phase 1–7
- Row Level Security
- Storage Buckets
- Auth Admin API
- จำนวนบัญชีและชั้นเรียนเบื้องต้น

Exit code จะเป็น 1 เมื่อพบ Failure เพื่อให้ใช้กับ CI ได้

# 8. สำรองข้อมูลก่อนย้าย

สำรองฐานข้อมูลผ่าน REST และข้อมูล Auth:

```bash
npm run phase7:backup -- --output=./backups/pre-migration
```

สำรองไฟล์จริงจาก Storage ด้วย:

```bash
npm run phase7:backup -- \
  --output=./backups/pre-migration-full \
  --include-storage
```

หมายเหตุ:

- Script นี้เป็น Operational export เพื่อใช้ตรวจสอบและช่วยกู้ข้อมูลรายตาราง
- Production ควรมี Supabase Database Backup หรือ CLI `db dump` เพิ่มอีกชั้น
- Auth password hashes ไม่สามารถ Export ผ่าน Admin API
- Database Backup ไม่ได้รวม Storage object bytes จึงต้องสำรอง Storage แยก

# 9. เตรียมข้อมูลจาก Google Sheets

คัดลอก Templates:

```bash
mkdir -p migration_data
cp migration_templates/*.csv migration_data/
```

แก้ข้อมูลใน `migration_data/` หรือ Export แต่ละ Google Sheet ให้ชื่อและหัวคอลัมน์ตรงกับ Template

ดูรายละเอียด:

```text
DATA_MAPPING_TH.md
```

# 10. Dry run

เปิด Maintenance mode ก่อน:

```bash
npm run phase7:maintenance -- --on
```

ตรวจข้อมูลโดยไม่เขียนข้อมูลจริง:

```bash
npm run phase7:import -- \
  --dir=./migration_data \
  --dry-run \
  --label='Google Sheets Production Dry Run'
```

Error จะถูกแสดงใน Terminal และบันทึกใน `migration_row_errors`

# 11. นำเข้าข้อมูลจริง

```bash
npm run phase7:import -- \
  --dir=./migration_data \
  --label='Google Sheets ปีการศึกษา 2569'
```

สคริปต์นำเข้าแบบ Idempotent สำหรับข้อมูลที่มี external code โดยใช้ `migration_key_map`

ระบบรองรับ:

- ครูและนักเรียน
- ชั้นเรียนและการลงทะเบียน
- หน่วย บทเรียน และ Content blocks
- งาน กลุ่มเป้าหมาย และลิงก์/ไฟล์แนบที่มีอยู่แล้ว
- แบบทดสอบ คำถาม และตัวเลือก
- คาบเช็กชื่อและผลเช็กชื่อ
- หมวดคะแนน คะแนนเพิ่มเติม และคะแนนรายคน
- ประกาศ

ข้อมูลผู้ใช้เดิมจะไม่ถูกรีเซ็ตรหัสผ่านโดยค่าเริ่มต้น หากต้องการจริงให้เพิ่ม:

```bash
--reset-passwords
```

# 12. ตรวจสอบและ Build

```bash
npm install
rm -rf .next
npm run typecheck
npm run build
npm run dev
```

เปิด:

```text
http://localhost:3000/api/health
http://localhost:3000/admin/launch
```

Health endpoint ควรคืน:

```json
{
  "ok": true,
  "database": {
    "schema_version": "7.0.0",
    "maintenance_mode": true
  }
}
```

# 13. Maintenance mode ใน proxy.ts

Phase 7 มีไฟล์:

```text
PHASE7_PROXY_SNIPPET.ts.txt
```

ให้นำฟังก์ชัน `maintenanceRedirect()` ไป Merge กับ `proxy.ts` เดิม อย่าแทนที่ทั้งไฟล์ เพราะ `proxy.ts` เดิมมีหน้าที่ Refresh Supabase Session และป้องกัน Route ตามบทบาทอยู่แล้ว

ต้องยกเว้น:

```text
/maintenance
/api/health
/_next/*
```

และควรให้ `/admin/*` เข้าได้ในช่วง Maintenance เพื่อให้ผู้ดูแลปิดโหมดได้

# 14. Deploy Preview

```bash
npx vercel@latest login
npx vercel@latest link
npx vercel@latest env pull .env.vercel.local
npx vercel@latest
```

ตั้ง Environment Variables แยก Preview และ Production ใน Vercel

ทดสอบ Preview:

```bash
npm run phase7:postflight -- --url=https://YOUR-PREVIEW-URL
```

# 15. Deploy Production

```bash
npx vercel@latest --prod
```

ตั้งค่าโดเมนที่:

```text
Vercel Project → Settings → Domains
```

จากนั้นตั้ง Supabase:

```text
Authentication → URL Configuration
```

- Site URL = โดเมน Production
- Redirect URLs = Production และ Preview URL ที่อนุญาต

ตรวจ Production:

```bash
npm run phase7:postflight -- --url=https://YOUR-PRODUCTION-DOMAIN
```

# 16. เปิดใช้งานจริง

1. Pilot ครูและนักเรียนกลุ่มเล็ก
2. ตรวจระบบทุก Phase
3. อัปเดต Checklist ที่ `/admin/launch`
4. ยืนยันการย้ายข้อมูลเสร็จ
5. ทำเครื่องหมาย Production Ready
6. ปิด Maintenance mode

```bash
npm run phase7:maintenance -- --off
npm run phase7:postflight -- --url=https://YOUR-PRODUCTION-DOMAIN
```

# 17. GitHub Actions

ไฟล์ที่เพิ่ม:

```text
.github/workflows/phase7-quality.yml
.github/workflows/phase7-supabase-migrate.yml
```

GitHub Secrets สำหรับ Quality workflow:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

GitHub Secrets สำหรับ Migration workflow:

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_PASSWORD
SUPABASE_PROJECT_ID
```

Workflow Migration เป็นแบบ `workflow_dispatch` เพื่อไม่ให้ฐานข้อมูล Production เปลี่ยนอัตโนมัติโดยไม่มีผู้อนุมัติ

# 18. Commit

```bash
git status
git add .
git commit -m "Develop TK Mooc Phase 7 migration and go live"
git push origin main
```

อย่า Commit:

```text
.env.local
migration_data/
backups/
```

# ข้อจำกัดที่ต้องทราบ

- CSV Importer ไม่ย้ายไฟล์จริงใน Storage
- ไม่ย้าย Submission, Quiz Attempts และ Message history แบบอัตโนมัติ
- ไม่สามารถ Export รหัสผ่านเดิมจาก Supabase Auth
- ควรเก็บระบบเดิมแบบ Read-only ระหว่างช่วงเปลี่ยนผ่าน
- ทดสอบ Migration กับสำเนาข้อมูลหรือ Staging ก่อน Production เสมอ

เอกสารสำหรับวันเปิดระบบ:

```text
GO_LIVE_RUNBOOK_TH.md
ROLLBACK_PLAN_TH.md
PHASE7_CHECKLIST.md
```
