import { ProfileAvatar } from "../ProfileAvatar";
import { WALLEX_CHARACTERS } from "../../constants/characters";

const quotes = [
  { name: "Alex M.", characterId: "golden-ape", text: "Wallex made sending USDT to friends instant. The $15 welcome bonus was a nice surprise." },
  { name: "Priya K.", characterId: "suit-ape", text: "Paystack top-up just works. I picked my avatar and was trading in minutes." },
  { name: "James O.", characterId: "bucket-ape", text: "Clean wallet, live prices, and KYC was straightforward. Best crypto app I've tried." },
  { name: "Sofia R.", characterId: "headphones-ape", text: "Scanning a friend's QR and swiping to pay feels like the future. Love the profile pictures." },
  { name: "Marcus T.", characterId: "halo-ape", text: "Swap between BTC and USDT with real rates. Admin support verified my KYC fast." },
  { name: "Elena V.", characterId: "mechanic-ape", text: "Finally a wallet that doesn't feel complicated. Sign up bonus landed right in my balance." },
];

function TestimonialCard({ name, characterId, text }: { name: string; characterId: string; text: string }) {
  const character = WALLEX_CHARACTERS.find((c) => c.id === characterId);
  return (
    <div className="flex-shrink-0 w-[300px] sm:w-[340px] rounded-2xl bg-white border border-sky-200/80 shadow-md p-5 mx-2">
      <div className="flex items-center gap-3 mb-3">
        <ProfileAvatar characterId={characterId} avatarUrl={character?.imageUrl} size={48} />
        <div>
          <p className="font-bold text-black text-sm">{name}</p>
          <p className="text-xs text-black/50">Wallex user</p>
        </div>
      </div>
      <p className="text-sm text-black/80 leading-relaxed">"{text}"</p>
    </div>
  );
}

export function TestimonialsMarquee() {
  const items = [...quotes, ...quotes];

  return (
    <section className="py-14 overflow-hidden bg-white/60 border-y border-sky-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-black text-center">What users say</h2>
        <p className="text-center text-black/60 mt-2 text-sm">Real Wallex wallet holders</p>
      </div>
      <div className="testimonial-marquee-mask">
        <div className="testimonial-marquee-track">
          {items.map((item, i) => (
            <TestimonialCard key={`${item.name}-${i}`} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
