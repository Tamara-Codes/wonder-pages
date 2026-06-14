import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { priceCents, MIN_CREDITS, MAX_CREDITS } from "@/lib/pricing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const credits = Math.min(
    MAX_CREDITS,
    Math.max(MIN_CREDITS, Math.round(Number(body?.credits))),
  );
  if (!Number.isFinite(credits)) {
    return NextResponse.json({ error: "invalid_credits" }, { status: 400 });
  }

  // Must be a logged-in (non-anonymous) user to buy credits.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: priceCents(credits),
          product_data: {
            name: `${credits} Wonder Pages game${credits === 1 ? "" : "s"}`,
            description: "Credits to create more activity games",
          },
        },
      },
    ],
    metadata: { user_id: user.id, credits: String(credits) },
    success_url: `${origin}/?paid=1`,
    cancel_url: `${origin}/buy`,
  });

  return NextResponse.json({ url: session.url });
}
