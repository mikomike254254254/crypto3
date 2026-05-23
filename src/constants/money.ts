/** KES per 1 USDT — match P2P_KES_PER_USDT on Vercel */
export const KES_PER_USDT = Number(
  import.meta.env.VITE_KES_PER_USDT || import.meta.env.VITE_P2P_KES_PER_USDT || "129.5",
);

export function kesToUsd(kes: number) {
  if (!Number.isFinite(kes) || kes <= 0) return 0;
  return kes / KES_PER_USDT;
}
