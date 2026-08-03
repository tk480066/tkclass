"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tkmooc-theme");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const enabled = stored ? stored === "dark" : preferred;
    document.documentElement.dataset.theme = enabled ? "dark" : "light";
    setDark(enabled);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("tkmooc-theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={dark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
      title={dark ? "โหมดสว่าง" : "โหมดมืด"}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
