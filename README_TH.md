# TK Mooc Phase 1 — ระบบพื้นฐาน

> เวอร์ชัน 1.0.3 — ปรับ UI ใหม่ตามแนวทาง Mobile App Showcase พร้อม Motion & Animation Design

## การปรับปรุง UI เวอร์ชัน 1.0.3

- หน้าแรกแบบกรอบเว็บไซต์ทรงโค้งบนพื้นหลังไล่สีม่วง–น้ำเงิน
- Hero Section แบบ Gradient พร้อม Dashboard Mockup ที่สร้างด้วย HTML/CSS
- Section สลับภาพประกอบและข้อความตามแนวทางไฟล์ตัวอย่าง
- หน้า Login, Teacher Dashboard, Student Dashboard และหน้าไม่มีสิทธิ์ในธีมเดียวกัน
- Scroll reveal, floating device, animated chart, shimmer button และ hover interaction
- รองรับ `prefers-reduced-motion` สำหรับผู้ใช้ที่ต้องการลดการเคลื่อนไหว
- Responsive สำหรับ Desktop, Tablet และ Smartphone

ดูรายละเอียดไฟล์ที่แก้ไขและวิธีอัปเดตใน `UI_UPDATE_TH.md`

Starter Project สำหรับพัฒนา TK Mooc ด้วย Next.js, TypeScript, Tailwind CSS, Supabase และ Vercel

## สิ่งที่มีในระยะที่ 1

- หน้าเว็บไซต์เริ่มต้น
- ระบบเข้าสู่ระบบครูด้วยอีเมลและรหัสผ่าน
- ระบบเข้าสู่ระบบนักเรียนด้วยรหัสนักเรียน 5 หลักและ PIN
- Supabase Auth แบบ Cookie-based session
- ตาราง `profiles`, `teacher_profiles`, `student_profiles`
- ตารางพื้นฐาน `classes` และ `enrollments`
- บทบาท `admin`, `teacher`, `student`
- Row Level Security สำหรับข้อมูลผู้ใช้ ชั้นเรียน และการลงทะเบียน
- ป้องกันเส้นทาง `/teacher`, `/student`, `/dashboard`
- Dashboard แยกตามบทบาท
- Script สร้างบัญชีตัวอย่าง
- Environment template สำหรับ Local และ Vercel
- Responsive UI สำหรับคอมพิวเตอร์ โทรศัพท์ และแท็บเล็ต

---

## 1. สิ่งที่ต้องเตรียม

- Node.js 20.9 ขึ้นไป
- Git
- GitHub account
- Supabase account
- Vercel account

ตรวจสอบ Node.js:

```bash
node --version
npm --version
```

---

## 2. สร้าง Supabase Project

1. เปิด Supabase Dashboard
2. กด **New project**
3. ตั้งชื่อ เช่น `tk-mooc`
4. กำหนด Database password ที่คาดเดายาก
5. เลือก Region ที่ใกล้ผู้ใช้
6. รอระบบสร้าง Project

หลังสร้างแล้ว ไปที่ **Project Settings → API Keys** หรือหน้า **Connect** แล้วคัดลอก:

- Project URL
- Publishable key
- Secret key

> Secret key ใช้เฉพาะ Script หรือ Server เท่านั้น ห้ามเขียนใน Client Component และห้ามตั้งชื่อขึ้นต้นด้วย `NEXT_PUBLIC_`

---

## 3. สร้างฐานข้อมูลและ RLS

1. เปิด Supabase Dashboard
2. ไปที่ **SQL Editor**
3. เปิดไฟล์:

```text
supabase/migrations/0001_phase1_foundation.sql
```

4. คัดลอก SQL ทั้งหมดไปวาง
5. กด **Run**

SQL จะสร้าง:

```text
profiles
teacher_profiles
student_profiles
classes
enrollments
```

พร้อม Enum, Index, Trigger, Helper Functions และ RLS Policies

### ตรวจสอบหลังรัน

ไปที่ **Table Editor** ควรพบทั้ง 5 ตาราง และในแต่ละตารางต้องแสดงว่า RLS เปิดอยู่

