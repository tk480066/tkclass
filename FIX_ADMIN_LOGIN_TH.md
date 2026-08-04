# แก้ปัญหาเข้าสู่ระบบ Admin — TK Mooc Phase 7 v7.0.2

## สาเหตุ

Phase 7 v7.0.1 มีคำสั่งสร้างบัญชี Admin และหน้า `/admin/launch` แล้ว แต่หน้า Login มีเฉพาะแท็บครูและนักเรียน และ `teacherSignIn()` ยอมรับเฉพาะโปรไฟล์ role=`teacher` ดังนั้น Admin ที่ใช้ฟอร์มครูจะถูก Sign out ทันทีพร้อมข้อความว่าไม่มีสิทธิ์ระบบครู

## สิ่งที่แก้

- เพิ่มแท็บ `ผู้ดูแล` ในหน้า Login
- เพิ่ม Server Action `adminSignIn()`
- ตรวจ role=`admin` และ status=`active`
- Redirect Admin ไป `/admin/launch`
- เพิ่ม `/admin` ให้ Redirect ไปศูนย์เปิดใช้งาน
- เพิ่ม `/admin` ใน Protected Routes ของ Proxy
- เพิ่มปุ่มออกจากระบบในหน้า Admin
- เพิ่มคำสั่งตรวจบัญชี `phase7:verify-admin`
- ปรับคำสั่งสร้าง Admin ให้ตรวจ Profile หลัง Upsert

## สร้างหรือรีเซ็ต Admin

```bash
npm run phase7:create-admin -- \
  --email=admin@school.ac.th \
  --password='YOUR_STRONG_PASSWORD' \
  --name='ผู้ดูแลระบบ TK Mooc'
```

## ตรวจสอบ Login โดยไม่ผ่านหน้าเว็บ

```bash
npm run phase7:verify-admin -- \
  --email=admin@school.ac.th \
  --password='YOUR_STRONG_PASSWORD'
```

เมื่อผ่านควรแสดง `Admin login verification passed.`

## ตรวจสอบใน Supabase SQL Editor

```sql
select
  au.id,
  au.email,
  au.email_confirmed_at,
  p.role,
  p.display_name,
  p.status
from auth.users au
left join public.profiles p on p.id = au.id
where lower(au.email) = lower('admin@school.ac.th');
```

ค่าที่ถูกต้องคือ role=`admin`, status=`active` และ `email_confirmed_at` ไม่เป็น null
