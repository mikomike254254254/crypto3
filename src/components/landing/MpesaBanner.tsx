export function MpesaBanner() {
  return (
    <section className="w-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 py-16 md:py-20 overflow-hidden relative" aria-labelledby="mpesa-heading">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.3'%3E%3Cpath d='M0 30h60M30 0v60'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: "60px 60px"
      }} />
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center gap-10 md:gap-16 relative z-10">
        <div className="shrink-0 flex items-center justify-center w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.12)] p-4">
          <img
            src="https://i.postimg.cc/G3Bp6F8z/mpepe-removebg-preview.png"
            alt="M-PESA"
            className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            loading="lazy"
          />
        </div>
        <div className="text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-300">Kenya · Available now</span>
          </div>
          <h2 id="mpesa-heading" className="text-2xl md:text-3xl font-bold text-white leading-tight">
            Deposit & withdraw via M-PESA
          </h2>
          <p className="mt-3 text-neutral-400 text-sm md:text-base leading-relaxed max-w-lg">
            Top up your Wallex wallet from your phone, or cash out to M-PESA in minutes. Fast KES rails built for how Kenya moves money.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-xs text-neutral-500 font-medium bg-neutral-800/60 px-3 py-1.5 rounded-lg border border-neutral-700/50">KES → USDT</span>
            <span className="text-xs text-neutral-500 font-medium bg-neutral-800/60 px-3 py-1.5 rounded-lg border border-neutral-700/50">Instant settlement</span>
            <span className="text-xs text-neutral-500 font-medium bg-neutral-800/60 px-3 py-1.5 rounded-lg border border-neutral-700/50">No hidden fees</span>
          </div>
        </div>
      </div>
    </section>
  );
}