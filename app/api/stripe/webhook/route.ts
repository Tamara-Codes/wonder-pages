import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  const raw = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const credits = Number(session.metadata?.credits);

    if (userId && Number.isFinite(credits) && credits > 0) {
      const admin = createAdminClient();
      // Idempotency: the payments row is keyed by the Stripe session id, so a
      // re-delivered webhook can't double-credit.
      const { error } = await admin.from("payments").insert({
        id: session.id,
        user_id: userId,
        credits,
        amount_total: session.amount_total,
      });
      if (!error) {
        await admin.rpc("increment_credits", { uid: userId, n: credits });
      }
    }
  }

  return NextResponse.json({ received: true });
}
