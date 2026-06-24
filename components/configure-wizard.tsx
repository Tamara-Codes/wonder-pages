"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Sparkle } from "@/components/icons";
import { THEMES } from "@/lib/themes";
import { PRODUCTS, PRODUCT_PRICE_CENTS, priceLabelCents, type ProductId } from "@/lib/products";
import type { Copy } from "@/lib/landing-copy";

type PreviewPage = { labelKey: string } & (
  | { kind: "img"; src: string }
  | { kind: "html"; html: string }
);

// One personalized set per child — the order can hold several (one set each,
// different names). These are the per-child personalization fields; which ones
// are shown depends on the product (alphabet → gender + dedication).
type Child = { name: string; gender: "girl" | "boy" | ""; posveta: string; theme: string; age: string };
const blankChild = (): Child => ({ name: "", gender: "", posveta: "", theme: "", age: "5" });
const MAX_CHILDREN = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSVETA_MAX = 220; // dedication char cap — keeps the leaf legible
const inputCls =
  "w-full rounded-2xl border border-border bg-card py-3 px-4 font-semibold text-foreground shadow-pop-sm outline-none focus:border-teal";
const labelCls = "font-display text-sm font-bold text-foreground mb-1.5 block";

/**
 * The configure → preview → order wizard. The customer personalizes a chosen
 * product, sees a live (free, code-rendered) preview of representative pages,
 * then places a manual order (no online payment). One component drives all
 * three products; PRODUCTS[product].needs decides which options to ask for.
 */
