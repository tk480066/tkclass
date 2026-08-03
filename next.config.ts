import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // กำหนด root ของ Turbopack ให้เป็นโฟลเดอร์โปรเจกต์นี้โดยตรง
  // ป้องกัน Next.js เลือก package-lock.json จากโฟลเดอร์ระดับบน
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
