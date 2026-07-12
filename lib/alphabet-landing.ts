/**
 * Croatian copy for the shop landing page (app/page.tsx).
 *
 * The landing sells the FORMAT — a personalized keepsake of sturdy leaves (one
 * letter or number per leaf) in a cardboard gift box. Two products share this
 * format and this copy: the alphabet set "Moja prva abeceda" and the numbers
 * set "Moji prvi brojevi" — so the hero/format/leaf sections stay generic
 * ("prva slova ili brojevi"), not alphabet-specific. Per-product names/prices
 * come from lib/landing-copy.ts (COPY.products.cards) and lib/products.ts
 * (never hard-code prices here).
 *
 * Kept separate from lib/landing-copy.ts (which drives the /products catalog,
 * the configure wizard and the order form) so the landing's framing can change
 * without disturbing the order flow. The export name stays ALPHABET_COPY for
 * historical reasons — it's the landing copy.
 */

export interface AlphabetLandingCopy {
  hero: {
    eyebrow: string;
    /** {name} and {box} mark the two colour-accented words in the headline. */
    title: string;
    titleName: string;
    titleBox: string;
    subtitle: string;
    cta: string;
    badgeLeaf: string; // "one letter per leaf" pill
    badgeBox: string; // "in a keepsake box" pill
    personalized: string; // "personalized with your child's name" pill
    coverLabel: string; // subtitle under the name on the personalized front leaf
  };
  trust: string[];
  // the format explainer — photo carousel only, no heading (removed 2026-07-11)
  format: {
    // one caption per carousel image (used as alt text)
    slides: { caption: string }[];
  };
  // what a child does on every leaf
  leaf: {
    heading: string;
    sub: string;
    steps: { title: string; copy: string }[];
  };
  // pricing
  pricing: { heading: string; includes: string[]; note: string };
  // faq
  faq: { heading: string; items: { q: string; a: string }[] };
  footer: string;
}

export const ALPHABET_COPY: AlphabetLandingCopy = {
  hero: {
      eyebrow: "Personalizirani pokloni za prve korake u učenju",
      title: "Moja prva {name} i {box} – pokloni koji se pamte",
      titleName: "slova",
      titleBox: "brojevi",
      subtitle:
        "Personalizirani poklon za djecu od 3 do 6 godina: prva slova ili prvi brojevi, s imenom djeteta, posvetom i diplomom, svako slovo ili broj na svom listiću.",
      cta: "Naruči odmah",
      badgeLeaf: "Slova A–Ž ili brojevi 0–9",
      badgeBox: "U poklon-vrećici",
      personalized: "Personalizirano imenom djeteta",
      coverLabel: "moja prva slova",
    },
    trust: [
      "Personalizirano imenom djeteta",
      "Za uzrast 3 do 6 godina",
      "Edukativno",
      "Napravljeno s ljubavlju u Hrvatskoj",
    ],
    format: {
      slides: [
        { caption: "Stiže u ukrasnoj poklon vrećici s personaliziranim privjeskom, spremno za darivanje." },
        { caption: "Personalizirana naslovnica i po jedan listić za svako slovo ili broj — dijete oboji znak i sličicu, pa ga napiše na crtama." },
      ],
    },
    leaf: {
      heading: "Što dijete radi na svakom listiću",
      sub: "Tri stvari na svakom listiću: boji, prepoznaje i piše.",
      steps: [
        { title: "Oboji veliko slovo ili broj", copy: "Veliki šuplji znak ispunjen je za bojanje, uči se oblik kroz boju." },
        { title: "Oboji sličicu", copy: "Sličica uz svako slovo ili broj za bojanje i prepoznavanje." },
        { title: "Vježba pisanje", copy: "Crte za pisanje s blijedim znakom za precrtavanje, prvi koraci u pisanju." },
      ],
    },
    pricing: {
      heading: "Cijena",
      includes: [
        "Listić za svako slovo abecede ili svaki broj",
        "Osobna posveta i diploma s imenom djeteta",
        "Ukrasna poklon-vrećica s privjeskom",
        "Ručni tisak i dostava u Hrvatskoj",
      ],
      note: "Plaćanje je za sada isključivo uplatom na račun (IBAN), bez plaćanja online. Nakon narudžbe na e-mail dobivate upute za uplatu. Uskoro ćemo omogućiti plaćanje karticom. Dostava: BoxNow paketomat ili Hrvatska pošta.",
    },
    faq: {
      heading: "Česta pitanja",
      items: [
        { q: "Je li to knjiga?", a: "Nije, to je zbirka zasebnih listića (po jedan za svako slovo ili broj), svaki gotov za bojanje i pisanje. Dijete uzima listić po listić, a sve stiže lijepo zapakirano kao poklon." },
        { q: "Kako se plaća?", a: "Za sada isključivo uplatom na račun (IBAN), bez plaćanja online. Narudžbu šaljete bez plaćanja, na e-mail dobivate upute za uplatu i plaćate tek nakon toga. Uskoro ćemo omogućiti plaćanje karticom." },
        { q: "Za koju je dob?", a: "Za djecu od 3 do 6 godina koja uče slova, brojeve i prve korake u pisanju." },
        { q: "Mogu li ga poslati izravno djetetu?", a: "Da. Dostavljamo na Vašu adresu ili izravno na adresu djeteta, kako želite." },
      ],
    },
    footer: "Ručno izrađeno s ljubavlju za radoznalu djecu · Maštograd",
};
