/**
 * The heading of the home page's section, and the words of the first screen's
 * link to it. It reports a habit; it does not advise the reader.
 */
export const WHY_TITLE = "Why people salt their water";

/**
 * Why salt in water, in brief, for the home page. Each line is one the long
 * read's chapter on salt in water says too: that chapter takes both from
 * here, so the two can never differ. Each has the short name of its credit in
 * the list of sources there.
 */
export const WHY_POINTS = [
  {
    line: "When you sweat, you lose salt as well as water. Mainly sodium.",
    credits: ["Baker 2017"],
  },
  {
    line: "Sodium is one of the electrolytes that help balance the water in your body.",
    credits: ["MedlinePlus (NIH)"],
  },
];

/**
 * How much sodium: the labels' own figures beside the government guidance,
 * for the pouch's serving and for a stick, each as its Nutrition Facts print
 * it. A figure is copied from a label and never worked out here. The home
 * page and the long read say it in the same words, from here.
 */
export const SODIUM_NOTE = {
  title: "How much sodium",
  text: "A quarter-teaspoon serving of ÁLAS Classic has 580 mg of sodium, 25% of the Daily Value. One 2.5 g Classic stick has 970 mg, 42% of the Daily Value. US guidelines suggest that people 14 and older keep sodium under 2,300 mg a day. If you watch your sodium or have a medical condition, consult your health practitioner first.",
  credits: ["FDA", "Dietary Guidelines 2025–2030"],
};
