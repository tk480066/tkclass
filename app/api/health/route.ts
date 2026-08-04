import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startedAt = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json({
      ok: false,
      service: "TK Mooc",
      error: "Missing public Supabase environment variables",
      response_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await supabase.rpc("app_health");
    if (error) throw error;

    return NextResponse.json({
      ok: Boolean(data?.ok),
      service: "TK Mooc",
      database: data,
      deployment: {
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
        commit_sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
      },
      response_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, { status: data?.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      service: "TK Mooc",
      error: error instanceof Error ? error.message : "Unknown health check error",
      response_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
