import { AlertTriangle, BellRing, Circle } from "lucide-react";
import type { CommunicationPriority } from "@/lib/types";

const labels: Record<CommunicationPriority, string> = {
  normal: "ทั่วไป",
  important: "สำคัญ",
  urgent: "เร่งด่วน",
};

export function PriorityBadge({ priority }: { priority: CommunicationPriority }) {
  const Icon = priority === "urgent" ? AlertTriangle : priority === "important" ? BellRing : Circle;
  return <span className={`phase6-priority-badge is-${priority}`}><Icon size={13} /> {labels[priority]}</span>;
}
