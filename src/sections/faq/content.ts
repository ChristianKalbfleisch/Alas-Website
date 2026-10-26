/** Answers use only docs/content-facts.md and the product catalogue. */

export type Faq = {
  q: string;
  a: string;
  link?: { href: string; label: string };
};

export const FAQS: Faq[] = [
  {
    q: "Isn't salt bad for me?",
    a: "Your body needs sodium, and you lose it every time you sweat. Like most good things, the amount matters. If you are on a sodium-restricted diet or have a medical condition, check with your doctor before adding salt to your water.",
  },
  {
    q: "How do I use it?",
    a: "At home, the morning pinch: a pinch of salt in a glass of water. On the go, tear a stick into your bottle, shake or stir, and drink. A squeeze of lemon is lovely too.",
    link: { href: "#howto", label: "See how it works" },
  },
  {
    q: "What does it taste like? Can I cook with it?",
    a: "Clean and briny, softer than table salt, and lovely with a squeeze of lemon. In the kitchen it is a finishing salt: scatter a pinch over your food just before you eat.",
  },
  {
    q: "Sticks or pouch?",
    a: "Pouches are for home: the morning pinch, and the kitchen. Choose Mikró (one pouch), Mésos (two) or Megálo (four). Hydration Sticks are single servings for the gym bag, the desk and the plane, in packs of 5, 15 or 30.",
    link: { href: "#shop", label: "Find your size" },
  },
  {
    q: "How is it different from table salt or pink salt?",
    a: "Table salt is refined to almost pure sodium chloride, and anti-caking agents are often added. ALAS is unrefined sea salt from the Aegean, with no anti-caking agents or additives. It keeps small amounts of the minerals that were in the seawater, such as magnesium, potassium and calcium. With any salt, where it comes from and how little is done to it decides what is in it.",
  },
  {
    q: "Can I use it for a saltwater rinse?",
    a: "Yes. A warm saltwater rinse is an old Mediterranean kitchen habit: dissolve a pinch in warm water, rinse, then spit it out. Do not swallow the rinse.",
  },
  {
    q: "Where does it come from?",
    a: "Harvested in Greece, packaged in the USA. Aegean seawater dries slowly in shallow pans under the summer sun and wind, and the crystals that form on the surface are raked by hand.",
  },
  {
    q: "Which flavours are there?",
    a: "Regular, today. Blueberry and Lemon are coming soon.",
  },
  {
    q: "What about shipping and returns?",
    a: "Shipping is free anywhere in the USA. And if ALAS is not for you, our 30-day money-back guarantee has you covered.",
  },
  {
    q: "Is there a subscription?",
    a: "Yes, The Ritual: two pouches every month for $59.99, instead of $99.98 for two bought one at a time. That is 40% less. It opens soon; join the list to hear first.",
    link: { href: "#club", label: "Join The Ritual" },
  },
];

export const CONTACT_EMAIL = "admin@alassaltco.com";
