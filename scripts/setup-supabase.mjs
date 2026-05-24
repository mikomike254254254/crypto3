import https from "https";

// > IMPORTANT: Copy your Supabase access token here before running
// > Get it from: https://supabase.com/dashboard/account/tokens
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || "YOUR_TOKEN_HERE";
const PROJECT_REF = "nzzstvvbrcdhuiqppdpv";

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: "api.supabase.com",
      path: `/v1/projects/${PROJECT_REF}${path}`,
      method,
      headers: {
        Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    };
    if (data) options.headers["Content-Length"] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => (responseBody += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseBody);
        } else {
          reject(`HTTP ${res.statusCode}: ${responseBody.substring(0, 300)}`);
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log("=== Supabase Setup Script ===");
  console.log("Run: SUPABASE_ACCESS_TOKEN=your_token node scripts/setup-supabase.mjs");
  console.log("");

  if (SUPABASE_ACCESS_TOKEN === "YOUR_TOKEN_HERE") {
    console.error("Please set SUPABASE_ACCESS_TOKEN env var first");
    process.exit(1);
  }

  console.log("Running SQL migrations...");
  const sql = `
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet TEXT NOT NULL,
  document_type TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  date_of_birth TEXT,
  country TEXT,
  address TEXT,
  front_path TEXT,
  back_path TEXT,
  selfie_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_started';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_character TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_gradient TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signup_bonus_awarded BOOLEAN DEFAULT false;
  ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS from_wallet TEXT;
  ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS to_wallet TEXT;
  ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS token TEXT;
  ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
  ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS network TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  message TEXT,
  amount NUMERIC,
  token TEXT,
  from_wallet TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE EXTENSION IF NOT EXISTS pgcrypto;
`;

  try {
    await apiRequest("POST", "/database/query", { query: sql });
    console.log("SQL Migrations: SUCCESS");
  } catch (err) {
    console.error("SQL error:", err);
  }

  console.log("Done! Go to Supabase dashboard to enable SMTP for email sign-in.");
}

main();