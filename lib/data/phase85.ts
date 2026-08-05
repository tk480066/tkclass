import { createClient } from "@/lib/supabase/server";

export type Phase85Readiness = {
  ok: boolean;
  schema_version: string;
  missing_tables: string[];
  rls_disabled: string[];
  tables_without_policies: string[];
  missing_buckets: string[];
  deployment_failed: number;
  deployment_pending: number;
  checked_at: string;
};

export async function getPhase85Readiness(): Promise<Phase85Readiness> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("phase85_readiness_report");
  if (error) throw new Error(`ตรวจความพร้อม Phase 8.5 ไม่สำเร็จ: ${error.message}`);
  return data as Phase85Readiness;
}
