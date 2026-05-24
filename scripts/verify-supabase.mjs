import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const tables = ["users", "transactions", "notifications", "kyc_submissions", "admins"];

async function checkTable(name) {
  const { error } = await supabase.from(name).select("*").limit(1);
  if (!error) return { name, ok: true };
  const msg = error.message || String(error);
  if (msg.includes("does not exist") || msg.includes("schema cache")) {
    return { name, ok: false, error: "table missing" };
  }
  return { name, ok: true, note: msg };
}

async function main() {
  console.log("Supabase URL:", url);
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (authError) {
    console.error("Auth/service key check failed:", authError.message);
    process.exit(1);
  }
  console.log("Service role key: OK (auth admin reachable)");

  for (const name of tables) {
    const result = await checkTable(name);
    console.log(`${result.name}: ${result.ok ? "OK" : "MISSING — run supabase/RUN_ALL_SETUP.sql"}`);
  }

  console.log("\nIf any table is MISSING, open:");
  console.log("https://supabase.com/dashboard/project/nzzstvvbrcdhuiqppdpv/sql/new");
  console.log("Paste and run: supabase/RUN_ALL_SETUP.sql");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
