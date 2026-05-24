import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = {
    supabaseUrl: process.env.SUPABASE_URL ? "configured" : "missing",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "configured" : "missing",
    appUrl: process.env.VITE_APP_URL || "not set",
  };
  
  res.status(200).json({
    message: "Auth configuration check",
    config,
    note: "If Google OAuth still fails, check Supabase Dashboard → Authentication → Providers → Google"
  });
}