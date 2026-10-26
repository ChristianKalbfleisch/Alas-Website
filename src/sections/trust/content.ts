/** Every line here comes from docs/content-facts.md and revision 1. */

export const MANIFESTO = {
  lead: "Real salt, from real hands.",
  /** The one italic word is marked with *asterisks*. */
  rest: "We believe in small rituals, kept *every* day and shared around your table.",
} as const;

/**
 * PLACEHOLDER sample voices. No real reviews exist yet; these are shown with a
 * visible "Preview" tag and must be replaced by real, consented reviews.
 */
export const VOICES = [
  {
    quote:
      "The morning pinch has become the quietest part of my day. Water, a little salt, then coffee.",
    name: "Elena",
    city: "Austin",
  },
  {
    quote:
      "A stick in my bottle before a long run. It tastes clean, and there is nothing in it I have to look up.",
    name: "Marcus",
    city: "Denver",
  },
  {
    quote:
      "It tastes like the sea, only softer. The pouch lives next to the stove now.",
    name: "Sofia",
    city: "Brooklyn",
  },
  {
    quote:
      "I fly every week. The sticks ride in my carry-on, one for every flight.",
    name: "James",
    city: "Chicago",
  },
  {
    quote:
      "Water, a squeeze of lemon, a pinch of Mikró. That is how my summer mornings start.",
    name: "Nia",
    city: "San Diego",
  },
] as const;
