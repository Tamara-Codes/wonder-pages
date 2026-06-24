/**
 * Transactional email for orders — a friendly customer confirmation + a
 * notification to Tamara so she can reply personally with payment details.
 *
 * Sent via Resend's REST API (no SDK dependency). Best-effort: if
 * RESEND_API_KEY is unset, sends are skipped and logged — an order must never
 * fail because email didn't go out. Set these env vars to turn it on:
 *   RESEND_API_KEY      — your Resend key
 *   ORDER_FROM_EMAIL    — verified sender, e.g. "Moja slova <hej@tvoja-domena.hr>"
 *                         (defaults to Resend's onboarding sender for testing)
 *   ORDER_NOTIFY_EMAIL  — where new-order notifications go (your inbox)
 *
 * No IBAN / predračun here by design: during validation Tamara arranges payment
 * by hand. This email just confirms the order landed.
 */

const FROM = process.env.ORDER_FROM_EMAIL || "Moja slova <onboarding@resend.dev>";

interface SendArgs {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] skipped (no RESEND_API_KEY):", subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html, reply_to: replyTo }),
    });
    if (!res.ok) {
      console.error("[email] send failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] error:", err);
    return false;
  }
}

// ── Order email content ───────────────────────────────────────────

export interface OrderEmailData {
  full_name: string;
  email: string;
  phone: string | null;
  street: string;
  city: string;
  postcode: string;
  delivery_method: "boxnow" | "posta" | null;
  quantity: number;
  product: string;
  child_name: string | null;
  child_surname: string | null;
  language: string | null;
  occasion: string | null;
  deadline: string | null;
  note: string | null;
  dedication: string | null;
  price_cents: number; // order total (unit × number of children)
  // one personalized set per child; falls back to the scalar child_* fields
  children?: { name: string; surname: string | null; gender: string | null; dedication: string | null }[];
}

const PRODUCT_NAME: Record<string, string> = {
  alphabet: "Personalizirana abeceda",
  numbers: "Moji prvi brojevi (personalizirano)",
  activity: "Knjižica aktivnosti",
  bundle: "Komplet (abeceda + brojevi)",
};

const DELIVERY_NAME: Record<string, string> = {
  boxnow: "BoxNow paketomat",
  posta: "Hrvatska pošta",
};

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

function priceEur(cents: number): string {
  return `${(cents / 100).toFixed(2)} €`;
}

/** Names of every child in the order (new multi-child shape, with fallback). */
function childNames(d: OrderEmailData): string[] {
  const kids = d.children?.length
    ? d.children.map((k) => [k.name, k.surname].filter(Boolean).join(" "))
    : [[d.child_name, d.child_surname].filter(Boolean).join(" ")];
  return kids.filter(Boolean);
}

function summaryRows(d: OrderEmailData): string {
  const product = PRODUCT_NAME[d.product] ?? d.product;
  const delivery = d.delivery_method ? DELIVERY_NAME[d.delivery_method] ?? d.delivery_method : "—";
  const names = childNames(d);
  const L = { product: "Proizvod", child: "Za dijete", children: "Za djecu", qty: "Broj kompleta", delivery: "Dostava", address: "Adresa", price: "Ukupno" };
  const rows: [string, string][] = [
    [L.product, product],
    ...(names.length ? [[names.length > 1 ? L.children : L.child, names.join(", ")] as [string, string]] : []),
    [L.qty, String(d.quantity)],
    [L.delivery, delivery],
    [L.address, `${d.street}, ${d.postcode} ${d.city}`],
    [L.price, priceEur(d.price_cents)],
  ];
  return rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b6b6b;">${esc(k)}</td><td style="padding:4px 0;font-weight:600;">${esc(v)}</td></tr>`,
    )
    .join("");
}

/** Friendly confirmation to the buyer. No payment details — those come by hand. */
export function buildCustomerEmail(d: OrderEmailData): { subject: string; html: string } {
  const names = childNames(d);
  const who = names.length ? names.join(", ") : "vaše dijete";
  const subject = "Potvrda narudžbe — Moja slova";
  const forWhom =
    d.product === "bundle"
      ? "oba kompleta (abeceda + brojevi) za"
      : d.product === "numbers"
        ? "personalizirane brojeve za"
        : names.length > 1 ? "personalizirane abecede za" : "personaliziranu abecedu za";
  const intro = `Hvala na narudžbi! Zaprimili smo tvoju narudžbu za ${forWhom} <strong>${esc(who)}</strong>.`;
  const next =
    "Javit ću ti se uskoro osobno s detaljima za plaćanje (uplata na račun) i dostavu. Ako imaš pitanja, samo odgovori na ovaj e-mail.";

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#2b2b2b;line-height:1.55;">
    <p>Pozdrav ${esc(d.full_name.split(" ")[0] || d.full_name)},</p>
    <p>${intro}</p>
    <h3 style="margin:24px 0 8px;font-size:15px;">Sažetak narudžbe</h3>
    <table style="border-collapse:collapse;font-size:14px;">${summaryRows(d)}</table>
    <p style="margin-top:24px;">${next}</p>
    <p style="margin-top:24px;">Srdačno,<br>Tamara · Moja slova</p>
  </div>`;
  return { subject, html };
}

/** Heads-up to Tamara so she can act on the order. */
export function buildOwnerEmail(d: OrderEmailData): { subject: string; html: string } {
  const subject = `🎉 Nova narudžba — ${d.full_name}`;
  const extra: [string, string | null][] = [
    ["E-mail", d.email],
    ["Telefon", d.phone],
    ["Jezik", d.language],
    ["Prigoda", d.occasion],
    ["Rok", d.deadline],
    ["Napomena", d.note],
  ];
  const extraRows = extra
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b6b6b;">${esc(k)}</td><td style="padding:4px 0;font-weight:600;">${esc(String(v))}</td></tr>`,
    )
    .join("");

  // Per-child detail — each child is one set to make (name · gender · dedication).
  const kids = d.children?.length
    ? d.children
    : [{ name: d.child_name ?? "", surname: d.child_surname, gender: null, dedication: d.dedication }];
  const G: Record<string, string> = { boy: "dječak", girl: "djevojčica" };
  const childBlocks = kids
    .filter((k) => k.name || k.dedication)
    .map((k, i) => {
      const name = [k.name, k.surname].filter(Boolean).join(" ");
      const meta = [k.gender ? G[k.gender] ?? k.gender : null].filter(Boolean).join(" · ");
      return `<div style="margin-top:10px;padding:10px 12px;background:#f7f5fb;border-radius:8px;">
        <div style="font-weight:700;">Komplet ${i + 1}: ${esc(name)}${meta ? ` <span style="color:#6b6b6b;font-weight:400;">(${esc(meta)})</span>` : ""}</div>
        ${k.dedication ? `<div style="margin-top:4px;color:#6b6b6b;font-size:13px;white-space:pre-wrap;">${esc(k.dedication)}</div>` : ""}
      </div>`;
    })
    .join("");

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;color:#2b2b2b;line-height:1.55;">
    <p style="font-size:16px;font-weight:700;">Nova narudžba od ${esc(d.full_name)}</p>
    <table style="border-collapse:collapse;font-size:14px;">${summaryRows(d)}${extraRows}</table>
    ${childBlocks ? `<h3 style="margin:20px 0 4px;font-size:14px;">Personalizacija po djetetu</h3>${childBlocks}` : ""}
    <p style="margin-top:20px;color:#6b6b6b;font-size:13px;">Odgovori kupcu na: <a href="mailto:${esc(d.email)}">${esc(d.email)}</a></p>
  </div>`;
  return { subject, html };
}
