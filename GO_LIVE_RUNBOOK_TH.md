# Go-live Runbook — TK Mooc

เอกสารนี้ใช้ในวันย้ายข้อมูลและเปิดระบบจริง ควรกำหนดผู้รับผิดชอบอย่างน้อย 2 คน: ผู้ดำเนินการและผู้ตรวจสอบ

## T-7 วัน

- ยืนยันโดเมนที่จะใช้
- สร้าง Supabase Production Project และ Vercel Project
- ตั้งค่า Environment Variables แยก Preview และ Production
- รัน Migration 0001–0007 ใน Staging
- ทดลองนำเข้า CSV ด้วยข้อมูลสำเนา
- ตรวจ RLS ด้วยบัญชีครูและนักเรียนคนละห้อง
- แจ้งช่วงหยุดแก้ไขข้อมูลในระบบเดิม

## T-1 วัน

- Commit โค้ดทั้งหมดและติด Tag เช่น `v7.0.0-rc1`
- รัน `npm run typecheck` และ `npm run build`
- Deploy Preview และรัน `phase7:postflight`
- สำรองฐานข้อมูลและ Storage
- ตรวจรายชื่อครู นักเรียน ชั้นเรียน และจำนวนข้อมูลต้นทาง
- เตรียมข้อความแจ้งผู้ใช้และช่องทางติดต่อ

## วันเปิดระบบ — ก่อนเริ่ม

```bash
npm run phase7:maintenance -- --on
npm run phase7:backup -- --output=./backups/pre-go-live
npm run phase7:preflight
```

จากนั้นหยุดการแก้ไขข้อมูลใน Google Sheets หรือระบบเดิม

## ย้ายข้อมูล

วางไฟล์จริงใน `migration_data/` แล้วทดสอบ:

```bash
npm run phase7:import -- --dir=./migration_data --dry-run --label="Production dry run"
```

แก้ทุก Error แล้วรันจริง:

```bash
npm run phase7:import -- --dir=./migration_data --label="Production migration"
```

ตรวจตาราง `migration_runs` และ `migration_row_errors` จากหน้า `/admin/launch`

## ตรวจข้อมูลหลังย้าย

ตรวจอย่างน้อย:

- จำนวนครูและนักเรียนตรงกับต้นทาง
- รหัสนักเรียนทุกคนเป็น 5 หลักและไม่ซ้ำ
- ชั้นเรียนเชื่อมกับครูถูกคน
- นักเรียนอยู่ห้องและเลขที่ถูกต้อง
- หน่วย บทเรียน งาน และแบบทดสอบเรียงลำดับถูกต้อง
- เวลาเปิด ปิด และกำหนดส่งใช้เขตเวลาไทย
- คะแนนและเวลาเรียนตัวอย่างอย่างน้อย 10 คนตรงกับต้นทาง

## Deploy Production

```bash
npm run typecheck
npm run build
npx vercel@latest --prod
```

จากนั้นรัน:

```bash
npm run phase7:postflight -- --url=https://YOUR-PRODUCTION-DOMAIN
```

## เปิดผู้ใช้กลุ่มนำร่อง

- ครู 2–3 คน
- นักเรียน 10–20 คน
- ทดสอบเข้าสู่ระบบ บทเรียน ส่งงาน แบบทดสอบ เช็กชื่อ คะแนน และข้อความ
- ตรวจ Browser Console และ Vercel Logs

## เปิดใช้งานทั้งหมด

เมื่อ Checklist ทุกข้อผ่าน:

1. เปิด `/admin/launch`
2. ทำเครื่องหมายว่าการย้ายข้อมูลเสร็จ
3. เปลี่ยน Deployment Checks เป็น “ผ่าน”
4. ทำเครื่องหมาย Production Ready
5. ปิด Maintenance mode
6. รัน `/api/health` อีกครั้ง
7. ส่งประกาศลิงก์และคู่มือให้ผู้ใช้

```bash
npm run phase7:maintenance -- --off
npm run phase7:postflight -- --url=https://YOUR-PRODUCTION-DOMAIN
```

## เฝ้าระวัง 24 ชั่วโมงแรก

- ตรวจ Vercel Logs ช่วงเช้า กลางวัน และหลังเลิกเรียน
- ตรวจ Supabase Database, Auth และ Storage usage
- ตรวจข้อความแจ้งปัญหาจากครูและนักเรียน
- ห้ามลบระบบเดิมทันที
- เก็บระบบเดิมแบบ Read-only อย่างน้อยหนึ่งรอบการประเมินผล
