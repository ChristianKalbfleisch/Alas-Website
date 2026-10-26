import { type ArtImage, art } from "@/data/art";

/** Two stories anyone repeats to a friend. Each ends on a feeling. */
export type Moment = {
  key: string;
  label: string;
  statement: string;
  line: string;
  /** Optional original words, small, with a plain gloss. */
  original?: { text: string; lang: "grc"; gloss: string };
  image: ArtImage;
};

export const MOMENTS: Moment[] = [
  {
    key: "wage",
    label: "/ Legend",
    statement: "Legend says salt was a wage.",
    line: "Roman soldiers, the story goes, were paid in salt, and it gave us the word salary. Historians doubt it. We like it anyway.",
    image: art.museum.coins,
  },
  {
    key: "friends",
    label: "/ Friendship",
    statement: "To share salt was to be friends.",
    line: "The Greeks swore oaths by salt and table. If someone passed you the salt, you were welcome.",
    original: {
      text: "ἅλας τε καὶ τράπεζαν",
      lang: "grc",
      gloss: "by salt and table",
    },
    image: art.museum.bowl,
  },
];
