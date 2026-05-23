import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminClient, ensureUserAccount, requireUser } from "./_supabase.js";

function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image payload.");
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function ensureKycBucket(supabase: ReturnType<typeof adminClient>) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets || []).some((b) => b.name === "kyc-documents");
  if (!exists) {
    const { error } = await supabase.storage.createBucket("kyc-documents", { public: false });
    if (error && !error.message?.includes("already exists")) {
      throw new Error(`KYC storage bucket could not be created: ${error.message}`);
    }
  }
}

async function uploadImage(userId: string, name: string, dataUrl?: string) {
  if (!dataUrl) return null;

  const supabase = adminClient();
  await ensureKycBucket(supabase);

  const { buffer, contentType } = dataUrlToBuffer(dataUrl);
  const path = `${userId}/${Date.now()}-${name}.jpg`;

  const { error } = await supabase.storage.from("kyc-documents").upload(path, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Could not upload ${name} image: ${error.message}`);
  }

  return path;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await requireUser(req);
    const supabase = adminClient();
    const userRow = await ensureUserAccount(user);
    const { documentType, legalName, dateOfBirth, country, address, frontImage, backImage, selfieImage } = req.body ?? {};

    if (!documentType || !frontImage || !backImage || !selfieImage) {
      return res.status(400).json({ error: "KYC document type, document photos, and selfie are required." });
    }

    const folder = user.id;
    const [frontPath, backPath, selfiePath] = await Promise.all([
      uploadImage(folder, "front", frontImage),
      uploadImage(folder, "back", backImage),
      uploadImage(folder, "selfie", selfieImage),
    ]);

    const { data: existing } = await supabase
      .from("kyc_submissions")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing?.id) {
      const { data: updated, error: updateErr } = await supabase
        .from("kyc_submissions")
        .update({
          document_type: documentType,
          legal_name: legalName || userRow.full_name,
          date_of_birth: dateOfBirth || null,
          country: country || null,
          address: address || null,
          front_path: frontPath,
          back_path: backPath,
          selfie_path: selfiePath,
          status: "pending",
          wallet: userRow.wallet,
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (updateErr) throw updateErr;

      await supabase.from("users").update({ kyc_status: "pending", full_name: legalName || userRow.full_name }).eq("auth_user_id", user.id);

      return res.status(200).json({ submission: { ...updated, documentType, legalName } });
    }

    const { data, error } = await supabase
      .from("kyc_submissions")
      .insert({
        auth_user_id: user.id,
        wallet: userRow.wallet,
        document_type: documentType,
        legal_name: legalName || userRow.full_name,
        date_of_birth: dateOfBirth || null,
        country: country || null,
        address: address || null,
        front_path: frontPath,
        back_path: backPath,
        selfie_path: selfiePath,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        full_name: legalName || userRow.full_name,
        kyc_status: "pending",
      })
      .eq("auth_user_id", user.id);

    if (updateError) throw updateError;

    return res.status(200).json({
      submission: {
        ...data,
        documentType,
        legalName,
        dateOfBirth,
        country,
        address,
        frontPath,
        backPath,
        selfiePath,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error && "message" in error
          ? String((error as { message: unknown }).message)
          : "KYC submission failed";

    if (message.includes("kyc_submissions") && message.includes("does not exist")) {
      return res.status(500).json({
        error: "KYC table missing in Supabase. Run supabase/migrations/20260523170000_kyc_submissions_ledger.sql",
      });
    }

    const status = message.includes("session") || message.includes("token") || message.includes("bearer") ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
