"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";

export function QuizTimer({ expiresAt, formId, submitButtonId }: { expiresAt: string | null; formId: string; submitButtonId: string }) {
  const target = useMemo(() => expiresAt ? new Date(expiresAt).getTime() : null, [expiresAt]);
  const [remaining, setRemaining] = useState<number | null>(target ? Math.max(0, target - Date.now()) : null);
  useEffect(() => {
    if (!target) return;
    const timer = window.setInterval(() => {
      const next = Math.max(0, target - Date.now());
      setRemaining(next);
      if (next <= 0) {
        window.clearInterval(timer);
        const form = document.getElementById(formId) as HTMLFormElement | null;
        const button = document.getElementById(submitButtonId) as HTMLButtonElement | null;
        if (form && button) form.requestSubmit(button);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [target, formId, submitButtonId]);
  if (remaining === null) return <span className="phase4-timer no-limit"><Clock3 size={17} /> ไม่จำกัดเวลา</span>;
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return <span className={`phase4-timer ${remaining <= 300000 ? "urgent" : ""}`}><Clock3 size={17} /> เหลือ {minutes}:{String(seconds).padStart(2, "0")}</span>;
}
