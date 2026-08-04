# แก้ Build Error: Missing Core Modules — Phase 7 v7.0.1

## สาเหตุ

Phase 7 v7.0.0 เป็นชุดไฟล์เพิ่มสำหรับนำไปวางทับ Phase 6 จึงไม่มีไฟล์แกนกลางบางส่วนอยู่ภายใน ZIP เช่น

- `lib/auth/require-role.ts`
- `lib/supabase/server.ts`
- `lib/supabase/proxy.ts`
- `lib/supabase/client.ts`
- `lib/supabase/admin.ts`
- `lib/types.ts`

หากแตก Phase 7 v7.0.0 เป็นโครงการใหม่แล้วสั่ง `npm run build` จะเกิด `Module not found` ตามที่พบ

## สิ่งที่แก้ใน v7.0.1

เวอร์ชัน 7.0.1 เป็น Full Cumulative Package รวม Phase 1–7 ไว้ครบแล้ว สามารถใช้เป็นโครงการเต็มได้ ไม่ต้องคัดลอกไฟล์แกนกลางจากเวอร์ชันก่อน

## วิธีอัปเดตโครงการเดิม

หยุด Development Server แล้วสำรองโครงการ:

```bash
cd /Users/tkping/projects
cp -R TK_Mooc_Phase1 TK_Mooc_backup_before_v7_0_1
```

แตก ZIP แล้ววางทับ โดยเก็บ `.git`, `.env.local`, `node_modules` และข้อมูล Vercel เดิม:

```bash
cd ~/Downloads
unzip TK_Mooc_Phase7_v7.0.1.zip

rsync -av \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.vercel' \
  ~/Downloads/TK_Mooc_Phase7_v7.0.1/ \
  /Users/tkping/projects/TK_Mooc_Phase1/
```

จากนั้น:

```bash
cd /Users/tkping/projects/TK_Mooc_Phase1
rm -rf .next
npm install
npm run typecheck
npm run build
```

## ตรวจสอบไฟล์แกนกลาง

```bash
ls -la lib/auth/require-role.ts
ls -la lib/supabase/server.ts
ls -la lib/supabase/proxy.ts
ls -la lib/types.ts
```

ไฟล์ทั้งสี่ต้องแสดงอยู่จริงก่อน Build
