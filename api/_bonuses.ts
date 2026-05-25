import { adminClient, createNotification, readTokenBalances, upsertBalance } from "./_supabase.js";

export const GAS_FEE_BONUS_NOTE = "Gas fee credit — welcome bonus";
export const KYC_PENDING_BONUS_NOTE = "KYC verification bonus — pending";
export const KYC_RELEASED_BONUS_NOTE = "KYC verification bonus — released";

const BONUS_USD = 15;
const BONUS_TOKEN = "USDT";

export async function awardSignupBonuses(userRow: {
  id: string;
  wallet: string;
  auth_user_id?: string | null;
  signup_bonus_awarded?: boolean;
}) {
  if (userRow.signup_bonus_awarded) return;

  const supabase = adminClient();

  const { data: existingGas } = await supabase
    .from("transactions")
    .select("id")
    .eq("to_wallet", userRow.wallet)
    .eq("note", GAS_FEE_BONUS_NOTE)
    .maybeSingle();

  if (!existingGas) {
    const { error: gasError } = await supabase.from("transactions").insert({
      from_wallet: "system",
      to_wallet: userRow.wallet,
      amount: BONUS_USD,
      token: BONUS_TOKEN,
      type: "bonus",
      status: "completed",
      note: GAS_FEE_BONUS_NOTE,
    });
    if (gasError) throw gasError;

    const { data: existingKyc } = await supabase
      .from("transactions")
      .select("id")
      .eq("to_wallet", userRow.wallet)
      .eq("note", KYC_PENDING_BONUS_NOTE)
      .maybeSingle();

    if (!existingKyc) {
      const { error: kycError } = await supabase.from("transactions").insert({
        from_wallet: "system",
        to_wallet: userRow.wallet,
        amount: BONUS_USD,
        token: BONUS_TOKEN,
        type: "bonus",
        status: "pending",
        note: KYC_PENDING_BONUS_NOTE,
      });
      if (kycError) throw kycError;
    }
  }

  await supabase.from("users").update({ signup_bonus_awarded: true }).eq("id", userRow.id);

  const balances = await readTokenBalances(userRow.wallet);
  await upsertBalance(userRow.wallet, Number((balances.get(BONUS_TOKEN) || 0).toFixed(8)));

  if (userRow.auth_user_id) {
    await createNotification(userRow.auth_user_id, {
      type: "receive",
      title: "🎉 Welcome to Wallex!",
      body: `As a welcome bonus, $${BONUS_USD} ${BONUS_TOKEN} has already been credited to your Wallex account. Complete your KYC verification to receive an additional $${BONUS_USD} reward.\n\nWith Wallex, you can easily receive crypto, store it securely, and withdraw directly to M-PESA for Kenyan users. Our platform is built to be simple, transparent, secure, and fast for everyday use.\n\nTo finish setting up your account and access all features, please continue to your wallet dashboard.\n\nIf you need any help, feel free to contact our support team anytime at: wallexsupport@proton.me\n\nThank you for choosing Wallex.`,
      amount: BONUS_USD,
      token: BONUS_TOKEN,
      fromWallet: "system",
    });
  }
}

export async function releaseKycPendingBonus(userRow: {
  wallet: string;
  auth_user_id?: string | null;
  full_name?: string | null;
}) {
  const supabase = adminClient();

  const { data: pending, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("to_wallet", userRow.wallet)
    .eq("note", KYC_PENDING_BONUS_NOTE)
    .eq("status", "pending")
    .maybeSingle();

  if (error) throw error;
  if (!pending) return;

  const { error: updateError } = await supabase
    .from("transactions")
    .update({ status: "completed", note: KYC_RELEASED_BONUS_NOTE })
    .eq("id", pending.id);

  if (updateError) throw updateError;

  const balances = await readTokenBalances(userRow.wallet);
  await upsertBalance(userRow.wallet, Number((balances.get(BONUS_TOKEN) || 0).toFixed(8)));

  if (userRow.auth_user_id) {
    await createNotification(userRow.auth_user_id, {
      type: "receive",
      title: "KYC bonus unlocked",
      body: `$${BONUS_USD} ${BONUS_TOKEN} has been added to your wallet.`,
      amount: BONUS_USD,
      token: BONUS_TOKEN,
      fromWallet: "system",
    });
  }
}
