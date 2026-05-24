// Run: node scripts/fix-note-column.mjs
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nzzstvvbrcdhuiqppdpv.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56enN0dnZicmNkaHVpcXBwZHB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE3MTk4MiwiZXhwIjoyMDk0NzQ3OTgyfQ.IcrX15Ug49srNJlLn_JfSK7IpiXSkaBaBVuy2snBD6s";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("=== Fixing Supabase schema ===");

  // 1. Add note column to transactions if missing
  const { error: noteError } = await supabase.rpc("exec_sql", {
    sql: "ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS note TEXT;",
  });
  if (noteError) {
    // Try direct SQL via REST
    const { error } = await supabase.from("transactions").update({ note: "" }).eq("id", "00000000-0000-0000-0000-000000000000");
    if (error && error.message?.includes("column")) {
      console.log("note column missing, need to add via dashboard");
      console.log("Run in Supabase SQL Editor: ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS note TEXT;");
    }
  }
  console.log("note column check done");

  // 2. Verify the transactions table has all needed columns
  const { data: cols, error: colError } = await supabase
    .from("transactions")
    .select("*")
    .limit(1);
  
  if (colError) {
    console.log("Table error:", colError.message);
  } else if (cols) {
    const columns = Object.keys(cols[0] || {});
    console.log("Transactions columns:", columns.join(", "));
    const missing = ["from_wallet", "to_wallet", "token", "status", "note"].filter(c => !columns.includes(c));
    if (missing.length) {
      console.log("MISSING columns:", missing.join(", "));
    } else {
      console.log("All required columns exist!");
    }
  }

  // 3. Update admin config
  const { error: kvError } = await supabase.from("kv_store").upsert({
    key: "admin_emails",
    value: ["wallexsupport@proton.me", "mikomike420@gmail.com"],
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });
  if (kvError) console.log("kv_store error:", kvError.message);
  else console.log("Admin emails updated");

  // 4. Set admin config
  await supabase.rpc("set_config", { key: "app.admin_emails", value: "wallexsupport@proton.me,mikomike420@gmail.com" }).catch(() => {
    console.log("set_config not available, skipping");
  });

  console.log("=== Done ===");
}

main().catch(console.error);