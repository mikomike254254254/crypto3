import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminClient, requireUser } from "./_supabase.js";

function isMissingTableOrColumn(error: { message?: string }) {
  const msg = (error.message || "").toLowerCase();
  return (
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("relation") ||
    msg.includes("column")
  );
}

function mapRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    type: String(row.type || "receive"),
    title: String(row.title || "Notification"),
    body: String(row.body || ""),
    amount: row.amount != null ? Number(row.amount) : undefined,
    token: row.token ? String(row.token) : undefined,
    fromWallet: row.from_wallet ? String(row.from_wallet) : undefined,
    readAt: row.read_at ? String(row.read_at) : null,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

async function listNotifications(authUserId: string) {
  const supabase = adminClient();

  const attempts = [
    "id, type, title, body, amount, token, from_wallet, read_at, created_at",
    "id, type, title, body, read_at, created_at",
    "id, type, title, body, created_at",
  ];

  for (const columns of attempts) {
    for (const userColumn of ["user_id", "auth_user_id"] as const) {
      const { data, error } = await supabase
        .from("notifications")
        .select(columns)
        .eq(userColumn, authUserId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error) {
        return (data || []).map((row) => mapRow(row as unknown as Record<string, unknown>));
      }

      if (!isMissingTableOrColumn(error)) {
        throw error;
      }
    }
  }

  return [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireUser(req);
    const supabase = adminClient();

    if (req.method === "GET") {
      const notifications = await listNotifications(user.id);
      return res.status(200).json({ notifications });
    }

    if (req.method === "POST") {
      const { id, markAllRead } = req.body ?? {};

      if (markAllRead) {
        let updated = false;
        for (const userColumn of ["user_id", "auth_user_id"] as const) {
          const { error } = await supabase
            .from("notifications")
            .update({ read_at: new Date().toISOString() })
            .eq(userColumn, user.id)
            .is("read_at", null);
          if (!error) {
            updated = true;
            break;
          }
          if (!isMissingTableOrColumn(error)) throw error;
        }
        return res.status(200).json({ ok: true });
      }

      if (!id) {
        return res.status(400).json({ error: "Notification id is required." });
      }

      let markError: { message?: string } | null = null;
      for (const userColumn of ["user_id", "auth_user_id"] as const) {
        const { error } = await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", id)
          .eq(userColumn, user.id);
        if (!error) {
          markError = null;
          break;
        }
        markError = error;
        if (!isMissingTableOrColumn(error)) throw error;
      }

      if (markError && !isMissingTableOrColumn(markError)) throw markError;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error && "message" in error
          ? String((error as { message: unknown }).message)
          : "Notification request failed";

    if (isMissingTableOrColumn({ message })) {
      return res.status(200).json({ notifications: [] });
    }

    const status = message.includes("session") || message.includes("token") ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
