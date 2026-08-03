import { GraduationCap } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup">
      <span className="brand-symbol" aria-hidden="true">
        <GraduationCap size={compact ? 20 : 23} strokeWidth={2.4} />
      </span>
      <span className="brand-copy">
        <strong>TK Mooc</strong>
        {!compact && <small>ศูนย์การเรียนรู้ครูปิง</small>}
      </span>
    </span>
  );
}
