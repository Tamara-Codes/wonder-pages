import Link from "next/link";
import { Gift } from "@/components/icons";

/** One product card: name + price + what's inside + an order CTA, in the
 * product's accent colour. Used on the landing page and the /products chooser. */
export function ProductCard({
  price,
  contents,
  href,
  cta,
  accent,
  accentDark,
}: {
  price: string;
  contents: string[];
  href: string;
  cta: string;
  accent: string;
  accentDark: string;
}) {
  return (
    <div className="grid sm:grid-cols-2 rounded-3xl shadow-pop overflow-hidden">
      {/* Left — white: what's inside */}
      <div className="bg-card p-8 sm:p-9 flex flex-col justify-center">
        <ul className="space-y-3.5">
          {contents.map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-[15px] font-semibold text-foreground">
              <span className="mt-0.5 shrink-0 font-extrabold" style={{ color: accentDark }} aria-hidden>✓</span>{line}
            </li>
          ))}
        </ul>
      </div>
      {/* Right — accent: price + order button */}
      <div className="flex flex-col items-center justify-center gap-5 p-8 sm:p-9 text-center" style={{ background: accent }}>
        <p className="font-display font-extrabold leading-none text-white text-5xl">{price}</p>
        <Link
          href={href}
          className="btn-glow font-display text-xl font-extrabold rounded-full w-full bg-white px-6 py-4 inline-flex items-center justify-center gap-2.5"
          style={{ color: accentDark }}
        >
          <Gift size={22} /> {cta}
        </Link>
      </div>
    </div>
  );
}