export function ConfigureWizard({
  product,
  copy,
}: {
  product: ProductId;
  copy: Copy;
}) {
  const w = copy.wizard;
  const t = copy.form;
  const cfg = PRODUCTS[product];
  const [step, setStep] = useState(0);

  // personalization — one set per child (the order can hold several).
  const [children, setChildren] = useState<Child[]>([blankChild()]);

  // The keepsake products (alphabet, numbers) add a gender + a free-written
  // dedication (the posveta leaf) + a gendered diploma. The activity book
  // doesn't. Both keepsakes are Croatian.
  const isNumbers = product === "numbers";
  const hasAlphabet = cfg.includes.includes("alphabet");
  const isKeepsake = hasAlphabet || isNumbers;

  // preview
  const [preview, setPreview] = useState<PreviewPage[] | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);

  // order (buyer + delivery)
  const [order, setOrder] = useState({
    full_name: "", email: "", phone: "", street: "", city: "", postcode: "",
    occasion: "", deadline: "", note: "",
  });
  const [deliveryMethod, setDeliveryMethod] = useState<"boxnow" | "posta" | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<"idle" | "busy" | "error">("idle");
  const [done, setDone] = useState(false);

  function setO(k: keyof typeof order, v: string) {
    setOrder((o) => ({ ...o, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
    if (submitState === "error") setSubmitState("idle");
  }

  function updateChild(i: number, patch: Partial<Child>) {
    setChildren((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addChild() {
    setChildren((cs) => (cs.length < MAX_CHILDREN ? [...cs, blankChild()] : cs));
  }
  function removeChild(i: number) {
    setChildren((cs) => (cs.length > 1 ? cs.filter((_, idx) => idx !== i) : cs));
  }

  const childValid = (ch: Child) =>
    ch.name.trim().length >= 2 &&
    (!cfg.needs.theme || ch.theme !== "") &&
    (!isKeepsake || ch.gender !== "");
  const canContinue = children.every(childValid);

  const first = children[0];
  const totalCents = PRODUCT_PRICE_CENTS[product] * children.length;

  const loadPreview = useCallback(async () => {
    setPreviewBusy(true);
    try {
      const dedication = "Ova knjižica pripada {name}";
      const alphabetByline = "s ljubavlju, {name}";
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          childName: first.name,
          gender: isKeepsake && first.gender ? first.gender : undefined,
          theme: cfg.needs.theme ? first.theme : undefined,
          age: cfg.needs.age ? Number(first.age) : undefined,
          language: cfg.needs.language ? "hr" : undefined,
          coverActivity: first.name ? `${first.name} · ${copy.products.cards.activity.name}` : copy.products.cards.activity.name,
          coverAlphabet: "moja prva abeceda",
          coverNumbers: "moji brojevi",
          dedication,
          alphabetByline,
          // keepsake leaves (posveta · name · diploma) — number variants when numbers
          posveta: first.posveta.trim() || (isNumbers ? w.posvetaSampleNumbers : w.posvetaSample),
          nameLeafLabel: w.nameLeafLabel,
          diplomaTitle: w.diplomaTitle,
          diplomaIntro: w.diplomaIntro,
          diplomaBody: isNumbers
            ? (first.gender === "boy" ? w.diplomaBodyNumbersBoy : w.diplomaBodyNumbersGirl)
            : (first.gender === "boy" ? w.diplomaBodyBoy : w.diplomaBodyGirl),
        }),
      });
      const data = await res.json();
      setPreview(res.ok ? data.pages : []);
    } catch {
      setPreview([]);
    } finally {
      setPreviewBusy(false);
    }
  }, [product, first, hasAlphabet, w, cfg, copy]);

  // (Re)build the preview whenever we land on the preview step.
  useEffect(() => {
    if (step === 1) loadPreview();
  }, [step, loadPreview]);

  function validateOrder(): boolean {
    const e: Record<string, string> = {};
    if (order.full_name.trim().length < 2) e.full_name = t.errorFullName;
    if (!EMAIL_RE.test(order.email.trim())) e.email = t.errorEmail;
    if (order.street.trim().length < 3) e.street = t.errorStreet;
    if (order.city.trim().length < 2) e.city = t.errorCity;
    if (order.postcode.trim().length < 3) e.postcode = t.errorPostcode;
    if (deliveryMethod === "") e.delivery_method = t.errorDelivery;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (submitState === "busy") return;
    if (!validateOrder()) return;
    setSubmitState("busy");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...order,
          delivery_method: deliveryMethod,
          product,
          // one personalized set per child
          children: children.map((ch) => ({
            name: ch.name,
            surname: "",
            gender: isKeepsake ? ch.gender : "",
            dedication: isKeepsake ? ch.posveta : "",
            age: cfg.needs.age ? ch.age : "",
            theme: cfg.needs.theme ? ch.theme : "",
          })),
          language: cfg.needs.language ? "hr" : "",
          country: "HR",
          locale: "hr",
          source: `wizard:${product}`,
        }),
      });
      if (res.ok) setDone(true);
      else setSubmitState("error");
    } catch {
      setSubmitState("error");
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl bg-card shadow-pop p-8 text-center">
        <div className="tile h-16 w-16 mx-auto" style={{ background: "var(--teal)" }} aria-hidden>
          <Gift size={32} />
        </div>
        <h3 className="font-display text-2xl font-extrabold mt-4">{t.successTitle}</h3>
        <p className="text-muted font-semibold mt-2 max-w-[46ch] mx-auto leading-snug">{t.successBody}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stepper */}
      <ol className="flex items-center justify-center gap-2 sm:gap-4 mb-7">
        {w.steps.map((label, i) => (
          <li key={label} className="flex items-center gap-2 sm:gap-4">
            <span className={`flex items-center gap-2 font-display font-bold text-sm ${i === step ? "text-foreground" : "text-muted"}`}>
              <span
                className="grid h-7 w-7 place-items-center rounded-full text-white text-xs font-extrabold"
                style={{ background: i <= step ? "var(--teal)" : "var(--muted)" }}
              >
                {i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </span>
            {i < w.steps.length - 1 && <span className="h-0.5 w-5 sm:w-10 rounded bg-border" aria-hidden />}
          </li>
        ))}
      </ol>

      {/* ── Step 1: personalize ── */}
      {step === 0 && (
        <div className="rounded-3xl bg-card shadow-pop p-6 sm:p-8 max-w-xl mx-auto">
          <h2 className="font-display text-2xl font-extrabold">{w.personalizeHeading}</h2>
          <p className="text-muted font-semibold text-sm mt-1">{w.multiChildHint}</p>

          <div className="mt-6 space-y-5">
            {children.map((ch, i) => (
              <div key={i} className="rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display font-extrabold text-sm" style={{ color: "var(--teal-d)" }}>
                    {w.childLabel} {i + 1}
                  </span>
                  {children.length > 1 && (
                    <button type="button" onClick={() => removeChild(i)} className="font-display text-xs font-bold text-muted hover:text-pink transition">
                      {w.removeChild}
                    </button>
                  )}
                </div>

                <div className="grid gap-4">
                  <label className="block">
                    <span className={labelCls}>{w.childName}</span>
                    <input type="text" value={ch.name} onChange={(e) => updateChild(i, { name: e.target.value })} placeholder={w.namePlaceholder} className={inputCls} />
                  </label>

                  {cfg.needs.age && (
                    <label className="block">
                      <span className={labelCls}>{w.childAge}</span>
                      <select value={ch.age} onChange={(e) => updateChild(i, { age: e.target.value })} className={inputCls}>
                        {[3, 4, 5, 6, 7, 8].map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </label>
                  )}

                  {cfg.needs.theme && (
                    <label className="block">
                      <span className={labelCls}>{w.theme}</span>
                      <select value={ch.theme} onChange={(e) => updateChild(i, { theme: e.target.value })} className={inputCls}>
                        <option value="">{w.themePick}</option>
                        {THEMES.map((th) => <option key={th.id} value={th.id}>{th.emoji} {th.name}</option>)}
                      </select>
                    </label>
                  )}

                  {isKeepsake && (
                    <>
                      <div className="block">
                        <span className={labelCls}>{w.gender}</span>
                        <div className="grid grid-cols-2 gap-3">
                          {([["girl", w.genderGirl], ["boy", w.genderBoy]] as const).map(([val, lbl]) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => updateChild(i, { gender: val })}
                              aria-pressed={ch.gender === val}
                              className={`rounded-2xl border-2 py-3 px-4 font-display font-bold shadow-pop-sm transition ${ch.gender === val ? "border-teal text-white" : "border-border bg-card text-foreground"}`}
                              style={ch.gender === val ? { background: "var(--teal)" } : undefined}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="block">
                        <span className={labelCls}>{w.posvetaLabel}</span>
                        <textarea
                          rows={5}
                          value={ch.posveta}
                          onChange={(e) => updateChild(i, { posveta: e.target.value.slice(0, POSVETA_MAX) })}
                          placeholder={w.posvetaPlaceholder}
                          maxLength={POSVETA_MAX}
                          className={`${inputCls} resize-none leading-snug`}
                        />
                        <span className="mt-1 flex items-center justify-end font-display text-xs font-semibold text-muted">
                          <span className={ch.posveta.length >= POSVETA_MAX ? "text-pink" : ""}>{ch.posveta.length}/{POSVETA_MAX}</span>
                        </span>
                      </label>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {children.length < MAX_CHILDREN && (
            <button
              type="button"
              onClick={addChild}
              className="mt-4 w-full rounded-2xl border-2 border-dashed border-border py-3 font-display font-bold transition hover:border-teal inline-flex items-center justify-center gap-2"
              style={{ color: "var(--teal-d)" }}
            >
              <Sparkle size={16} /> {w.addChild}
            </button>
          )}

          <div className="mt-7 flex justify-end">
            <button
              onClick={() => setStep(1)}
              disabled={!canContinue}
              className="btn-glow font-display text-lg font-extrabold text-white rounded-full px-8 py-3.5 inline-flex items-center gap-2 disabled:opacity-50"
              style={{ background: "var(--teal)" }}
            >
              {w.next} <Sparkle size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: preview ── */}
      {step === 1 && (
        <div>
          <div className="text-center mb-5">
            <h2 className="font-display text-2xl font-extrabold">{w.previewHeading}</h2>
          </div>

          {previewBusy && (
            <p className="text-center font-display font-bold text-muted py-12">{w.previewLoading}</p>
          )}

          {!previewBusy && preview && (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {preview.map((p, i) => (
                <li key={i} className="rounded-2xl bg-card shadow-pop-sm overflow-hidden">
                  <div className="bg-white">
                    {p.kind === "img" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.src} alt={w.pageLabels[p.labelKey] ?? p.labelKey} className="w-full block" />
                    ) : (
                      <div className="[&>*]:!shadow-none [&>*]:!rounded-none" dangerouslySetInnerHTML={{ __html: p.html }} />
                    )}
                  </div>
                  <p className="px-3 py-2 font-display font-bold text-xs text-muted">
                    {w.pageLabels[p.labelKey] ?? p.labelKey}
                  </p>
                </li>
              ))}
            </ul>
          )}


          <div className="mt-7 flex items-center justify-between">
            <button onClick={() => setStep(0)} className="font-display font-bold text-muted rounded-full px-6 py-3 border-2 border-border">
              {w.back}
            </button>
            <button
              onClick={() => setStep(2)}
              className="btn-glow font-display text-lg font-extrabold text-white rounded-full px-8 py-3.5 inline-flex items-center gap-2"
              style={{ background: "var(--teal)" }}
            >
              {w.next} <Gift size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: order ── */}
      {step === 2 && (
        <form onSubmit={submit} noValidate className="rounded-3xl bg-card shadow-pop p-6 sm:p-8 max-w-xl mx-auto">
          <h2 className="font-display text-2xl font-extrabold">{w.orderHeading}</h2>

          {/* order summary — one set per child */}
          <div className="mt-4 rounded-2xl bg-[rgba(33,199,182,0.08)] px-4 py-3">
            <ul className="divide-y divide-border/60">
              {children.map((ch, i) => (
                <li key={i} className="flex items-center justify-between py-2 font-display font-bold text-foreground">
                  <span>{copy.products.cards[product].name} · {w.summaryFor.replace("{name}", ch.name.trim() || `${w.childLabel} ${i + 1}`)}</span>
                  <span className="text-teal shrink-0 ml-3">{priceLabelCents(PRODUCT_PRICE_CENTS[product])}</span>
                </li>
              ))}
            </ul>
            {children.length > 1 && (
              <p className="flex items-center justify-between border-t-2 border-border pt-2.5 mt-1 font-display font-extrabold text-foreground">
                <span>{w.total}</span>
                <span className="text-teal">{priceLabelCents(totalCents)}</span>
              </p>
            )}
          </div>

          <p className="rounded-2xl bg-card px-1 py-3 font-display text-sm font-semibold text-muted">
            {t.payInfo}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelCls}>{t.fullName}</span>
              <input type="text" autoComplete="name" value={order.full_name} onChange={(e) => setO("full_name", e.target.value)} className={inputCls} />
              {errors.full_name && <Err msg={errors.full_name} />}
            </label>
            <label className="block">
              <span className={labelCls}>{t.email}</span>
              <input type="email" autoComplete="email" value={order.email} onChange={(e) => setO("email", e.target.value)} className={inputCls} />
              {errors.email && <Err msg={errors.email} />}
            </label>
            <label className="block">
              <span className={labelCls}>{t.phone}</span>
              <input type="tel" autoComplete="tel" value={order.phone} onChange={(e) => setO("phone", e.target.value)} className={inputCls} />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>{t.street}</span>
              <input type="text" autoComplete="street-address" value={order.street} onChange={(e) => setO("street", e.target.value)} className={inputCls} />
              {errors.street && <Err msg={errors.street} />}
            </label>
            <label className="block">
              <span className={labelCls}>{t.city}</span>
              <input type="text" autoComplete="address-level2" value={order.city} onChange={(e) => setO("city", e.target.value)} className={inputCls} />
              {errors.city && <Err msg={errors.city} />}
            </label>
            <label className="block">
              <span className={labelCls}>{t.postcode}</span>
              <input type="text" inputMode="numeric" autoComplete="postal-code" value={order.postcode} onChange={(e) => setO("postcode", e.target.value)} className={inputCls} />
              {errors.postcode && <Err msg={errors.postcode} />}
            </label>
            <div className="block sm:col-span-2">
              <span className={labelCls}>{t.deliveryMethodLabel}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([["boxnow", t.deliveryBoxnow, t.deliveryBoxnowDesc], ["posta", t.deliveryPosta, t.deliveryPostaDesc]] as const).map(([val, lbl, desc]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setDeliveryMethod(val);
                      if (errors.delivery_method) setErrors((e) => ({ ...e, delivery_method: "" }));
                      if (submitState === "error") setSubmitState("idle");
                    }}
                    aria-pressed={deliveryMethod === val}
                    className={`text-left rounded-2xl border-2 py-3 px-4 shadow-pop-sm transition ${deliveryMethod === val ? "border-teal text-white" : "border-border bg-card text-foreground"}`}
                    style={deliveryMethod === val ? { background: "var(--teal)" } : undefined}
                  >
                    <span className="font-display font-bold block">{lbl}</span>
                    <span className={`text-xs font-semibold ${deliveryMethod === val ? "text-white/85" : "text-muted"}`}>{desc}</span>
                  </button>
                ))}
              </div>
              {errors.delivery_method && <Err msg={errors.delivery_method} />}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setStep(1)} className="font-display font-bold text-muted rounded-full px-6 py-3.5 border-2 border-border shrink-0">
              {w.back}
            </button>
            <button
              type="submit"
              disabled={submitState === "busy"}
              className="btn-glow font-display text-lg font-extrabold text-white rounded-full px-8 py-3.5 inline-flex items-center justify-center gap-2.5 disabled:opacity-60 flex-1 sm:flex-initial"
              style={{ background: "var(--teal)" }}
            >
              <Sparkle size={20} /> {submitState === "busy" ? t.submitting : w.placeOrder}
            </button>
          </div>
          <p className="mt-8 font-display text-xs font-semibold text-muted">{t.submitNote}</p>
          <p className="mt-1.5 text-xs text-muted/80">{t.privacyNote}</p>
          {submitState === "error" && <p className="mt-3 font-display font-semibold text-sm text-pink">{t.errorGeneric}</p>}
        </form>
      )}
    </div>
  );
}

function Err({ msg }: { msg: string }) {
  return <span className="mt-1 block font-display text-xs font-semibold text-pink">{msg}</span>;
}
