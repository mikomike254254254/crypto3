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

async function uploadImage(userId: string, name: string, dataUrl?: string) {
  if (!dataUrl) return null;

  const supabase = adminClient();
  const { buffer, contentType } = dataUrlToBuffer(dataUrl);
  const path = `${userId}/${Date.now()}-${name}.jpg`;

  await supabase.storage.createBucket("kyc-documents", { public: false }).catch(() => undefined);

  const { error } = await supabase.storage
    .from("kyc-documents")
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw error;
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

    const folder = userRow.wallet || user.id;
    const [frontPath, backPath, selfiePath] = await Promise.all([
      uploadImage(folder, "front", frontImage),
      uploadImage(folder, "back", backImage),
      uploadImage(folder, "selfie", selfieImage),
    ]);

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
    const message = error instanceof Error ? error.message : "KYC submission failed";
    const status = message.includes("session") || message.includes("token") || message.includes("bearer") ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
