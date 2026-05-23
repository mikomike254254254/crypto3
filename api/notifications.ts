import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminClient, requireUser } from "./_supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireUser(req);
    const supabase = adminClient();

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("auth_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return res.status(200).json({
        notifications: (data || []).map((row) => ({
          id: row.id,
          type: row.type,
          title: row.title,
          body: row.body,
          amount: row.amount ? Number(row.amount) : undefined,
          token: row.token,
          fromWallet: row.from_wallet,
          readAt: row.read_at,
          createdAt: row.created_at,
        })),
      });
    }

    if (req.method === "POST") {
      const { id, markAllRead } = req.body ?? {};

      if (markAllRead) {
        const { error } = await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("auth_user_id", user.id)
          .is("read_at", null);

        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      if (!id) {
        return res.status(400).json({ error: "Notification id is required." });
      }

      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .eq("auth_user_id", user.id);

      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notification request failed";
    const status = message.includes("session") || message.includes("token") ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
