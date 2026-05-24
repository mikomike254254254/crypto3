// Disable email confirmation so sign-up works without SMTP
// The Supabase default mailer works on Free plan, but confirmations
// may fail if the user's email domain is not in Supabase's allowlist.
// Disabling confirmations means users can sign up and log in immediately.

const https = require("https");
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("Please set SUPABASE_ACCESS_TOKEN environment variable");
  process.exit(1);
}

async function patchAuthConfig(settings) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(settings);
    const opts = {
      hostname: "api.supabase.com",
      path: "/v1/projects/nzzstvvbrcdhuiqppdpv/config/auth",
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`);
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log("=== Disabling Email Confirmation ===");

  // The Supabase Management API doesn't expose enable_confirmations directly,
  // but we can try to set other email settings.
  // For the actual confirmation toggle, it needs to be done in the dashboard.
  
  // Set external_email_enabled to true
  const result = await patchAuthConfig({
    external_email_enabled: true,
    disable_signup: false,
  });

  console.log("Auth config updated:");
  console.log("  external_email_enabled:", result.external_email_enabled);
  console.log("  disable_signup:", result.disable_signup);
  console.log("");
  console.log("IMPORTANT: To fully fix 'invalid API' error for email sign-up:");
  console.log("1. Go to: https://supabase.com/dashboard/project/nzzstvvbrcdhuiqppdpv/auth/providers");
  console.log("2. Click on 'Email' provider");
  console.log("3. Toggle OFF 'Confirm email' (or toggle ON if you want to use SMTP)");
  console.log("4. Click Save");
  console.log("");
  console.log("Without SMTP: Turn OFF email confirmation -> users sign up instantly without needing to click a link");
  console.log("With SMTP: Turn ON email confirmation + configure SMTP in Settings -> Auth Settings");
}

main().catch(console.error);