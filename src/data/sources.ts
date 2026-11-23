/**
 * Every fact on the History & Science page, credited. Each chapter lists its
 * own sources under it, and the full list closes the page, like the footnotes
 * of a research paper. Ancient texts link to public-domain
 * translations; lines about the body link to government or peer-reviewed
 * sources, and none of them is tied to the product.
 */

export type Chapter = "alas" | "myth" | "origin" | "why";

export type Source = {
  chapter: Chapter;
  /** What the page says, in short. */
  claim: string;
  /** Author or publisher, title, year, exact place. */
  credit: string;
  /** A few words for the strip under the chapter. */
  short: string;
  /** Where it can be read; absent for documents that are not online. */
  url?: string;
};

export const SOURCES: Source[] = [
  {
    chapter: "alas",
    claim: "ἅλας is Greek for salt, a later form of the older word ἅλς.",
    credit:
      "Liddell, Scott and Jones, A Greek-English Lexicon (9th ed., 1940), entries ἅλς and ἅλας",
    short: "LSJ lexicon, ἅλας",
    url: "https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.04.0057:entry=a(/ls1",
  },
  {
    chapter: "alas",
    claim: "In early Greek poetry, ἅλς could also mean the sea near the shore.",
    credit:
      "Liddell, Scott and Jones, A Greek-English Lexicon (9th ed., 1940), entry ἅλς (B)",
    short: "LSJ lexicon, ἅλς",
    url: "https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.04.0057:entry=a(/ls2",
  },
  {
    chapter: "alas",
    claim: "ἅλας is the salt in “you are the salt of the earth”.",
    credit:
      "Westcott and Hort, The New Testament in the Original Greek (1885), Matthew 5:13",
    short: "Matthew 5:13",
    url: "https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0155:book=Matthew:chapter=5:verse=13",
  },
  {
    chapter: "myth",
    claim: "The Roman writer Pliny tied the word salarium, salary, to salt.",
    credit:
      "Pliny the Elder, Natural History 31.89 (book 31, ch. 41), tr. Bostock and Riley (1855)",
    short: "Pliny, Natural History",
    url: "https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0137:book=31:chapter=41",
  },
  {
    chapter: "myth",
    claim:
      "No ancient evidence shows Roman soldiers were paid in salt; the story comes from later dictionaries.",
    credit:
      "Peter Gainsford, “Salt and salary: were Roman soldiers paid in salt?”, Kiwi Hellenist (2017)",
    short: "Gainsford 2017",
    url: "https://kiwihellenist.blogspot.com/2017/01/salt-and-salary.html",
  },
  {
    chapter: "myth",
    claim:
      "A Greek saying held that people cannot know each other until they have eaten salt together.",
    credit:
      "Aristotle, Nicomachean Ethics VIII.3, 1156b, tr. W. D. Ross (1908)",
    short: "Aristotle, Ethics",
    url: "http://classics.mit.edu/Aristotle/nicomachaen.8.viii.html",
  },
  {
    chapter: "myth",
    claim:
      "Sharing salt at someone's table was a Greek bond of friendship: “Where is the salt? Where is the table?”",
    credit:
      "Demosthenes, On the False Embassy 19.189, tr. C. A. and J. H. Vince (1926)",
    short: "Demosthenes 19.189",
    url: "https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0072:speech=19:section=189",
  },
  {
    chapter: "myth",
    claim: "Homer calls salt divine.",
    credit: "Homer, Iliad 9.214, ed. Monro and Allen (1920)",
    short: "Homer, Iliad 9.214",
    url: "https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0133:book=9:line=214",
  },
  {
    chapter: "myth",
    claim: "Plato reports that salt was called dear to the gods.",
    credit: "Plato, Timaeus 60e, ed. Burnet (1903); tr. Jowett",
    short: "Plato, Timaeus",
    url: "https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0179:text=Tim.:section=60e",
  },
  {
    chapter: "origin",
    claim:
      "Sea salt is made by letting the sun evaporate seawater in shallow ponds and pans.",
    credit:
      "Encyclopaedia Britannica, “salt”: Salt manufacture, solar evaporation (2026)",
    short: "Britannica",
    url: "https://www.britannica.com/science/salt/Salt-manufacture",
  },
  {
    chapter: "origin",
    claim:
      "Fleur de sel forms on the surface of the pans with wind and sun, and is skimmed off by hand.",
    credit:
      "Official Journal of the European Union C/2025/3939 (2025), specification for Fleur de sel de Guérande, section 5",
    short: "EU fleur de sel rules",
    url: "https://eur-lex.europa.eu/eli/C/2025/3939/oj/eng/pdf",
  },
  {
    chapter: "origin",
    claim:
      "Our salt is collected by hand from the surface of Mediterranean salt pans in Greece and kept in its original form, with nothing added to it.",
    credit:
      "The producer's certificate of analysis for this fleur de sel (October 2026); its figures are printed on the pouch",
    short: "Supplier certificate",
  },
  {
    chapter: "why",
    claim:
      "Sweat carries water and electrolytes, and sodium is the one lost in the greatest amount.",
    credit:
      "Baker LB, “Sweating Rate and Sweat Sodium Concentration in Athletes”, Sports Medicine 47 (Suppl 1), 2017; the author works for the Gatorade Sports Science Institute",
    short: "Baker 2017",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5371639/",
  },
  {
    chapter: "why",
    claim:
      "Electrolytes such as sodium help balance the amount of water in your body.",
    credit:
      "MedlinePlus, US National Library of Medicine, “Fluid and Electrolyte Balance” (2024)",
    short: "MedlinePlus (NIH)",
    url: "https://medlineplus.gov/fluidandelectrolytebalance.html",
  },
  {
    chapter: "why",
    claim:
      "Table salt is processed to remove impurities and often has anti-caking agents such as calcium silicate.",
    credit:
      "Harvard T.H. Chan School of Public Health, The Nutrition Source, “Salt and Sodium” (2023)",
    short: "Harvard Nutrition Source",
    url: "https://nutritionsource.hsph.harvard.edu/salt-and-sodium/",
  },
  {
    chapter: "why",
    claim:
      "US rules allow calcium silicate in table salt as an anti-caking agent, up to 2%.",
    credit: "US Code of Federal Regulations, 21 CFR 182.2227 (2025)",
    short: "21 CFR 182.2227",
    url: "https://www.govinfo.gov/content/pkg/CFR-2025-title21-vol3/pdf/CFR-2025-title21-vol3-sec182-2227.pdf",
  },
  {
    chapter: "why",
    claim:
      "The Daily Value for sodium is less than 2,300 mg a day; % Daily Value is one serving's share of it.",
    credit: "US Food and Drug Administration, “Sodium in Your Diet” (2024)",
    short: "FDA",
    url: "https://www.fda.gov/food/nutrition-education-resources-materials/sodium-your-diet",
  },
  {
    chapter: "why",
    claim:
      "People 14 and older should have less than 2,300 mg of sodium a day.",
    credit:
      "HHS and USDA, Dietary Guidelines for Americans, 2025–2030 (2026), page 5",
    short: "Dietary Guidelines 2025–2030",
    url: "https://cdn.realfood.gov/DGA.pdf",
  },
];

export const CHAPTER_TITLES: Record<Chapter, string> = {
  alas: "The word",
  myth: "Myth and history",
  origin: "How it is made",
  why: "Why salt in water",
};

/** 1-based numbers, in page order, so chapter strips and the list agree. */
export const numbered = SOURCES.map((source, i) => ({ ...source, n: i + 1 }));

export const sourcesFor = (chapter: Chapter) =>
  numbered.filter((source) => source.chapter === chapter);
