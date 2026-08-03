# TK Mooc Phase 1 v1.0.6

## รายการแก้ไข

1. ปรับ Menu Bar ด้านบนเป็น `position: fixed` เพื่อให้เลื่อนตามหน้าจอตลอดเวลา
2. เพิ่มระยะด้านบนของหน้าเว็บเพื่อไม่ให้ Hero Section ถูก Menu Bar บัง
3. เพิ่ม `z-index: 1000` และ backdrop blur ให้เมนูอ่านง่ายขณะเลื่อนผ่านเนื้อหา
4. แก้ Error `Can't find variable: School` โดยนำเข้าไอคอน `School` จาก `lucide-react` ใน `components/login-panel.tsx`
5. ปรับค่าบน Smartphone และ Tablet ให้แถบเมนูยังคงอยู่ด้านบนโดยไม่ทับเนื้อหา

## วิธีอัปเดตโปรเจกต์เดิม

คัดลอกไฟล์ต่อไปนี้ไปทับไฟล์เดิม:

- `app/globals.css`
- `components/login-panel.tsx`

แล้วรัน:

```bash
rm -rf .next
npm run dev
```
