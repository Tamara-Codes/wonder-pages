"use client";

import Link from "next/link";
import { ShopHeader } from "@/components/shop-header";

/**
 * Privacy notice for the order flow. Wonder Pages collects buyer + delivery
 * details and the child's personalization (name, age, etc.) to fulfil a manual
 * order — no online payment, no marketing profiling. Croatian only.
 *
 * EDIT THESE before launch — they appear verbatim in the notice. Leave OIB
 * empty until the obrt is registered (the line is hidden when empty).
 */
const CONTACT_EMAIL = "codewithtamara@gmail.com"; // ← set your business contact email
const BUSINESS_NAME = "Moja slova"; // brand / trading name
const BUSINESS_LEGAL = ""; // registered obrt name once you have it (optional)
const BUSINESS_OIB = ""; // OIB once registered (optional; hidden when empty)
const LAST_UPDATED = "18.06.2026.";

export default function PrivacyPage() {
  const c = HR;
  const controller = [BUSINESS_LEGAL || BUSINESS_NAME, BUSINESS_OIB && `OIB: ${BUSINESS_OIB}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col min-h-full">
      <ShopHeader />
      <main className="flex-1 mx-auto max-w-3xl px-6 py-10 sm:py-14 w-full">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold">{c.title}</h1>
        <p className="text-muted font-semibold mt-2">{c.updated}: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-7">
          <Section heading={c.intro.heading}>
            <p>
              {c.intro.body} <strong>{controller}</strong>.{" "}
              {c.intro.contact}{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal font-bold underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          {c.sections.map((s) => (
            <Section key={s.heading} heading={s.heading}>
              {s.body && <p>{s.body}</p>}
              {s.items && (
                <ul className="mt-2 space-y-1.5 list-disc pl-5">
                  {s.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
              )}
            </Section>
          ))}

          <Section heading={c.rights.heading}>
            <p>{c.rights.body}</p>
            <ul className="mt-2 space-y-1.5 list-disc pl-5">
              {c.rights.items.map((it) => <li key={it}>{it}</li>)}
            </ul>
            <p className="mt-3">
              {c.rights.complaint}{" "}
              <a href="https://azop.hr" target="_blank" rel="noopener noreferrer" className="text-teal font-bold underline">AZOP (azop.hr)</a>.
            </p>
          </Section>
        </div>

        <div className="mt-10">
          <Link href="/" className="font-display font-bold text-teal underline">{c.back}</Link>
        </div>
      </main>
    </div>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-extrabold">{heading}</h2>
      <div className="mt-2 text-foreground font-medium leading-relaxed [&_a]:break-words">{children}</div>
    </section>
  );
}

const HR = {
  title: "Zaštita privatnosti",
  updated: "Posljednja izmjena",
  back: "← Natrag na početnu",
  intro: {
    heading: "Tko obrađuje vaše podatke",
    body: "Vaše osobne podatke obrađuje voditelj obrade",
    contact: "Za sva pitanja o privatnosti i ostvarivanje svojih prava javite se na",
  },
  sections: [
    {
      heading: "Koje podatke prikupljamo",
      body: "Prikupljamo samo podatke potrebne za obradu i dostavu vaše narudžbe:",
      items: [
        "Podaci kupca: ime i prezime, e-mail adresa, broj telefona.",
        "Podaci za dostavu: ulica i broj, grad, poštanski broj te odabrani način dostave (BoxNow ili Hrvatska pošta).",
        "Personalizacija poklona: ime i prezime djeteta, dob, te po želji posveta i drugi podaci koje sami upišete.",
        "Podaci o narudžbi: odabrani proizvod, količina i iskazana cijena.",
      ],
    },
    {
      heading: "Zašto i na temelju čega",
      body: "Podatke koristimo isključivo radi izrade, potvrde i dostave vaše narudžbe te radi kontakta u vezi s njom (pravna osnova: izvršenje ugovora i radnje prije sklapanja ugovora na vaš zahtjev). Ne koristimo ih za profiliranje niti za marketing bez vašeg pristanka.",
    },
    {
      heading: "S kim dijelimo podatke",
      body: "Podatke dijelimo samo u mjeri nužnoj za ispunjenje narudžbe:",
      items: [
        "Tiskara koja izrađuje vaš komplet.",
        "Dostavna služba koju odaberete (BoxNow ili Hrvatska pošta).",
        "Pružatelji tehničke infrastrukture: Vercel (hosting) i Supabase (baza podataka), koji podatke obrađuju u naše ime.",
        "Vaše podatke ne prodajemo niti ustupamo trećima u marketinške svrhe.",
      ],
    },
    {
      heading: "Statistika posjeta",
      body: "Koristimo Vercel Web Analytics za zbirnu statistiku posjeta (broj posjeta i pregledanih stranica). Ta statistika je anonimna i zbirna, ne koristi kolačiće niti stvara vaš osobni profil.",
    },
    {
      heading: "Koliko dugo čuvamo podatke",
      body: "Podatke čuvamo onoliko dugo koliko je potrebno za izvršenje narudžbe i ispunjenje zakonskih obveza (npr. računovodstvenih). Nakon toga ih brišemo ili na vaš zahtjev ranije, ako ne postoji zakonska obveza čuvanja.",
    },
    {
      heading: "Podaci o djetetu",
      body: "Ime i dob djeteta upisuje odrasla osoba koja naručuje, isključivo radi personalizacije poklona. Ne prikupljamo podatke izravno od djece.",
    },
  ],
  rights: {
    heading: "Vaša prava",
    body: "U svakom trenutku imate pravo:",
    items: [
      "zatražiti pristup svojim podacima i njihovu ispravku,",
      "zatražiti brisanje ili ograničenje obrade,",
      "zatražiti prijenos podataka,",
      "uložiti prigovor na obradu.",
    ],
    complaint: "Pritužbu možete podnijeti i nadzornom tijelu:",
  },
};
