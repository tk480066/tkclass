# TK Mooc Phase 7 v7.0.3 — แก้ Postflight และการบันทึกค่าการเปิดใช้งาน

## ปัญหาที่แก้

1. `YOUR-PREVIEW-URL` และ `YOUR-PRODUCTION-DOMAIN` เป็นข้อความตัวอย่าง ไม่ใช่ URL จริง
2. Postflight เดิมถือว่า HTTP 401/403 เป็นผลสำเร็จสำหรับหน้า Home/Login และแสดงข้อผิดพลาด JSON ไม่ชัดเจนเมื่อ Preview ถูก Vercel Deployment Protection ป้องกัน
3. ปุ่ม “บันทึกค่าการเปิดใช้งาน” เดิมเรียกการยืนยันสิทธิ์และ Upsert แยกกัน 5 ชุดพร้อมกัน ทำให้วิเคราะห์ข้อผิดพลาดยาก และหน้าเว็บไม่มีข้อความผลลัพธ์
4. RPC Audit เดิมส่งเฉพาะบางพารามิเตอร์ รุ่นนี้ส่งพารามิเตอร์ครบทุกตัว

## Postflight ที่ถูกต้อง

Preview:

```bash
npm run phase7:postflight -- --url=https://ชื่อ-preview-จริง.vercel.app
```

Production:

```bash
npm run phase7:postflight -- --url=https://โดเมนจริงของระบบ
```

กรณี Preview เปิด Deployment Protection:

```bash
npm run phase7:postflight -- \
  --url=https://ชื่อ-preview-จริง.vercel.app \
  --bypass-token='VERCEL_AUTOMATION_BYPASS_SECRET'
```

หรือบันทึกใน `.env.local`:

```env
VERCEL_AUTOMATION_BYPASS_SECRET=xxxxxxxx
```

## การบันทึกค่าการเปิดใช้งาน

รุ่นนี้บันทึก `academic_year`, `semester`, `launch_at`, `support_email` และ `announcement_banner` ใน Upsert เดียว พร้อมแสดงข้อความสำเร็จหรือ Error บนหน้า `/admin/launch`

ไม่ต้องรัน Migration ใหม่สำหรับแพตช์นี้
