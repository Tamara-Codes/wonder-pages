/**
 * Croatian copy for the validation landing page + order wizard. The shop is
 * Croatian-only (English was dropped), so this is a single dictionary read
 * directly as `COPY`.
 *
 * This is a MANUAL order flow, not a live-payment one: the customer "places an
 * order" (full buyer + delivery + gift details) at the shown price, and we
 * follow up by hand with payment + delivery details. The wording says so
 * plainly ("payment arranged after confirmation") — never "test"/"demo".
 *
 * Positioning: led as a *birthday gift*, with "made by hand in Croatia" as the
 * trust frame throughout. Price is shown in euros only (Croatia is on the euro).
 */

export type ProductKey = "activity" | "alphabet" | "numbers" | "bundle";

export interface Copy {
  // header
  nav: { products: string };
  orderCta: string;
  // hero
  hero: {
    eyebrow: string;
    title: string; // {kid} and {gift} mark the two color-accented words
    titleKid: string;
    titleGift: string;
    subtitle: string;
    cta: string;
    ctaNote: string;
    badgeApp: string;
    badgeBooklet: string;
  };
  trust: string[];
  // how it works
  how: { heading: string; steps: { title: string; copy: string }[] };
  // what's inside
  inside: { heading: string; sub: string; items: { title: string; copy: string }[] };
  // the 5 games (activity book contents)
  games: {
    heading: string;
    sub: string;
    items: { id: string; name: string; blurb: string }[];
  };
  // products (3 buyable items)
  products: {
    heading: string;
    sub: string;
    choose: string;
    bundleBadge: string;
    cards: Record<ProductKey, { name: string; tagline: string; contents: string[] }>;
  };
  // landing product showcases (real page samples)
  showcase: {
    activityTitle: string;
    activitySub: string;
    alphabetTitle: string;
    alphabetSub: string;
    personalized: string;
    themesNote: string; // "{n}" placeholder
    sampleName: string;
    loading: string;
    seeAll: string;
    bundleTitle: string;
    bundleSub: string;
    bundleCta: string;
  };
  // configure wizard
  wizard: {
    steps: string[]; // [personalize, preview, order]
    back: string;
    next: string;
    placeOrder: string;
    personalizeHeading: string;
    personalizeSub: string;
    childName: string;
    namePlaceholder: string;
    childAge: string;
    theme: string;
    themePick: string;
    alphabetLang: string;
    // alphabet keepsake inputs + leaf copy
    childSurname: string;
    surnamePlaceholder: string;
    gender: string; // "The child is" label
    genderGirl: string;
    genderBoy: string;
    posvetaLabel: string;
    posvetaPlaceholder: string;
    posvetaHint: string;
    posvetaSample: string; // shown in the preview when the field is empty
    nameLeafLabel: string; // label on the name leaf
    diplomaTitle: string;
    diplomaIntro: string;
    // congrats line — gendered for Croatian (Naučio / Naučila); same for English
    diplomaBodyBoy: string;
    diplomaBodyGirl: string;
    // numbers keepsake variants of the gendered congrats line + sample dedication
    diplomaBodyNumbersBoy: string;
    diplomaBodyNumbersGirl: string;
    posvetaSampleNumbers: string;
    previewHeading: string;
    previewSub: string;
    previewLoading: string;
    previewNote: string;
    pageLabels: Record<string, string>;
    orderHeading: string;
    orderSub: string;
    summaryFor: string; // "for {name}"
    // multi-child ordering (one personalized set per child)
    childLabel: string; // "Child" — shown as "Child 1", "Child 2"
    addChild: string; // "Add another child"
    removeChild: string; // "Remove"
    multiChildHint: string; // sub-line explaining one set per child
    total: string; // "Total" row in the order summary
  };
  // personalization sample
  sample: { heading: string; sub: string; lines: string[] };
  // who it's for
  who: { heading: string; sub: string; items: string[] };
  // pricing
  pricing: {
    heading: string;
    price: string;
    per: string;
    includes: string[];
    note: string;
  };
  // ordering / how the manual flow works
  ordering: { heading: string; steps: string[] };
  // croatia note
  croatia: { badge: string; text: string };
  // order form
  form: {
    heading: string;
    sub: string;
    payInfo: string; // "payment arranged after confirmation" banner
    // section legends
    giftLegend: string;
    buyerLegend: string;
    deliveryLegend: string;
    // gift fields
    childName: string;
    childAge: string;
    theme: string;
    themePick: string;
    occasion: string;
    occasions: { value: string; label: string }[];
    deadline: string;
    // buyer fields
    fullName: string;
    email: string;
    phone: string;
    // delivery fields
    street: string;
    city: string;
    postcode: string;
    country: string;
    countryName: string; // fixed value shown (Croatia only)
    quantity: string;
    // delivery method
    deliveryMethodLabel: string;
    deliveryBoxnow: string;
    deliveryBoxnowDesc: string;
    deliveryPosta: string;
    deliveryPostaDesc: string;
    // note
    note: string;
    notePlaceholder: string;
    optional: string;
    // submit
    submit: string;
    submitting: string;
    submitNote: string; // small note under the button
    privacyNote: string; // one-line GDPR / data-use basis under the button
    // success
    successTitle: string;
    successBody: string;
    // errors
    errorGeneric: string;
    errorFullName: string;
    errorEmail: string;
    errorStreet: string;
    errorCity: string;
    errorPostcode: string;
    errorDelivery: string;
  };
  // faq
  faq: { heading: string; items: { q: string; a: string }[] };
  footer: string;
}