---

## 4. ปิดการสมัครสมาชิกสาธารณะ

ระบบนี้กำหนดให้ Admin เป็นผู้สร้างบัญชีครูและนักเรียน จึงควรปิดการ Sign up จากบุคคลทั่วไป

ไปที่:

```text
Authentication → Providers → Email
```

ปิดตัวเลือกที่อนุญาตให้ผู้ใช้สมัครบัญชีเอง หรือกำหนดตามหน้าจอ Supabase รุ่นที่ใช้งาน

---

## 5. ตั้งค่า Environment Variables

คัดลอกไฟล์ตัวอย่าง:

```bash
cp .env.example .env.local
```

แก้ไข `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

ห้าม Commit `.env.local` ขึ้น GitHub

---

## 6. ติดตั้ง Package

```bash
npm install
```

---

## 7. สร้างบัญชีตัวอย่าง

หลังรัน SQL และตั้ง `.env.local` แล้ว ให้รัน:

```bash
npm run create-demo-users
```

Script จะสร้าง:

### บัญชีครู

```text
Email: teacher@tkmooc.local
Password: TKMOOC@1234
```

### บัญชีนักเรียน

```text
รหัสนักเรียน: 10001
PIN: 123456
```

และสร้างชั้นเรียนตัวอย่าง `CS-M2-01` พร้อมลงทะเบียนนักเรียนตัวอย่าง

> ควรเปลี่ยนรหัสผ่านตัวอย่างก่อนใช้จริง

### สร้างบัญชีจริงเพิ่มเติม

สร้างครู:

```bash
npm run create-user -- teacher --email=teacher@school.ac.th --password=StrongPassword123 --name=ครูปิง --code=T001 --department=เทคโนโลยี
```

สร้างนักเรียน:

```bash
npm run create-user -- student --code=12345 --pin=123456 --firstName=สมชาย --lastName=ใจดี --title=เด็กชาย --level=ม.2 --room=1 --number=1
```

Script เหล่านี้ใช้ `SUPABASE_SECRET_KEY` จึงต้องรันในเครื่องผู้ดูแลหรือ Server ที่ปลอดภัยเท่านั้น

---

## 8. เปิดระบบในเครื่อง

```bash
npm run dev
```

เปิด:

```text
http://localhost:3000
```

ทดสอบดังนี้:

1. เข้าระบบครูด้วยบัญชีตัวอย่าง
2. ตรวจว่าระบบนำไป `/teacher`
3. ออกจากระบบ
4. เข้าระบบนักเรียนด้วยรหัส `10001` และ PIN `123456`
5. ตรวจว่าระบบนำไป `/student`
6. ลองเปิด `/teacher` ขณะใช้บัญชีนักเรียน ต้องถูกส่งไปหน้าไม่มีสิทธิ์

---

## 9. ตรวจ TypeScript

```bash
npm run typecheck
```

สร้าง Production build:

```bash
npm run build
```

---

## 10. Push ขึ้น GitHub

```bash
git init
git add .
git commit -m "TK Mooc phase 1 foundation"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY
git push -u origin main
```

---

## 11. Deploy บน Vercel

1. เปิด Vercel Dashboard
2. กด **Add New → Project**
3. เลือก GitHub Repository
4. Framework จะถูกตรวจเป็น Next.js
5. เพิ่ม Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
NEXT_PUBLIC_SITE_URL
```

ตัวอย่าง `NEXT_PUBLIC_SITE_URL`:

```text
https://tk-mooc.vercel.app
```

6. เลือก Environment เป็น Production, Preview และ Development ตามต้องการ
7. กด Deploy

เมื่อเปลี่ยน Environment Variables ต้อง Redeploy เพื่อให้ Deployment ใหม่ได้รับค่าใหม่

---

## 12. ตั้งค่า Supabase Auth URL

หลังได้ URL จาก Vercel ให้ไปที่:

```text
Supabase → Authentication → URL Configuration
```

กำหนด:

```text
Site URL:
https://tk-mooc.vercel.app
```

เพิ่ม Redirect URLs:

