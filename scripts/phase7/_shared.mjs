import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

export function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function getSupabaseConfig() {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secretKey) throw new Error("Missing SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)");
  return { url, publishableKey, secretKey };
}

export function createAdminSupabase() {
  const { url, secretKey } = getSupabaseConfig();
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function createPublicSupabase() {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function parseCliArgs(argv = process.argv.slice(2)) {
  const result = { _: [] };
  for (const arg of argv) {
    if (!arg.startsWith("--")) {
      result._.push(arg);
      continue;
    }
    const [rawKey, ...parts] = arg.slice(2).split("=");
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    result[key] = parts.length ? parts.join("=") : true;
  }
  return result;
}

export function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "y", "on", "ใช่"].includes(String(value).trim().toLowerCase());
}

export function toNumber(value, fallback = null) {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const number = Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(number)) throw new Error(`Invalid number: ${value}`);
  return number;
}

export function toInteger(value, fallback = null) {
  const number = toNumber(value, fallback);
  if (number === null) return null;
  if (!Number.isInteger(number)) throw new Error(`Expected integer: ${value}`);
  return number;
}

export function toIsoDate(value, fallback = null) {
  if (!value || !String(value).trim()) return fallback;
  const date = new Date(String(value).trim());
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date/time: ${value}`);
  return date.toISOString();
}

export function splitList(value) {
  if (!value || !String(value).trim()) return [];
  return String(value).split(/[|;\n]/).map((item) => item.trim()).filter(Boolean);
}

export function parseJson(value, fallback = {}) {
  if (!value || !String(value).trim()) return fallback;
  try {
    return JSON.parse(String(value));
  } catch {
    throw new Error(`Invalid JSON: ${String(value).slice(0, 120)}`);
  }
}

export function parseCsv(text) {
  const source = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  const meaningful = rows.filter((cells) => cells.some((cell) => String(cell).trim() !== ""));
  if (!meaningful.length) return [];
  const headers = meaningful[0].map((header) => header.trim());
  return meaningful.slice(1).map((cells, index) => {
    const data = { __rowNumber: index + 2 };
    headers.forEach((header, cellIndex) => {
      data[header] = (cells[cellIndex] ?? "").trim();
    });
    return data;
  });
}

export function readCsvIfExists(directory, fileName) {
  const filePath = path.resolve(directory, fileName);
  if (!fs.existsSync(filePath)) return { filePath, rows: [] };
  return { filePath, rows: parseCsv(fs.readFileSync(filePath, "utf8")) };
}

export function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

export function safeFileName(value) {
  return value.replace(/[:.]/g, "-").replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function paginateTable(supabase, table, select = "*", pageSize = 1000) {
  const output = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    output.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return output;
}

export async function listAllAuthUsers(supabase) {
  const output = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth.users: ${error.message}`);
    output.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return output;
}

export async function assertNoError(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

export function printHeading(title) {
  console.log(`\n=== ${title} ===`);
}

export function maskSecret(value) {
  if (!value) return "(missing)";
  if (value.length < 10) return "***";
  return `${value.slice(0, 5)}…${value.slice(-4)}`;
}
