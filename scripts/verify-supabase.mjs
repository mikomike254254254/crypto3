import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
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

async function columnOk(table, col) {
  const { error } = await supabase.from(table).select(`id,${col}`).limit(0);
  return !error;
}

async function main() {
  console.log("=== Wallex Supabase audit ===\n");
  console.log("Project:", url);

  const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  console.log("Service role:", authError ? `FAIL ${authError.message}` : "OK");

  const tables = ["users", "transactions", "notifications", "kyc_submissions", "admins"];
  for (const t of tables) {
    const { error } = await supabase.from(t).select("*").limit(1);
    console.log(`Table ${t}:`, error ? `MISSING (${error.message})` : "OK");
  }

  console.log("\n--- users columns ---");
  for (const col of ["auth_user_id", "wallet", "avatar_url", "avatar_character", "onboarding_complete", "kyc_status", "referred_by"]) {
    console.log(`  ${col}:`, (await columnOk("users", col)) ? "OK" : "missing (uses auth metadata fallback)");
  }

  console.log("\n--- notifications columns ---");
  for (const col of ["user_id", "auth_user_id", "message", "title", "body", "type", "amount", "read_at"]) {
    console.log(`  ${col}:`, (await columnOk("notifications", col)) ? "OK" : "missing");
  }

  const { data: admins } = await supabase.from("admins").select("email");
  const hasSupport = admins?.some((a) => a.email === "wallexsupport@proton.me");
  console.log("\nAdmin wallexsupport@proton.me:", hasSupport ? "OK" : "MISSING");

  const { count: users } = await supabase.from("users").select("*", { count: "exact", head: true });
  const { count: txs } = await supabase.from("transactions").select("*", { count: "exact", head: true });
  console.log(`\nData: ${users ?? 0} users, ${txs ?? 0} transactions`);

  // Test notification insert (legacy message schema)
  const sampleUser = (await supabase.from("users").select("auth_user_id").limit(1)).data?.[0]?.auth_user_id;
  if (sampleUser) {
    const { data, error } = await supabase
      .from("notifications")
      .insert({ user_id: sampleUser, type: "test", message: "Wallex audit: notifications OK" })
      .select("id")
      .single();
    if (error) {
      console.log("\nNotification insert test: FAIL", error.message);
    } else {
      await supabase.from("notifications").delete().eq("id", data.id);
      console.log("\nNotification insert test: OK");
    }
  }

  console.log("\nOptional SQL upgrade: supabase/PATCH_MISSING_COLUMNS.sql");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
