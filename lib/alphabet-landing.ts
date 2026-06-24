/**
 * Croatian copy for the shop landing page (app/page.tsx).
 *
 * The landing sells the FORMAT — a personalized keepsake of sturdy leaves (one
 * letter per leaf) in a cardboard gift box. Currently a single product: the
 * alphabet set "Moja prva abeceda" (numbers/bundle kept in code but NOT surfaced
 * here). Per-product names/prices come from lib/landing-copy.ts
 * (COPY.products.cards) and lib/products.ts (never hard-code prices here).
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
  // the format explainer — "a box of letters, not a book" (image carousel)
  format: {
    heading: string;
    sub: string;
    // one caption per carousel image (box · box + leaves · colored leaves)
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
      eyebrow: "Personalizirani poklon za prve korake u učenju",
      title: "Moja prva {name} — poklon koji se pamti",
      titleName: "abeceda",
      titleBox: "",
      subtitle:
        "Personalizirani poklon za djecu od 2 do 6 godina: cijela abeceda, s imenom djeteta, posvetom i diplomom, svako slovo na svom listiću.",
      cta: "Naruči odmah",
      badgeLeaf: "Slova A–Ž",
      badgeBox: "U poklon-kutiji",
      personalized: "Personalizirano imenom djeteta",
      coverLabel: "moja prva slova",
    },
    trust: [
      "Personalizirano imenom djeteta",
      "Za uzrast 2–6 godina",
    ],
    format: {
      heading: "Kutija listića, ne knjiga",
      sub: "Komplet stiže kao set zasebnih listića u poklon-kutiji, uz posvetu, listić s imenom i završnu diplomu.",
      slides: [
        { caption: "Po jedan listić za svako slovo — cijela abeceda A–Ž." },
        { caption: "Dijete oboji veliki znak i sličicu, pa ga napiše na crtama." },
        { caption: "Od praznih linija do gotovog djela — listić koji se ponosno čuva." },
      ],
    },
    leaf: {
      heading: "Što dijete radi na svakom listiću",
      sub: "Tri stvari na svakom listiću: boji, prepoznaje i piše.",
      steps: [
        { title: "Oboji veliko slovo", copy: "Veliko šuplje slovo ispunjeno je za bojanje, uči se oblik kroz boju." },
        { title: "Oboji sličicu", copy: "Sličica uz svako slovo („A kao Avion”) za bojanje i prepoznavanje glasa." },
        { title: "Napiši na crtama", copy: "Crte za pisanje s blijedim znakom za precrtavanje, prvi koraci u pisanju." },
      ],
    },
    pricing: {
      heading: "Cijena",
      includes: [
        "Listić za svako slovo abecede",
        "Osobna posveta i diploma s imenom djeteta",
        "Kartonska poklon-kutija",
        "Ručni tisak i dostava u Hrvatskoj",
      ],
      note: "Plaćanje je isključivo uplatom na račun (IBAN) — bez plaćanja online. Nakon narudžbe na e-mail dobivate upute za uplatu. Dostava: BoxNow paketomat ili Hrvatska pošta.",
    },
    faq: {
      heading: "Česta pitanja",
      items: [
        { q: "Je li to knjiga?", a: "Nije — to je komplet zasebnih listića (po jedan za svako slovo), svaki gotov za bojanje i pisanje. Dijete uzima listić po listić, a sve stiže lijepo zapakirano kao poklon." },
        { q: "Što sve dijete dobije?", a: "Cijelu abecedu A–Ž, a uz to posvetu, listić s imenom te završnu diplomu — svako na svom listiću." },
        { q: "Kako se plaća?", a: "Isključivo uplatom na račun (IBAN) — bez plaćanja online. Narudžbu šaljete bez plaćanja, na e-mail dobivate upute za uplatu i plaćate tek nakon toga." },
        { q: "Za koju je dob?", a: "Za djecu od 2 do 6 godina koja uče slova i prve korake u pisanju." },
        { q: "Mogu li ga poslati izravno djetetu?", a: "Da. Dostavljamo na vašu adresu ili izravno na adresu djeteta, kako želite." },
      ],
    },
    footer: "Ručno izrađeno s ljubavlju za radoznalu djecu · Moja slova",
};
