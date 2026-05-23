import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What is the $15 signup bonus?",
    a: "New accounts receive $15 USDT as a gas fee welcome credit you can use right away, plus another $15 USDT held as pending until you complete KYC verification.",
  },
  {
    q: "How does KYC verification work?",
    a: "Upload your ID front and back plus a selfie in the wallet. Our team reviews submissions in the admin panel. Once approved, your pending $15 bonus is released and you can send or sell crypto.",
  },
  {
    q: "Do I need KYC to buy or receive crypto?",
    a: "No. Paystack top-ups and receiving transfers work without KYC. Verification is required before you send or withdraw to external addresses.",
  },
  {
    q: "How do I top up with Paystack?",
    a: "Open Receive, choose which wallet to credit (USDT, BTC, ETH, or XRP), enter a USD amount, and pay with card or bank via Paystack. We credit the live crypto equivalent after payment confirms.",
  },
  {
    q: "Can I send crypto by scanning a QR code?",
    a: "Yes. Scan a Wallex pay link or wallet QR to open the pay screen, see the recipient's profile, enter an amount, and swipe to confirm the transfer.",
  },
  {
    q: "Is Wallex safe to use?",
    a: "Sign-in is secured with Supabase. Balances and transfers are stored on our ledger. Never share your password or OTP codes with anyone.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 md:px-6 py-16">
      <h2 className="text-3xl font-bold text-black text-center">FAQ</h2>
      <p className="text-center text-black/60 mt-2 mb-8 text-sm">Common questions about Wallex</p>
      <div className="space-y-3">
        {faqs.map((item, index) => {
          const isOpen = open === index;
          return (
            <div key={item.q} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                className="w-full flex items-center justify-between gap-4 p-4 text-left"
              >
                <span className="font-semibold text-black text-sm">{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 text-sm text-black/70 leading-relaxed border-t border-slate-100 pt-3">
                  {item.a}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
