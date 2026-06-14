import Stripe from "stripe";

// Server-only Stripe client. Uses the account's default API version.
let stripe: Stripe | null = null;
export function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripe;
}
