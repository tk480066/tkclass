"use client";

import { useFormStatus } from "react-dom";

type CmsSubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
};

export function CmsSubmitButton({
  label,
  pendingLabel = "กำลังบันทึก...",
  className = "",
}: CmsSubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60 ${className}`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