```text
http://localhost:3000/**
https://tk-mooc.vercel.app/**
https://*.vercel.app/**
```

สำหรับ Production จริงควรจำกัด Redirect URL ให้แคบที่สุด

---

## 13. โครงสร้างไฟล์

```text
TK_Mooc_Phase1/
├── app/
│   ├── auth/callback/route.ts
│   ├── dashboard/page.tsx
│   ├── login/page.tsx
│   ├── student/page.tsx
│   ├── teacher/page.tsx
│   ├── unauthorized/page.tsx
│   ├── actions.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard-shell.tsx
│   ├── login-panel.tsx
│   └── submit-button.tsx
├── lib/
│   ├── auth/require-role.ts
│   ├── supabase/admin.ts
│   ├── supabase/client.ts
│   ├── supabase/proxy.ts
│   ├── supabase/server.ts
│   └── types.ts
├── scripts/create-demo-users.mjs
├── scripts/create-user.mjs
├── supabase/migrations/0001_phase1_foundation.sql
├── supabase/verify_phase1.sql
├── .env.example
├── package.json
├── proxy.ts
├── tsconfig.json
└── vercel.json
```

---

## 14. การป้องกันสิทธิ์ในระบบ

ระบบตรวจสิทธิ์ 3 ชั้น:

1. `proxy.ts` ตรวจว่าผู้ใช้ Login ก่อนเข้าหน้าป้องกัน
2. Server Component ตรวจบทบาทด้วย `requireRole()`
3. Supabase RLS ตรวจว่าบัญชีมีสิทธิ์เข้าถึงแถวข้อมูลจริง

การซ่อนปุ่มหรือเมนูอย่างเดียวไม่ถือว่าเป็นการป้องกันข้อมูล

---

## 15. ข้อควรทำก่อนใช้งานจริง

- เปลี่ยนบัญชีและรหัสผ่านตัวอย่าง
- เพิ่มนโยบายรหัสผ่านและการรีเซ็ต PIN
- จำกัดการสร้างบัญชีให้เฉพาะ Admin
- ทดสอบ RLS ด้วยบัญชีครูและนักเรียนหลายบัญชี
- ไม่เก็บ Secret key ใน Browser
- ไม่บันทึกข้อมูลนักเรียนเกินความจำเป็น
- สร้าง Privacy Notice และกำหนดระยะเวลาเก็บข้อมูล
- แยก Supabase Project สำหรับ Development และ Production เมื่อเริ่มใช้งานจริง

---

## 16. สิ่งที่จะพัฒนาต่อในระยะที่ 2

- จัดการชั้นเรียน
- รายชื่อนักเรียนและการนำเข้า CSV
- หน่วยการเรียนรู้
- บทเรียนและ Lesson Blocks
- ความก้าวหน้าการเรียน
- หน้ารายวิชาของนักเรียน

---

## แก้ปัญหาเข้าสู่ระบบแจ้งว่ารหัสผ่านไม่ถูกต้อง (v1.0.2)

เวอร์ชันก่อนหน้า หากบัญชีตัวอย่างมีอยู่ใน Supabase Auth แล้ว คำสั่ง `npm run create-demo-users` จะไม่เปลี่ยนรหัสผ่านของบัญชีเดิม แต่ยังพิมพ์รหัสผ่านตัวอย่างออกมา ทำให้รหัสที่แสดงอาจไม่ตรงกับรหัสจริง

เวอร์ชัน 1.0.2 แก้ไขให้คำสั่งนี้สร้างบัญชีใหม่หรือรีเซ็ตรหัสผ่านบัญชีเดิมให้ตรงกันทุกครั้ง:

```bash
npm run create-demo-users
npm run verify-demo-login
```

บัญชีครู:

```text
teacher@tkmooc.local
TKMOOC@1234
```

บัญชีนักเรียน:

```text
10001
123456
```

หาก `verify-demo-login` ไม่ผ่าน ข้อความใน Terminal จะแสดงสาเหตุจริงจาก Supabase เช่น Invalid login credentials, Email logins are disabled หรือ Password should be at least ... characters