export const COPY: Copy = {
  nav: { products: "Proizvodi" },
    orderCta: "Naruči odmah",
    hero: {
      eyebrow: "Personalizirani poklon za dijete",
      title: "Pretvorite svijet koji {kid} voli u {gift} koji se pamti",
      titleKid: "dijete",
      titleGift: "poklon",
      subtitle:
        "Personalizirana tiskana bojanka i knjižica aktivnosti za djecu od 3 do 8 godina. Odaberete temu koju dijete voli i njegovo ime — mi je izradimo, otisnemo i dostavimo u Hrvatskoj. Savršen rođendanski poklon koji ne ovisi o ekranu.",
      cta: "Naruči odmah",
      ctaNote: "Narudžbu potvrđujemo i šaljemo upute za plaćanje naknadno · dostava u Hrvatskoj",
      badgeApp: "Oboji u aplikaciji",
      badgeBooklet: "Naruči kao poklon",
    },
    trust: [
      "Ime djeteta na koricama i unutra",
      "Bez ekrana — papir i bojice",
      "Za uzrast 3–8 godina",
    ],
    how: {
      heading: "Kako funkcionira",
      steps: [
        {
          title: "Vi odaberete",
          copy: "Recite nam ime djeteta, koliko ima godina i koju temu voli — jednorozi, dinosauri, svemir, princeze i još mnogo toga.",
        },
        {
          title: "Mi izradimo",
          copy: "Složimo knjižicu od 40 stranica oko te teme, s imenom djeteta utkanim kroz stranice, i ručno je otisnemo u Hrvatskoj.",
        },
        {
          title: "Stiže na vrata",
          copy: "Dostavimo gotovu, uvezanu knjižicu na vašu adresu ili izravno djetetu — spremnu za poklon.",
        },
      ],
    },
    inside: {
      heading: "Što je unutra",
      sub: "Jedna knjižica, puna stranica za bojanje, igru i učenje — sve u temi koju dijete obožava.",
      items: [
        { title: "Stranice za bojanje", copy: "Velike, jasne ilustracije u odabranoj temi, baš za male ruke i bojice." },
        { title: "Labirinti i zagonetke", copy: "Pronađi put, spoji parove, pronađi različito — zabava koja vježba pažnju." },
        { title: "Vježbe pisanja", copy: "Crtanje linija i slova, uključujući ime djeteta — prvi koraci u pisanju." },
        { title: "Osobna posveta", copy: "„Ova knjižica pripada…” s imenom djeteta — poklon koji je samo njihov." },
      ],
    },
    games: {
      heading: "Pet vrsta stranica u knjižici aktivnosti",
      sub: "Svaka knjižica spaja pet vrsta stranica — sve u temi koju dijete voli.",
      items: [
        { id: "coloring", name: "Bojanje", blurb: "Velike, jasne ilustracije za bojanje u odabranoj temi." },
        { id: "maze", name: "Labirint", blurb: "Pronađi pravi put od početka do cilja." },
        { id: "match-pairs", name: "Spoji parove", blurb: "Spoji ono što ide zajedno — pčela i cvijet, ključ i lokot." },
        { id: "tracing", name: "Pisanje linija", blurb: "Precrtaj linije, valove i slova — priprema za pisanje." },
        { id: "odd-one-out", name: "Pronađi različito", blurb: "Koje ne pripada skupini? Pronađi različito." },
      ],
    },
    products: {
      heading: "Odaberite svoju knjižicu",
      sub: "Knjižica aktivnosti, slikovnica abecede — ili oba kompleta po nižoj cijeni.",
      choose: "Odaberi",
      bundleBadge: "Ušteda €5",
      cards: {
        activity: {
          name: "Knjižica aktivnosti",
          tagline: "40 stranica zabave u temi koju dijete voli.",
          contents: ["Bojanje, labirinti i zagonetke", "Tema po izboru (jednorozi, dinosauri…)", "Ime djeteta na koricama i unutra"],
        },
        alphabet: {
          name: "Moja prva abeceda",
          tagline: "Cijela abeceda — slovo i sličica na svakom listiću.",
          contents: ["Slovo, riječ i sličica za bojanje", "Vježba pisanja na crtama", "Hrvatska ili engleska abeceda"],
        },
        numbers: {
          name: "Moji prvi brojevi",
          tagline: "Brojevi 0–9 — broj i sličica za prebrojavanje na svakom listiću.",
          contents: ["Broj, riječ i sličica za bojanje", "Onoliko sličica koliko je i broj", "Vježba pisanja brojeva na crtama"],
        },
        bundle: {
          name: "Oba kompleta",
          tagline: "Abeceda + brojevi zajedno, po nižoj cijeni.",
          contents: ["Komplet abecede i komplet brojeva", "Personalizirano imenom djeteta", "Niža cijena nego odvojeno"],
        },
      },
    },
    showcase: {
      activityTitle: "Knjižica aktivnosti — pogledajte svaku stranicu",
      activitySub: "Bojanje, labirinti, spajanje parova, pisanje linija i „pronađi različito” — sve u temi koju dijete voli.",
      alphabetTitle: "Slikovnica abecede — slovo po slovo",
      alphabetSub: "Cijela abeceda: veliko slovo za bojanje, sličica i crte za vježbanje pisanja.",
      personalized: "Personalizirano imenom djeteta",
      themesNote: "Birajte između {n} tema",
      sampleName: "Ema",
      loading: "Pripremam stranice…",
      seeAll: "Personalizirajte svoju",
      bundleTitle: "Uzmite oba kompleta i uštedite €5",
      bundleSub: "Abeceda + brojevi zajedno za €25 (umjesto €30).",
      bundleCta: "Uzmi oba",
    },
    wizard: {
      steps: ["Personalizacija", "Pregled", "Narudžba"],
      back: "Natrag",
      next: "Dalje",
      placeOrder: "Pošalji narudžbu",
      personalizeHeading: "Personalizirajte poklon",
      personalizeSub: "Recite nam ime djeteta i nekoliko detalja — odmah vidite pregled.",
      childName: "Ime djeteta",
      namePlaceholder: "npr. Ema",
      childAge: "Dob djeteta",
      theme: "Tema",
      themePick: "Odaberite temu",
      alphabetLang: "Jezik abecede",
      childSurname: "Prezime djeteta",
      surnamePlaceholder: "npr. Horvat",
      gender: "Dijete je",
      genderGirl: "Djevojčica",
      genderBoy: "Dječak",
      posvetaLabel: "Posveta",
      posvetaPlaceholder: "Draga Ema,\nneka ti ova slova otvore vrata cijelog svijeta.\n\nVolimo te!\nMama i tata",
      posvetaHint: "Vaša osobna poruka — svaki red ide u zaseban redak na listiću.",
      posvetaSample: "Draga Ema,\nneka ti ova slova otvore vrata cijelog svijeta.\n\nVolimo te!\nMama i tata",
      nameLeafLabel: "Moje ime",
      diplomaTitle: "Diploma",
      diplomaIntro: "ovu diplomu ponosno nosi",
      diplomaBodyBoy: "Bravo! Naučio si svoja prva slova.",
      diplomaBodyGirl: "Bravo! Naučila si svoja prva slova.",
      diplomaBodyNumbersBoy: "Bravo! Naučio si brojeve od 0 do 9.",
      diplomaBodyNumbersGirl: "Bravo! Naučila si brojeve od 0 do 9.",
      posvetaSampleNumbers: "Dragi Luka,\nneka ti ovi brojevi otvore vrata svijeta brojanja i igre.\n\nVolimo te!\nMama i tata",
      previewHeading: "Pregled poklona",
      previewSub: "Ovo je primjer listića — gotova abeceda ima listić za svako slovo.",
      previewLoading: "Pripremam pregled…",
      previewNote: "Stranice za bojanje su primjeri; konačne ilustracije izrađujemo u odabranoj temi.",
      pageLabels: {
        cover: "Korice",
        dedication: "Posveta",
        posveta: "Posveta",
        name: "Moje ime",
        diploma: "Diploma",
        maze: "Labirint",
        "match-pairs": "Spoji parove",
        tracing: "Pisanje linija",
        "odd-one-out": "Pronađi različito",
        coloring: "Bojanje",
        alphabet: "Abeceda",
        numbers: "Brojevi",
        number: "Broj",
      },
      orderHeading: "Dovršite narudžbu",
      orderSub: "Recite nam kamo šaljemo — javljamo se osobno da potvrdimo narudžbu i plaćanje.",
      summaryFor: "{name}",
      childLabel: "Dijete",
      addChild: "Dodaj još jedno dijete",
      removeChild: "Ukloni",
      multiChildHint: "Jedan komplet po djetetu. Naručujete za više djece? Dodajte svako sa svojim imenom.",
      total: "Ukupno",
    },
    sample: {
      heading: "Što znači „personalizirano”",
      sub: "Svaka knjižica je drukčija — građena oko jednog djeteta.",
      lines: [
        "Ime djeteta na koricama i kroz cijelu knjižicu",
        "Tema koju dijete voli određuje sve ilustracije",
        "Težina prilagođena uzrastu (3–4, 5–6, 7–8)",
        "Labirint i vježbe pisanja s njihovim imenom",
      ],
    },
    who: {
      heading: "Za koga je",
      sub: "Poklon koji roditelji, bake, djedovi, tete i prijatelji traže za poseban dan.",
      items: [
        "Djeca od 3 do 8 godina",
        "Rođendanski poklon s imenom",
        "Roditelji koji žele manje ekrana",
        "Bake i djedovi koji traže nešto posebno",
      ],
    },
    pricing: {
      heading: "Cijena",
      price: "€25",
      per: "po knjižici, sve uključeno",
      includes: [
        "40 personaliziranih stranica",
        "Ime djeteta na koricama i unutra",
        "Ručni tisak i uvez u Hrvatskoj",
        "Dostava unutar Hrvatske",
      ],
      note: "Plaćate uplatom na račun nakon što potvrdimo narudžbu; abecedu šaljemo čim zaprimimo uplatu.",
    },
    ordering: {
      heading: "Kako se naručuje",
      steps: [
        "Pošaljete narudžbu putem obrasca (bez plaćanja online).",
        "Na e-mail dobivate potvrdu i upute za plaćanje uplatom na račun.",
        "Platite uplatom na račun — čim zaprimimo uplatu, izrađujemo i tiskamo abecedu.",
        "Dostavljamo je putem BoxNow paketomata ili Hrvatske pošte.",
      ],
    },
    croatia: {
      badge: "Zasad samo Hrvatska",
      text: "Za sada izrađujemo i dostavljamo samo unutar Hrvatske, kako bismo svaku knjižicu napravili pažljivo i ručno. Ako ste izvan Hrvatske, ostavite e-mail — javit ćemo se kad proširimo.",
    },
    form: {
      heading: "Dovršite narudžbu",
      sub: "Recite nam za koga je i kamo šaljemo — javljamo se osobno da potvrdimo narudžbu i dogovorimo plaćanje.",
      payInfo: "Svaki poklon izrađujemo individualno s imenom djeteta. Čim pošaljete narudžbu, na e-mail dobivate potvrdu, a zatim vam se javljamo osobno s detaljima za plaćanje i dostavu. Plaćanje je isključivo uplatom na račun (IBAN) — nema plaćanja online ni karticom. Abecedu izrađujemo i šaljemo tek nakon zaprimljene uplate.",
      giftLegend: "Za koga je",
      buyerLegend: "Vaši podaci",
      deliveryLegend: "Dostava (unutar Hrvatske)",
      childName: "Ime djeteta",
      childAge: "Dob djeteta",
      theme: "Tema",
      themePick: "Odaberite temu",
      occasion: "Prigoda",
      occasions: [
        { value: "birthday", label: "Rođendan" },
        { value: "holiday", label: "Blagdani" },
        { value: "just-because", label: "Bez posebnog povoda" },
        { value: "other", label: "Drugo" },
      ],
      deadline: "Treba li do određenog datuma?",
      fullName: "Ime i prezime",
      email: "E-mail",
      phone: "Telefon",
      street: "Adresa (ulica i broj)",
      city: "Grad",
      postcode: "Poštanski broj",
      country: "Država",
      countryName: "Hrvatska",
      quantity: "Količina",
      deliveryMethodLabel: "Način dostave",
      deliveryBoxnow: "BoxNow paketomat",
      deliveryBoxnowDesc: "Preuzimanje u paketomatu blizu vas — bilo gdje u Hrvatskoj",
      deliveryPosta: "Hrvatska pošta",
      deliveryPostaDesc: "Dostava na vašu kućnu adresu",
      note: "Napomena",
      notePlaceholder: "Bilo što što bismo trebali znati…",
      optional: "nije obavezno",
      submit: "Pošalji narudžbu",
      submitting: "Šaljem…",
      submitNote: "Na e-mail vam šaljemo potvrdu narudžbe i upute za plaćanje — isključivo uplatom na račun (IBAN), bez plaćanja online. Abecedu izrađujemo i šaljemo nakon zaprimljene uplate.",
      privacyNote:
        "Vaše podatke koristimo isključivo za obradu i potvrdu ove narudžbe i ne dijelimo ih s trećima.",
      successTitle: "Narudžba zaprimljena",
      successBody:
        "Hvala na narudžbi! Uskoro vam na e-mail stižu potvrda i upute za plaćanje uplatom na račun. Abecedu šaljemo čim zaprimimo uplatu.",
      errorGeneric: "Nešto je pošlo po zlu — pokušajte ponovno.",
      errorFullName: "Upišite ime i prezime.",
      errorEmail: "Upišite ispravan e-mail.",
      errorStreet: "Upišite adresu.",
      errorCity: "Upišite grad.",
      errorPostcode: "Upišite poštanski broj.",
      errorDelivery: "Odaberite način dostave.",
    },
    faq: {
      heading: "Česta pitanja",
      items: [
        { q: "Kako se plaća?", a: "Isključivo uplatom na račun (IBAN) — nema plaćanja online ni karticom. Narudžbu šaljete bez plaćanja, a na e-mail dobivate potvrdu i upute za uplatu. Abecedu izrađujemo i šaljemo čim zaprimimo uplatu." },
        { q: "Koliko stoji?", a: "€25 po knjižici, sve uključeno — izrada, tisak i dostava unutar Hrvatske." },
        { q: "Za koju je dob?", a: "Za djecu od 3 do 8 godina. Težinu stranica prilagođavamo dobi koju upišete." },
        { q: "Koliko traje izrada i dostava?", a: "Obično nekoliko dana. Ako imate rok (npr. rođendan), upišite ga i potrudit ćemo se stići na vrijeme." },
        { q: "Mogu li je poslati izravno djetetu?", a: "Da — dostavljamo na vašu adresu ili izravno na adresu djeteta, kako želite." },
      ],
    },
    footer: "Ručno izrađeno s ljubavlju za radoznalu djecu · Moja slova",
};
