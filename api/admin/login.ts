import type { VercelRequest, VercelResponse } from "@vercel/node";
import { issueAdminPanelToken, verifyAdminCredentials } from "../adminAuth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    if (!verifyAdminCredentials(String(email), String(password))) {
      return res.status(401).json({ error: "Invalid admin credentials." });
    }

    const session = issueAdminPanelToken(String(email));
    return res.status(200).json({
      ok: true,
      email: String(email).trim().toLowerCase(),
      token: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin login failed";
    return res.status(500).json({ error: message });
  }
}
