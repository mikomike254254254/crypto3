const MPESA_LOGO = "https://i.postimg.cc/G3Bp6F8z/mpepe-removebg-preview.png";

export function MpesaBanner() {
  return (
    <section className="w-full bg-black py-10 md:py-12 overflow-hidden" aria-labelledby="mpesa-heading">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="mpesa-pop shrink-0 flex items-center justify-center w-40 h-40 md:w-48 md:h-48">
          <img
            src={MPESA_LOGO}
            alt="M-PESA"
            className="w-full h-full object-contain drop-shadow-[0_8px_24px_rgba(0,163,81,0.35)]"
            loading="lazy"
          />
        </div>
        <div className="text-center md:text-left max-w-xl">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">New · Kenya</p>
          <h2 id="mpesa-heading" className="text-2xl md:text-3xl font-bold text-white leading-tight">
            Send &amp; receive crypto via M-PESA
          </h2>
          <p className="mt-3 text-neutral-400 text-sm md:text-base leading-relaxed">
            Top up your Wallex wallet from your phone, or cash out to M-PESA in minutes. Fast KES rails built for how you already pay.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Available on Wallex wallet
          </p>
        </div>
      </div>
    </section>
  );
}
