import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRODUCT_PRICE_CENTS, isProductId, type ProductId } from "@/lib/products";
import { sendEmail, buildCustomerEmail, buildOwnerEmail, type OrderEmailData } from "@/lib/email";

export const runtime = "nodejs";

// A manual order request — the Croatia validation MVP. No payment is taken
// here: we store the order (buyer + delivery + gift personalization) and
// follow up by hand with payment + delivery details. Written with the
// service-role key, so anonymous visitors work and the table stays closed.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_CHILDREN = 20; // server-side cap on sets per order (UI caps lower)

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // ── Required: buyer + a delivery address ──
  const full_name = str(body.full_name, 120);
  const email = str(body.email, 200).toLowerCase();
  const street = str(body.street, 200);
  const city = str(body.city, 120);
  const postcode = str(body.postcode, 20);

  const errors: Record<string, string> = {};
  if (full_name.length < 2) errors.full_name = "required";
  if (!EMAIL_RE.test(email)) errors.email = "invalid";
  if (street.length < 3) errors.street = "required";
  if (city.length < 2) errors.city = "required";
  if (postcode.length < 3) errors.postcode = "required";
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "validation", fields: errors }, { status: 400 });
  }

  // ── Optional / defaulted (shared across the order) ──
  const product: ProductId = isProductId(body.product) ? body.product : "alphabet";
  const language = body.language === "en" || body.language === "hr" ? body.language : null;
  const delivery_method =
    body.delivery_method === "boxnow" || body.delivery_method === "posta"
      ? body.delivery_method
      : null;
  const locale = "hr";

  const deadlineRaw = str(body.deadline, 10);
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(deadlineRaw) ? deadlineRaw : null;

  // ── Children — one personalized set each. Accept the new `children` array;
  // fall back to the legacy single-child fields. ──
  type IncomingChild = { name?: unknown; surname?: unknown; gender?: unknown; dedication?: unknown; age?: unknown; theme?: unknown };
  const incoming: IncomingChild[] =
    Array.isArray(body.children) && body.children.length
      ? body.children
      : [{ name: body.child_name, surname: body.child_surname, gender: body.child_gender, dedication: body.dedication, age: body.child_age, theme: body.theme }];

  const ageOf = (v: unknown) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 3 && n <= 8 ? n : null;
  };
  const normKids = incoming.map((k) => ({
    child_name: str(k.name, 80) || null,
    child_surname: str(k.surname, 80) || null,
    child_gender: k.gender === "boy" || k.gender === "girl" ? k.gender : null,
    dedication: str(k.dedication, 220) || null,
    child_age: ageOf(k.age),
    theme: str(k.theme, 40) || null,
  }));
  const named = normKids.filter((k) => k.child_name && k.child_name.length >= 2);
  const kids = (named.length ? named : normKids).slice(0, MAX_CHILDREN);

  const unit = PRODUCT_PRICE_CENTS[product];
  const order_group = crypto.randomUUID();

  const shared = {
    full_name,
    email,
    phone: str(body.phone, 40) || null,
    street,
    city,
    postcode,
    country: str(body.country, 2).toUpperCase() || "HR",
    delivery_method,
    product,
    language,
    occasion: str(body.occasion, 60) || null,
    deadline,
    note: str(body.note, 1000) || null,
    currency: "eur",
    locale,
    source: str(body.source, 60) || null,
    order_group,
  };

  // One row per child = one set to print; rows share buyer/delivery + order_group.
  const rows = kids.map((k) => ({ ...shared, ...k, quantity: 1, price_cents: unit }));

  const admin = createAdminClient();
  const { error } = await admin.from("order_requests").insert(rows);

  if (error) {
    console.error("order insert failed:", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  // Fire the confirmation + notification emails — best-effort, never block the
  // order on email. A missing RESEND_API_KEY simply no-ops (logged in sendEmail).
  const emailData: OrderEmailData = {
    ...shared,
    delivery_method,
    quantity: kids.length,
    price_cents: unit * kids.length,
    child_name: kids[0]?.child_name ?? null,
    child_surname: kids[0]?.child_surname ?? null,
    dedication: kids[0]?.dedication ?? null,
    children: kids.map((k) => ({
      name: k.child_name ?? "",
      surname: k.child_surname,
      gender: k.child_gender,
      dedication: k.dedication,
    })),
  };
  const notifyTo = process.env.ORDER_NOTIFY_EMAIL;
  try {
    const customer = buildCustomerEmail(emailData);
    const sends: Promise<boolean>[] = [
      sendEmail({ to: email, subject: customer.subject, html: customer.html, replyTo: notifyTo }),
    ];
    if (notifyTo) {
      const owner = buildOwnerEmail(emailData);
      sends.push(sendEmail({ to: notifyTo, subject: owner.subject, html: owner.html, replyTo: email }));
    }
    await Promise.allSettled(sends);
  } catch (err) {
    console.error("order emails failed (order still saved):", err);
  }

  return NextResponse.json({ ok: true });
}
